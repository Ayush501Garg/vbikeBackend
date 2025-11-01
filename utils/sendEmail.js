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
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OTP Code',
      html: `<h3>Your OTP is: ${otp}</h3>`,
    });

    console.log('OTP sent:', info.messageId);
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};

module.exports = sendOTPEmail;
