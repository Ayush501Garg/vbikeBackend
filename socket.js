let io;

// userId -> Set of socketIds (multiple devices per user)
const users = {};

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect(true);

    if (!users[userId]) users[userId] = new Set();
    users[userId].add(socket.id);

    console.log(`✅ User ${userId} connected with socketID: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Socket ${socket.id} disconnected for user ${userId}`);
      users[userId].delete(socket.id);
      if (users[userId].size === 0) delete users[userId];
    });
  });
}

// 🔥 Send data to all devices of a user
function sendToUser(userId, data) {
  if (!users[userId] || users[userId].size === 0) {
    console.log(`⚠️ No active sockets for user ${userId}`);
    return;
  }

  console.log("💥 Sending to user:", userId, "👉 Data:", data);

  users[userId].forEach((socketId) => {
    console.log("💥💥💥💢💢💢 userId data",data);
    io.to(socketId).emit("device-data", data);
  });
}

module.exports = { initSocket, sendToUser };
