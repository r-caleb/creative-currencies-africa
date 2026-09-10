import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api-url";

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
