# 🔐 Authentication System

A secure and scalable authentication system built with Node.js and Express, supporting user registration, email verification (OTP), JWT-based authentication, and session management.

---

## 🚀 Features

- User registration with email & password
- OTP-based email verification (10 min expiry)
- JWT authentication (Access + Refresh tokens)
- Secure login & session tracking (IP + User-Agent)
- Logout (single session / all sessions)
- HTTP-only cookie-based refresh tokens
- Token refresh without re-login
- Protected routes (Get current user)
- Secure password hashing (SHA-256)

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose)  
- **Auth:** JWT (JSON Web Tokens)  
- **Email:** Nodemailer (Gmail SMTP)  
- **Security:** crypto (SHA-256)  
- **Middleware:** Morgan, cookie-parser  
- **Config:** dotenv  

---

## ⚙️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd Authentication

npm install

MONGO_URI=mongodb://localhost:27017/authentication
JWT_SECRET=your-secret-key

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_USER=your-email@gmail.com
GOOGLE_REFRESH_TOKEN=your-refresh-token

npm start
http://localhost:3000
