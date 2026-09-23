require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: process.env.PORT || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "*",

  db: {
    host: required("DB_HOST", "127.0.0.1"),
    port: Number(process.env.DB_PORT || 3306),
    user: required("DB_USER", "root"),
    password: process.env.DB_PASSWORD || "",
    name: required("DB_NAME", "apex"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  verification: {
    ttlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 15),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "Apex <no-reply@apex.app>",
  },
};
