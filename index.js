const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db');
dotenv.config();

const app = express();
app.use(express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const bikeTypeRoutes = require('./routes/bikeTypeRoutes');
const bikeModelRoutes = require('./routes/bikeModelRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const bikeRegisterRoutes = require('./routes/bikeRegisterRoutes');
const productRoutes = require('./routes/productRoutes');
const wishlistProductRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require('./routes/addressRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const bookRideRoutes = require('./routes/bookRideRoutes');
const vendorProductApprovalRoutes = require('./routes/vendorProductApprovalRoutes');
const featuredOfferRoutes = require('./routes/featuredOfferRoutes');


const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const walletRoutes = require("./routes/walletRoutes");


// Import socket module
const { initSocket, sendToUser } = require('./socket');
const BikeRegister = require("./models/bikeRegisterModel"); // adjust path




const cors = require('cors');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'device-id'],
}));

// Handle preflight requests manually (safe for Express 5)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,device-id');
    return res.sendStatus(200);
  }
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Connect to MongoDB first

connectDB();

// Test route
app.get('/', (req, res) => res.send("Backend Running with Socket.IO ✅"));

// ✅ POST /api/device-data


app.post("/api/device-data", async (req, res) => {
  try {
    const deviceId = req.headers["device-id"];
    if (!deviceId) {
      return res.status(400).json({
        status: "error",
        message: "Device ID header required",
      });
    }

    const bodyData = req.body;
    console.log("📩 API hit => DeviceID:", deviceId.trim(), "Body:", bodyData);

    // 🔎 Lookup bike in DB
    const bike = await BikeRegister.findOne({ bikeId: deviceId.trim() });

    if (!bike) {
      return res.status(404).json({
        status: "error",
        message: "Bike not found for this deviceId",
      });
    }

    const userId = bike.user_id;

    // 🔥 Emit to all active devices of this user
    sendToUser(userId, { deviceId, userId, body: bodyData });

    res.status(201).json({
      status: "success",
      message: "Data sent to user",
      userId,
      deviceId,
      body: bodyData,
    });
  } catch (err) {
    console.error("❌ Error in /api/device-data:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});


// Vbike backend

// Create HTTP server + attach Socket.IO
const server = http.createServer(app);
initSocket(server);

// commit 

// Other API routess
app.use('/api/auth', authRoutes);
app.use("/api/bike-types", bikeTypeRoutes);
app.use("/api/bike-models", bikeModelRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/bike-register", bikeRegisterRoutes);
app.use('/api/products', productRoutes);
app.use("/api/wishlist",wishlistProductRoutes)
app.use('/api/address', addressRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/bookrides", bookRideRoutes);
app.use("/api/productApproval", vendorProductApprovalRoutes);
app.use("/api/featuredOffer", featuredOfferRoutes);


// Skip
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);


// Start server
server.listen(8000, () => console.log("🚀 Server running on port 8000"));
