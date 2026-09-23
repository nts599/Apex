const nodemailer = require("nodemailer");
const { smtp } = require("../config");

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
});

async function sendVerificationEmail(toEmail, code) {
  const info = await transporter.sendMail({
    from: smtp.from,
    to: toEmail,
    subject: "Verify your Apex account",
    text: `Your Apex verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your Apex verification code is:</p>
           <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
           <p>This code expires in 15 minutes.</p>`,
  });

  // If using an Ethereal test account, this logs a URL to preview the email.
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Verification email preview: ${previewUrl}`);
  }

  return info;
}

module.exports = { sendVerificationEmail };
