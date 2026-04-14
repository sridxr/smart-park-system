const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let ioInstance = null;

function createSocketServer(httpServer, { frontendUrl }) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };
      return next();
    } catch {
      return next();
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join("global");

    if (socket.user?.role) {
      socket.join(`role:${socket.user.role}`);
    }

    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.emit("realtime:ready", {
      connected: true,
      role: socket.user?.role || null,
    });
  });

  return ioInstance;
}

function emitRealtimeEvent({ event, payload = {}, rooms = [] }) {
  if (!ioInstance || !event) {
    return;
  }

  const targetRooms = [...new Set(rooms.filter(Boolean))];
  if (!targetRooms.length) {
    ioInstance.emit(event, payload);
    return;
  }

  targetRooms.forEach((room) => {
    ioInstance.to(room).emit(event, payload);
  });
}

module.exports = {
  createSocketServer,
  emitRealtimeEvent,
};
