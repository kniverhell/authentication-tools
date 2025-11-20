const crypto = require('crypto');

// In-memory storage
const users = [];
const trustedDevices = [];

class User {
  constructor(username, passwordHash, mfaEnabled = false) {
    this.id = crypto.randomUUID();
    this.username = username;
    this.passwordHash = passwordHash;
    this.mfaEnabled = mfaEnabled;
    this.mfaSecret = 'mock-secret'; // In real app, this would be unique per user
  }

  static findByUsername(username) {
    return users.find(u => u.username === username);
  }

  static findById(id) {
    return users.find(u => u.id === id);
  }

  static create(username, passwordHash, mfaEnabled) {
    const user = new User(username, passwordHash, mfaEnabled);
    users.push(user);
    return user;
  }
}

class TrustedDevice {
  constructor(userId, tokenHash, userAgent, ipAddress) {
    this.id = crypto.randomUUID();
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
    this.lastUsedAt = new Date();
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  static create(userId, tokenHash, userAgent, ipAddress) {
    const device = new TrustedDevice(userId, tokenHash, userAgent, ipAddress);
    trustedDevices.push(device);
    return device;
  }

  static findByUserIdAndTokenHash(userId, tokenHash) {
    return trustedDevices.find(d => 
      d.userId === userId && 
      d.tokenHash === tokenHash && 
      d.expiresAt > new Date()
    );
  }

  static revoke(id) {
    const index = trustedDevices.findIndex(d => d.id === id);
    if (index !== -1) {
      trustedDevices.splice(index, 1);
      return true;
    }
    return false;
  }

  static listByUser(userId) {
    return trustedDevices.filter(d => d.userId === userId);
  }
}

module.exports = { User, TrustedDevice };
