const User = require("../models/User");
const TempUser = require("../models/TempUser");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const sendOTPEmail = require("../utils/sendEmail");

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ==========================================================
   🟢 SIGNUP — Create Temp User and Send OTP
   ========================================================== */
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "User already exists",
      });
    }

    // Delete old temp entry (if exists)
    await TempUser.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    const tempUser = await TempUser.create({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
      role: role || "user", // default role = user
    });

    await sendOTPEmail(email, otp);

    return res.status(201).json({
      status: "success",
      code: 201,
      message: "OTP sent to email. Please verify.",
      data: { email: tempUser.email },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

/* ==========================================================
   🟣 VERIFY OTP — Move from TempUser to User
   ========================================================== */
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "OTP is required",
      });
    }

    const tempUser = await TempUser.findOne({ otp });
    if (!tempUser) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Invalid OTP",
      });
    }

    if (tempUser.otpExpires < Date.now()) {
      await TempUser.deleteOne({ _id: tempUser._id });
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "OTP has expired. Please signup again.",
      });
    }

    const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      role: tempUser.role,
      isVerified: true,
      role: tempUser.role || "user",
    });

    await TempUser.deleteOne({ _id: tempUser._id });

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Email verified successfully. You can now login.",
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

/* ==========================================================
   🟡 RESEND OTP
   ========================================================== */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Email is required",
      });
    }

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found or already verified",
      });
    }

    const otp = generateOTP();
    tempUser.otp = otp;
    tempUser.otpExpires = Date.now() + 10 * 60 * 1000;
    await tempUser.save();

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "New OTP sent to email",
      data: { email: tempUser.email },
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

/* ==========================================================
   🔵 LOGIN — Supports Role Validation
   ========================================================== */
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        status: "error",
        code: 403,
        message: "Please verify your email first",
      });
    }

    // Optional role validation
    if (role && user.role !== role) {
      return res.status(403).json({
        status: "error",
        code: 403,
        message: `Access denied. You are not a ${role}.`,
      });
    }

    const token = generateToken(user._id);
    user.token = token;
    await user.save();

    return res.status(200).json({
      status: "success",
      code: 200,
      message:
        user.role === "admin"
          ? "Admin login successful"
          : user.role === "vendor"
          ? "Vendor login successful"
          : "User login successful",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: user.token,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

/* ==========================================================
   ⚙️ USER CRUD OPERATIONS (Role-Based)
   ========================================================== */

// 🟢 Get all users — fetch by role from body
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Role is required in request body",
      });
    }

    const users = await User.find({ role }).select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: `No users found for role: ${role}`,
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: `Users fetched successfully for role: ${role}`,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

// 🟣 Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      data: user,
    });
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

// 🟡 Update user (self or admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "User updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

// 🔴 Delete user — only admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};

/* ==========================================================
   🔵 ADMIN — Update User Role
   ========================================================== */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["user", "vendor", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid role value",
      });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "User role updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Update Role Error:", err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Server error",
    });
  }
};
