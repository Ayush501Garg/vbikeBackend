const User = require("../models/User");
const TempUser = require("../models/TempUser");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const sendOTPEmail = require("../utils/sendEmail");

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();


exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ status: "error", code: 400, message: "All fields are required" });
    }

    // If already a verified user → reject
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "error", code: 400, message: "User already exists" });
    }

    // If exists in temp → delete and recreate
    await TempUser.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const tempUser = await TempUser.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    // console.log("OTP sent to", email, otp);
    await sendOTPEmail(email, otp);

    return res.status(201).json({
      status: "success",
      code: 201,
      message: "OTP sent to email. Please verify.",
      data: { email: tempUser.email }
    });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({ status: "error", code: 500, message: "Server error" });
  }
};

// Verify OTP → Move from TempUser to User

exports.verifyOTP = async (req, res) => {
  try {
    console.log("req.body",req.body)
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "OTP is required"
      });
    }

    // Find temp user with OTP
    const tempUser = await TempUser.findOne({ otp });
    if (!tempUser) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Invalid OTP"
      });
    }

    // Expired OTP
    if (tempUser.otpExpires < Date.now()) {
      await TempUser.deleteOne({ _id: tempUser._id });
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "OTP has expired. Please signup again."
      });
    }

    console.log("MY otp",otp)

    // ✅ Move data to users collection
    const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      isVerified: true,
    });

    // Remove temp entry
    await TempUser.deleteOne({ _id: tempUser._id });


    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Email verified successfully, you can now login"
    });
  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error"
    });
  }
};


// Resend OTP → For TempUser only

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Email is required"
      });
    }

    // Look for temp user
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found or already verified"
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    tempUser.otp = otp;
    tempUser.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await tempUser.save();

    console.log("Resent OTP to", email, otp);
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "New OTP sent to email",
      data: { email: tempUser.email }
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error"
    });
  }
};


// Login → Generate Token + Save in User

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: "error", code: 400, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ status: "error", code: 400, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ status: "error", code: 403, message: "Please verify your email first" });
    }

    const token = generateToken(user._id);

    // ✅ Save token in users table
    user.token = token;
    await user.save();

    return res.status(200).json({
      status: "success",
      code: 200,
      user:{
        userId: user._id,
        name:user.name,
        email:user.email,
        phone:user.phone,
        token:user.token,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ status: "error", code: 500, message: "Server error" });
  }
};
