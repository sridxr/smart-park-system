import { io } from "socket.io-client";

import { SERVER_BASE_URL } from "../api";

let socketInstance = null;
let activeToken = "";

export function getRealtimeSocket(token) {
  if (!token) {
    return null;
  }

  if (socketInstance && activeToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  activeToken = token;
  socketInstance = io(SERVER_BASE_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}

export function closeRealtimeSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    activeToken = "";
  }
}
