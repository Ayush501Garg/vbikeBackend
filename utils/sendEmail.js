// utils/sendOTPEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"VBike Verification" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🔐 VBike – Your OTP Verification Code',

      // Beautiful VBike-themed email UI
      html: `
        <div style="
          font-family: 'Arial', sans-serif;
          background: #f2f4f8;
          padding: 35px 20px;
          text-align: center;
        ">
          <div style="
            max-width: 420px;
            margin: auto;
            background: #ffffff;
            border-radius: 14px;
            padding: 28px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          ">

            <!-- VBike Header Branding -->
            <div style="
              background: linear-gradient(135deg, #0d6efd, #0a58ca);
              padding: 20px;
              border-radius: 12px;
              color: white;
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
            ">
              🚴‍♂️ VBike Security
            </div>

            <p style="
              font-size: 15px;
              color: #333;
              margin-top: 22px;
            ">
              Hello Rider,<br>
              Your VBike verification code is ready!
            </p>

            <!-- OTP Box -->
            <div style="
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #0d6efd;
              background: #e8f0ff;
              padding: 20px 0;
              border-radius: 12px;
              margin: 25px 0;
            ">
              ${otp}
            </div>

            <p style="
              font-size: 14px;
              color: #444;
              margin-top: 10px;
            ">
              Enter this OTP within <strong>5 minutes</strong> to continue.<br>
              For your safety, never share this code with anyone.
            </p>

            <hr style="margin: 28px 0; opacity: 0.25;">

            <p style="font-size: 12px; color: #999;">
              If you didn’t request this OTP, please ignore this email.<br>
              © VBike – Ride the Future 🚴‍♂️⚡
            </p>

          </div>
        </div>
      `,
    });

    console.log('OTP sent:', info.messageId);
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};

module.exports = sendOTPEmail;
