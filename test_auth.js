const http = require('http');

// Helper to make requests
function request(path, method, body, cookies = {}) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                // Extract cookies
                const newCookies = {};
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    setCookie.forEach(c => {
                        const parts = c.split(';');
                        const [key, val] = parts[0].split('=');
                        newCookies[key] = val;
                    });
                }

                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(responseBody),
                        cookies: newCookies
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: responseBody, cookies: newCookies });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Trusted Device API Tests ---\n');

    // 1. Try Login without MFA (Should fail/require MFA)
    console.log('1. Attempting Login WITHOUT MFA...');
    const res1 = await request('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123'
    });
    console.log(`   Status: ${res1.status}`);
    console.log(`   Body:`, res1.body);
    if (res1.status === 403 && res1.body.error === 'MFA_REQUIRED') {
        console.log('   ✅ PASS: MFA was required as expected.\n');
    } else {
        console.log('   ❌ FAIL: Expected MFA_REQUIRED.\n');
    }

    // 2. Login WITH MFA (Should succeed)
    console.log('2. Attempting Login WITH MFA...');
    const res2 = await request('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123',
        mfaCode: '123456'
    });
    console.log(`   Status: ${res2.status}`);
    console.log(`   Body:`, res2.body);
    const userId = res2.body.userId;
    if (res2.status === 200 && userId) {
        console.log('   ✅ PASS: Login successful.\n');
    } else {
        console.log('   ❌ FAIL: Login failed.\n');
        return;
    }

    // 3. Trust this device
    console.log('3. Trusting this device...');
    // We need to simulate being authenticated. In our simple server, we just need the user ID? 
    // Ah, the server middleware checks `x-user-id` header for simplicity in `authenticate` middleware.
    // Let's update the request helper to support headers or just hack it here.
    // Wait, my `request` helper doesn't support custom headers easily.
    // Let's modify the `authenticate` middleware in server.js to actually use a session or just pass the ID.
    // The `authenticate` middleware I wrote checks `req.headers['x-user-id']`.
    // I need to send that header.

    // Let's do a quick patch to the request function to include headers
}

// Re-implementing request to allow headers
function requestWithHeaders(path, method, body, headers = {}, cookies = {}) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                const newCookies = {};
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    setCookie.forEach(c => {
                        const parts = c.split(';');
                        const [key, val] = parts[0].split('=');
                        newCookies[key] = val;
                    });
                }
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(responseBody), cookies: newCookies });
                } catch (e) {
                    resolve({ status: res.statusCode, body: responseBody, cookies: newCookies });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTestsFixed() {
    console.log('--- Starting Trusted Device API Tests ---\n');

    // 1. Try Login without MFA
    console.log('1. Attempting Login WITHOUT MFA...');
    const res1 = await requestWithHeaders('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123'
    });
    if (res1.status === 403 && res1.body.error === 'MFA_REQUIRED') {
        console.log('   ✅ PASS: MFA was required.\n');
    } else {
        console.log('   ❌ FAIL: Expected MFA_REQUIRED.', res1.body, '\n');
    }

    // 2. Login WITH MFA
    console.log('2. Attempting Login WITH MFA...');
    const res2 = await requestWithHeaders('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123',
        mfaCode: '123456'
    });

    let userId = res2.body.userId;
    if (res2.status === 200 && userId) {
        console.log('   ✅ PASS: Login successful.\n');
    } else {
        console.log('   ❌ FAIL: Login failed.', res2.body, '\n');
        return;
    }

    // 3. Trust this device
    console.log('3. Trusting this device...');
    const res3 = await requestWithHeaders('/api/trust-device', 'POST', {}, {
        'x-user-id': userId // Simulating auth
    });

    const trustedToken = res3.cookies['trusted_device_token'];
    if (res3.status === 200 && trustedToken) {
        console.log('   ✅ PASS: Device trusted, cookie received.');
        console.log(`   Token: ${trustedToken.substring(0, 10)}...\n`);
    } else {
        console.log('   ❌ FAIL: Could not trust device.', res3.body, '\n');
        return;
    }

    // 4. Login AGAIN without MFA but WITH Cookie
    console.log('4. Attempting Login WITHOUT MFA (but WITH Trusted Cookie)...');
    const res4 = await requestWithHeaders('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123'
    }, {}, {
        'trusted_device_token': trustedToken
    });

    if (res4.status === 200) {
        console.log('   ✅ PASS: Login successful (MFA Bypassed via Cookie).\n');
    } else {
        console.log('   ❌ FAIL: Login failed or MFA required.', res4.body, '\n');
    }

    // 5. Revoke Device
    console.log('5. Revoking Device...');
    const deviceId = res3.body.deviceId;
    const res5 = await requestWithHeaders(`/api/devices/${deviceId}`, 'DELETE', {}, {
        'x-user-id': userId
    });
    if (res5.status === 200) {
        console.log('   ✅ PASS: Device revoked.\n');
    } else {
        console.log('   ❌ FAIL: Could not revoke device.\n');
    }

    // 6. Login AGAIN (Should fail/require MFA again)
    console.log('6. Attempting Login after Revocation...');
    const res6 = await requestWithHeaders('/api/login', 'POST', {
        username: 'demo_user',
        password: 'password123'
    }, {}, {
        'trusted_device_token': trustedToken // Sending the old token
    });

    if (res6.status === 403 && res6.body.error === 'MFA_REQUIRED') {
        console.log('   ✅ PASS: MFA required again (Token invalid/revoked).\n');
    } else {
        console.log('   ❌ FAIL: MFA should have been required.', res6.body, '\n');
    }
}

runTestsFixed();
