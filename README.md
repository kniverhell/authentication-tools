# Trusted Device API (`authentication-tools`)

A secure Node.js & Express reference implementation for a **Trusted Device API**. This system enables users to opt-in to setting their web browser as a trusted device, allowing them to bypass Multi-Factor Authentication (MFA) on subsequent logins while maintaining maximum security.

---

## 🌟 Key Features

- **Opt-In MFA Bypass**: Users can register their current browser as trusted after a successful MFA challenge.
- **High-Entropy Token Generation**: Generates 256-bit cryptographically secure random device tokens (`crypto.randomBytes(32)`).
- **Hashed Token Storage**: Raw device tokens are never stored in the database. Only SHA-256 hashes are persisted to prevent token theft via database compromise.
- **Secure Cookie Design**: Employs `HttpOnly`, `SameSite=Strict`, and `Secure` flag options to mitigate XSS and CSRF vectors.
- **Device Lifecycle & Revocation**: Users can view all active trusted devices and remotely revoke trust for any device.
- **Expiration Policy**: Automatic 30-day TTL expiration on device trust.

---

## 🔒 Security Architecture

| Security Aspect | Implementation Detail |
| :--- | :--- |
| **Token Storage** | SHA-256 digest of the token is saved on the server. The raw token resides exclusively in the user's browser cookie. |
| **Cookie Protections** | `HttpOnly` (inaccessible to client-side JS), `SameSite=Strict` (prevents cross-site submission), `Secure` (HTTPS only in production). |
| **Authentication Flow** | 1. Check password -> 2. Inspect trusted device cookie -> 3. Bypass MFA if token hash matches unexpired record, otherwise require MFA code. |
| **Revocation** | Immediate invalidation of the token hash in the backend invalidates the browser cookie. |

---

## 🚀 API Endpoints

### 1. `POST /api/login`
Authenticates a user and evaluates whether MFA is required based on credentials and device trust status.

* **Request Body:**
  ```json
  {
    "username": "demo_user",
    "password": "password123",
    "mfaCode": "123456" // Optional if device is trusted
  }
  ```
* **Cookie Input:** `trusted_device_token` (optional)
* **Response:**
  * **200 OK**: Login success (MFA satisfied or bypassed).
  * **403 Forbidden (`MFA_REQUIRED`)**: Password valid, but MFA code is required because the device is untrusted or the cookie expired/revoked.
  * **401 Unauthorized**: Invalid credentials or wrong MFA code.

---

### 2. `POST /api/trust-device`
Registers the caller's browser as a trusted device for 30 days.

* **Headers:** `x-user-id` (Session / User context)
* **Response:**
  * **200 OK**: Sets the `trusted_device_token` HttpOnly cookie and returns the `deviceId`.

---

### 3. `GET /api/devices`
Retrieves a list of trusted devices associated with the logged-in user.

* **Headers:** `x-user-id`
* **Response (200 OK):**
  ```json
  {
    "devices": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "::1",
        "lastUsedAt": "2026-09-21T12:00:00.000Z",
        "expiresAt": "2026-10-21T12:00:00.000Z"
      }
    ]
  }
  ```

---

### 4. `DELETE /api/devices/:id`
Revokes a specific trusted device, forcing MFA on the next login attempt from that browser.

* **Headers:** `x-user-id`
* **Response (200 OK):**
  ```json
  { "message": "Device revoked" }
  ```

---

## 📦 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kniverhell/authentication-tools.git
   cd authentication-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   The server will run at `http://localhost:3000`.

---

## 🧪 Testing & Verification

An automated verification test script `test_auth.js` is included to validate the complete workflow:

1. Attempting login without MFA (Expects `403 MFA_REQUIRED`).
2. Logging in with valid MFA code (Success).
3. Trusting the current device (Sets secure cookie).
4. Logging in again without MFA code (MFA Bypassed via Cookie).
5. Revoking the trusted device.
6. Logging in post-revocation (MFA required again).

To run the verification suite:
```bash
# Start server in background or separate window:
node server.js &

# Run test suite:
node test_auth.js
```

---

## 🛠 Production Deployment Considerations

Before deploying to production:
1. **Database Integration**: Replace the in-memory array storage in `models.js` with PostgreSQL, MySQL, or Redis.
2. **Real TOTP/MFA**: Integrate real TOTP verification (e.g. using `otplib` or `speakeasy`).
3. **Password Hashing**: Use standard `bcrypt` or `argon2` hashing rather than SHA-256 for user passwords.
4. **HTTPS**: Ensure the server runs behind HTTPS so the cookie's `Secure` flag is enforced.
5. **Rate Limiting**: Apply rate limiting middleware (e.g. `express-rate-limit`) on `/api/login` and `/api/trust-device` to block brute-force attempts.