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
      from: `"VBike Secure Verification" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'VBike Account Verification – OTP Code',

      html: `
        <div style="
          font-family: 'Helvetica', Arial, sans-serif;
          background: #f3f7f4;
          padding: 40px 20px;
          text-align: center;
        ">
          <div style="
            max-width: 460px;
            margin: auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            border: 1px solid #e4efe7;
          ">

            <!-- VBike Header -->
            <div style="
              background: #1f9d55; /* your VBike green theme */
              padding: 18px;
              border-radius: 12px;
              color: white;
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              text-align: center;
            ">
              VBike Verification
            </div>

            <p style="
              margin-top: 26px;
              font-size: 15px;
              font-weight: 500;
              color: #2d3a2e;
              line-height: 1.5;
            ">
              To complete your verification, please use the One-Time Password (OTP)
              provided below. This helps us secure your VBike account.
            </p>

            <!-- OTP BOX -->
            <div style="
              margin: 28px 0;
              padding: 22px 0;
              border-radius: 14px;
              background: #e8f5ec;
              border: 1px solid #cfe8d8;
              color: #1f9d55;
              font-size: 34px;
              font-weight: 700;
              letter-spacing: 10px;
            ">
              ${otp}
            </div>

            <p style="
              font-size: 14px;
              color: #3f4a41;
              margin-top: 10px;
              line-height: 1.5;
            ">
              Your OTP is valid for the next <strong>5 minutes</strong>.<br>
              For your safety, do not share this code with anyone.
            </p>

            <hr style="
              margin: 32px 0;
              border: none;
              height: 1px;
              background: #e1eae4;
            ">

            <p style="
              font-size: 12px;
              color: #7b8d81;
              line-height: 1.5;
            ">
              If you did not request this verification code, simply ignore this email.<br>
              VBike • Smarter. Cleaner. Faster.
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