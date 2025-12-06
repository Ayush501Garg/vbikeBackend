let io;

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("✅Socket Connected:", socket.id);

    socket.on("disconnect", () => {
      console.log(`❌Socket disconnected: ${socket.id}`);
    });
  });
}

function sendToAll(data) {
  io.emit("device-data", data); // 🔥 send to ALL connected sockets
}

module.exports = { initSocket, sendToAll };
