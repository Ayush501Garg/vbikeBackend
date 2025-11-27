const User = require("../models/User");
const TempUser = require("../models/TempUser");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

// NEW IMPORT
const sendWhatsappOTP = require("../utils/sendWhatsappOTP");

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ==========================================================
   🟢 SIGNUP — Create Temp User and Send OTP via WHATSAPP
   ========================================================== */
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "All fields are required",
      });
    }

    // Check already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "User already exists",
      });
    }

    // =====================================================
    // ⭐ CASE 1 → role is provided → DIRECT USER CREATION
    // =====================================================
    if (role && role !== "user") {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role,           // Use given role (admin/vendor)
        isVerified: true,     // Mark verified since no OTP needed
      });

      return res.status(201).json({
        status: "success",
        code: 201,
        message: "User created successfully without OTP verification.",
        data: newUser,
      });
    }

    // =====================================================
    // ⭐ CASE 2 → No role or role = "user" → OTP FLOW
    // =====================================================

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
      role: "user", // force default user
    });

    try {
      // SEND OTP to WhatsApp
      await sendWhatsappOTP(phone, otp);

      return res.status(201).json({
        status: "success",
        code: 201,
        message: "OTP sent to WhatsApp. Please verify.",
        otp: otp, // REMOVE in production
        data: { phone: tempUser.phone },
      });

    } catch (whError) {
      console.error("WhatsApp OTP Error:", whError);

      await TempUser.deleteOne({ email });

      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Phone number incorrect or unable to send WhatsApp OTP",
      });
    }

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
   🟣 VERIFY OTP — SAME LOGIC
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
      role: tempUser.role || "user",
      isVerified: true,
    });

    const token = generateToken(newUser._id);
    newUser.token = token;
    await newUser.save();

    await TempUser.deleteOne({ _id: tempUser._id });

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "WhatsApp OTP verified successfully",
      user: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        token: token,
      },
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
   🟡 RESEND OTP — via WhatsApp
   ========================================================== */
exports.resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Phone number is required",
      });
    }
    // New

    // ❌ Do NOT resend OTP if already verified
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "User already verified. Please login.",
      });
    }

    // Check TempUser
    const tempUser = await TempUser.findOne({ phone });
    if (!tempUser) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found or already verified",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempUser.otp = otp;
    tempUser.otpExpires = Date.now() + 10 * 60 * 1000;
    await tempUser.save();

    // Send WhatsApp OTP
    await sendWhatsappOTP(phone, otp);

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "New OTP sent to WhatsApp",
      data: { phone: tempUser.phone },
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
   🔵 LOGIN — SAME
   ========================================================== */
exports.login = async (req, res) => {
  try {
    let { email, password, role } = req.body;

    if (!role) {
      role = "user";
    }

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
        message: "Please verify your WhatsApp OTP first",
      });
    }

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

    let message = "User login successful";
    if (user.role === "admin") message = "Admin login successful";
    if (user.role === "vendor") message = "Vendor login successful";

    return res.status(200).json({
      status: "success",
      code: 200,
      message,
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
   ⚙️ CRUD + ROLE (UNCHANGED)
   ========================================================== */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Role is required",
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
      message: `${role} fetched successfully`,
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

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

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

exports.updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
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

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

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

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["user", "vendor", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid role value",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

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
