const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// const { verifyToken } = require("../middleware/authMiddleware"); // optional middleware if using token auth

// ==========================
// 🟢 AUTHENTICATION ROUTES
// ==========================
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOTP);
router.post("/resend-otp", userController.resendOTP);
router.post("/login", userController.login);

// ==========================
// 🟡 USER CRUD ROUTES
// ==========================

// POST (role-based): Get all users by role
router.post("/getAllUsers", userController.getAllUsers);

// GET: Get single user by ID
router.get("/users/:id", userController.getUserById);

// PUT: Update user info
router.put("/users/:id", userController.updateUser);

// DELETE: Delete user (admin only)
router.delete("/users/:id", userController.deleteUser);

// PUT: Update user role (admin only)
router.put("/users/:id/role", userController.updateUserRole);

module.exports = router;
