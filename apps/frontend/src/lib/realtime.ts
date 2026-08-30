import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type RealtimeSocket = Socket;

export function connectRealtimeSocket(accessToken: string) {
  return io(realtimeUrl(), {
    auth: { token: accessToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
    transports: ["websocket", "polling"],
  });
}

function realtimeUrl() {
  return API_URL.replace(/\/api\/?$/, "/realtime");
}
