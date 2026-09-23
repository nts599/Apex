const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

function isValidPassword(password, minLength = 8) {
  return typeof password === "string" && password.length >= minLength;
}

function generateVerificationCode() {
  // 6-digit numeric code, e.g. "042817"
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { isValidEmail, isValidPassword, generateVerificationCode };
