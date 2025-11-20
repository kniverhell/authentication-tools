const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { User, TrustedDevice } = require('./models');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// --- Helpers ---

// Mock bcrypt for this environment since we can't run native modules without install
// In a real env, use: const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);
const hashPassword = async (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');
const comparePassword = async (pwd, hash) => (await hashPassword(pwd)) === hash;

const generateToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// --- Middleware ---

const authenticate = async (req, res, next) => {
    // Simplified session for demo: assume userId is passed in header or cookie
    // In real app, use JWT or session ID
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = User.findById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
};

// --- Routes ---

// Initialize with a demo user
(async () => {
    const pwdHash = await hashPassword('password123');
    User.create('demo_user', pwdHash, true); // MFA Enabled by default
    console.log('Demo user created: demo_user / password123 (MFA Enabled)');
})();

app.post('/api/login', async (req, res) => {
    const { username, password, mfaCode } = req.body;
    const trustedDeviceToken = req.cookies.trusted_device_token;

    const user = User.findByUsername(username);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
        let deviceTrusted = false;

        // Check Trusted Device Cookie
        if (trustedDeviceToken) {
            const tokenHash = hashToken(trustedDeviceToken);
            const device = TrustedDevice.findByUserIdAndTokenHash(user.id, tokenHash);

            if (device) {
                deviceTrusted = true;
                // Update last used
                device.lastUsedAt = new Date();
                console.log(`Trusted device used: ${device.id}`);
            }
        }

        if (!deviceTrusted) {
            // If not trusted, require MFA code
            if (!mfaCode) {
                return res.status(403).json({ error: 'MFA_REQUIRED', message: 'MFA code required' });
            }

            // Validate MFA Code (Mock validation)
            if (mfaCode !== '123456') {
                return res.status(401).json({ error: 'Invalid MFA code' });
            }
        }
    }

    // Login Success
    // In real app, set session/JWT here
    res.json({
        message: 'Login successful',
        userId: user.id,
        username: user.username
    });
});

app.post('/api/trust-device', authenticate, (req, res) => {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip;

    const token = generateToken();
    const tokenHash = hashToken(token);

    const device = TrustedDevice.create(req.user.id, tokenHash, userAgent, ipAddress);

    // Set secure cookie
    res.cookie('trusted_device_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // false for local dev
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
        message: 'Device trusted successfully',
        deviceId: device.id
    });
});

app.get('/api/devices', authenticate, (req, res) => {
    const devices = TrustedDevice.listByUser(req.user.id);
    res.json({ devices });
});

app.delete('/api/devices/:id', authenticate, (req, res) => {
    const { id } = req.params;
    // Ensure device belongs to user
    const devices = TrustedDevice.listByUser(req.user.id);
    const device = devices.find(d => d.id === id);

    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    TrustedDevice.revoke(id);
    res.json({ message: 'Device revoked' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
