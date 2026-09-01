// Contoh server TikTok Live — jalankan terpisah dengan: node tiktok-server.example.js
// npm i tiktok-live-connector socket.io
import { WebcastPushConnection } from "tiktok-live-connector";
import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

const connections = new Map(); // username -> tiktokLiveConnection

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("connect-tiktok", async (username) => {
    username = String(username).trim().replace(/^@/, "");
    if (!username) return;

    socket.join(username);
    console.log(`[${username}] connect request from ${socket.id}`);

    if (connections.has(username)) {
      const existing = connections.get(username);
      if (existing.getState().isConnected) {
        io.to(username).emit("tiktok-connected", username);
        return;
      }
    }

    const tiktokLiveConnection = new WebcastPushConnection(username);

    // --- forward TikTok events to room `username` ---
    tiktokLiveConnection.on("connected", () => {
      io.to(username).emit("tiktok-connected", username);
    });

    tiktokLiveConnection.on("disconnected", () => {
      io.to(username).emit("tiktok-disconnected");
    });

    tiktokLiveConnection.on("chat", (data) => {
      io.to(username).emit("tiktok-chat", {
        nickname: data.nickname || data.uniqueId,
        comment: data.comment,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    tiktokLiveConnection.on("gift", (data) => {
      io.to(username).emit("tiktok-gift", {
        nickname: data.nickname || data.uniqueId,
        giftName: data.giftName,
        repeatCount: data.repeatCount,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    tiktokLiveConnection.on("like", (data) => {
      io.to(username).emit("tiktok-like", {
        nickname: data.nickname || data.uniqueId,
        likeCount: data.likeCount,
      });
    });

    tiktokLiveConnection.on("member", (data) => {
      io.to(username).emit("tiktok-member", {
        nickname: data.nickname || data.uniqueId,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    // === REQUESTED: roomUser handler ===
    tiktokLiveConnection.on("roomUser", (data) => {
      io.to(username).emit("tiktok-roomUser", data);
    });

    // optional: viewer count via roomUser, social, etc.
    // tiktokLiveConnection.on("social", (data) => { io.to(username).emit("tiktok-social", data); });

    try {
      io.to(username).emit("tiktok-connecting", username);
      await tiktokLiveConnection.connect();
      connections.set(username, tiktokLiveConnection);
      console.log(`[${username}] TikTok connected`);
    } catch (err) {
      console.error(`[${username}] TikTok error:`, err?.message || err);
      io.to(username).emit("tiktok-error", String(err?.message || err));
    }
  });

  socket.on("disconnect-tiktok", (username) => {
    username = String(username).trim().replace(/^@/, "");
    console.log(`[${username}] disconnect request from ${socket.id}`);
    const conn = connections.get(username);
    if (conn) {
      try { conn.disconnect(); } catch {}
      connections.delete(username);
    }
    io.to(username).emit("tiktok-disconnected");
  });

  socket.on("pin-chat", (payload) => {
    // forward pin to all in room if needed
    io.to(payload.username).emit("pin-chat", payload.chat);
  });
  socket.on("unpin-chat", () => {
    io.emit("unpin-chat");
  });
});

server.listen(3000, () => console.log("TikTok socket server listening on http://localhost:3000"));
