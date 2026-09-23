const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../db/pool");
const { jwt: jwtConfig, verification } = require("../config");
const { isValidEmail, isValidPassword, generateVerificationCode } = require("../utils/validation");
const { sendVerificationEmail } = require("../utils/mailer");

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (!isValidPassword(password, 8)) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = :email", {
      email: email.trim().toLowerCase(),
    });
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + verification.ttlMinutes * 60 * 1000);

    await pool.query(
      `INSERT INTO users (email, password_hash, verification_code, verification_expires)
       VALUES (:email, :passwordHash, :code, :expires)`,
      { email: email.trim().toLowerCase(), passwordHash, code, expires }
    );

    await sendVerificationEmail(email, code);

    res.status(201).json({ message: "Account created. Check your email for a verification code." });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ error: "Something went wrong creating your account." });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!isValidEmail(email) || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const [rows] = await pool.query(
      "SELECT id, verification_code, verification_expires, is_verified FROM users WHERE email = :email",
      { email: email.trim().toLowerCase() }
    );
    const user = rows[0];

    if (!user) return res.status(404).json({ error: "No account found for that email." });
    if (user.is_verified) return res.status(200).json({ message: "Email already verified." });

    const notExpired = user.verification_expires && new Date(user.verification_expires) > new Date();
    if (!notExpired || String(user.verification_code) !== String(code)) {
      return res.status(400).json({ error: "Invalid or expired verification code." });
    }

    await pool.query(
      `UPDATE users
       SET is_verified = 1, verification_code = NULL, verification_expires = NULL
       WHERE id = :id`,
      { id: user.id }
    );

    res.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    console.error("verify-email error:", err);
    res.status(500).json({ error: "Something went wrong verifying your email." });
  }
});

// POST /api/auth/resend-code
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }

    const [rows] = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = :email",
      { email: email.trim().toLowerCase() }
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "No account found for that email." });
    if (user.is_verified) return res.status(200).json({ message: "Email already verified." });

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + verification.ttlMinutes * 60 * 1000);

    await pool.query(
      "UPDATE users SET verification_code = :code, verification_expires = :expires WHERE id = :id",
      { code, expires, id: user.id }
    );

    await sendVerificationEmail(email, code);
    res.json({ message: "A new verification code has been sent." });
  } catch (err) {
    console.error("resend-code error:", err);
    res.status(500).json({ error: "Something went wrong resending the code." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, is_verified FROM users WHERE email = :email",
      { email: email.trim().toLowerCase() }
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ error: "Invalid email or password." });

    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email before logging in." });
    }

    const [profileRows] = await pool.query(
      "SELECT id FROM profiles WHERE user_id = :userId",
      { userId: user.id }
    );
    const hasProfile = profileRows.length > 0;

    const token = signToken(user);
    res.json({
      token,
      firstLogin: !hasProfile,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Something went wrong logging in." });
  }
});

module.exports = router;
