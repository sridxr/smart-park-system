const nodemailer = require("nodemailer");

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendVerificationEmail({ email, name, token }) {
  const transporter = getTransporter();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyUrl = `${frontendUrl}/auth?verify=${token}`;

  if (!transporter) {
    return {
      delivered: false,
      verifyUrl,
    };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your SmartPark AI account",
    html: `
      <div style="font-family: Arial, sans-serif; background: #07111c; color: #e5f3ff; padding: 32px;">
        <h2 style="margin-bottom: 12px;">Welcome to SmartPark AI</h2>
        <p style="margin-bottom: 20px;">Hi ${name}, verify your email to activate intelligent booking and live insights.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: linear-gradient(135deg, #38bdf8, #4ade80); color: #041018; text-decoration: none; font-weight: 700;">
          Verify Email
        </a>
      </div>
    `,
  });

  return {
    delivered: true,
    verifyUrl,
  };
}

module.exports = {
  sendVerificationEmail,
};
