import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { WebcastPushConnection } from "tiktok-live-connector";
import WebSocket from "ws";

async function startServer() {
  const app = express();
  app.use(express.json()); // Untuk menerima JSON di HTTP request
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const connections = new Map<string, any>();
  const mockIntervals = new Map<string, NodeJS.Timeout>();
  const polls = new Map<string, any>(); // room -> poll state

  function getPollRoom(payload: any): string {
    if (typeof payload === 'string') return payload || 'global';
    return (payload?.privateKey || payload?.room || payload?.key || 'global').toString() || 'global';
  }
  function parseVote(comment: string, optionCount: number): number | null {
    const t = (comment || '').trim();
    // only exact 1..6
    if (/^[1-6]$/.test(t)) {
      const idx = parseInt(t, 10) - 1;
      if (idx >= 0 && idx < optionCount) return idx;
    }
    return null;
  }
  function handlePollVote(room: string, userId: string, comment: string) {
    const poll = polls.get(room) || polls.get('global');
    const targetRoom = polls.get(room) ? room : (polls.get('global') ? 'global' : null);
    if (!targetRoom || !poll || poll.ended || poll.paused) return;
    const idx = parseVote(comment, poll.options.length);
    if (idx === null) return;
    const uid = (userId || '').toLowerCase();
    if (!uid) return;
    const prev = poll.voterMap[uid];
    if (prev !== undefined) {
      if (prev === idx) return; // same vote ignore
      poll.votes[prev] = Math.max(0, (poll.votes[prev] || 0) - 1);
    } else {
      poll.total = (poll.total || 0) + 1;
    }
    poll.votes[idx] = (poll.votes[idx] || 0) + 1;
    poll.voterMap[uid] = idx;
    polls.set(targetRoom, poll);
    io.to(targetRoom).emit('poll-update', poll);
    if (targetRoom !== 'global') io.to('global').emit('poll-update', poll);
    // also broadcast to all for preview without room
    io.emit('poll-update', poll);
  }

  // Streamer.bot integration
  let sbWs: WebSocket | null = null;
  let sbConnected = false;
  let sbAvailableActions: any[] = [];
  let sbActions: Record<string, string> = {
    chat: 'TikTok_Chat',
    gift: 'TikTok_Gift',
    like: 'TikTok_Like',
    member: 'TikTok_Member',
    pin: 'TikTok_PinChat'
  };

  // Function to connect to Streamer.bot
  const connectStreamerBot = () => {
    if (sbWs) {
      sbWs.close();
    }

    const ws = new WebSocket('ws://192.168.18.11:8080/streamerbot');

    ws.onopen = () => {
      console.log("Streamer.bot connected");
      sbConnected = true;
      io.emit('sb-connected', true);

      // Request actions list
      ws.send(JSON.stringify({
        request: "GetActions",
        id: "get_actions"
      }));

      // Subscribe to events
      ws.send(JSON.stringify({
        request: "Subscribe",
        id: "tickdashboard",
        events: {
          Twitch: ["ChatMessage"],
          YouTube: ["Message"]
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());

        // Handle GetActions response
        if (data.id === "get_actions" && data.actions) {
          sbAvailableActions = data.actions.filter((a: any) => a.enabled !== false);
          io.emit('sb-actions', sbAvailableActions);
        }

        // Handle Subscription response
        if (data.id === "tickdashboard" && data.status === "ok") {
          console.log("Subscribed to Streamer.bot events");
        }

        // Handle events
        if (data.event) {
          const platform = data.event.source.toLowerCase();
          const type = data.event.type;
          const eventData = data.data;

          // Handle chat messages
          if (type === 'ChatMessage' || type === 'Message') {
            const user = eventData.message?.username || eventData.user?.name || "User";
            const msg = eventData.message?.text || eventData.message || "";

            // Extract avatar/profile picture
            let avatar = null;
            if (eventData.user) {
              avatar = eventData.user.profileImageUrl || eventData.user.avatar || null;
            }

            const chatData = {
              uniqueId: user.toLowerCase().replace(/\s/g, '_'),
              nickname: user,
              comment: msg,
              profilePictureUrl: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user)}`,
              fromStreamerBot: true
            };

            // Broadcast to all clients
            io.emit('tiktok-chat', chatData);
            try {
              handlePollVote('global', chatData.uniqueId, chatData.comment);
              for (const r of polls.keys()) {
                if (r !== 'global') handlePollVote(r, chatData.uniqueId, chatData.comment);
              }
            } catch (e) { console.error('poll vote error sb', e); }
            console.log(`Chat from Streamer.bot (${platform}): ${user}: ${msg}`);
          }
        }
      } catch (e) {
        console.error("Error parsing SB message", e);
      }
    };

    ws.onclose = () => {
      console.log("Streamer.bot disconnected, will try to reconnect in 5s");
      sbConnected = false;
      io.emit('sb-connected', false);
      // Try to reconnect after 5 seconds
      setTimeout(connectStreamerBot, 5000);
    };

    ws.onerror = (e) => {
      console.error("Streamer.bot connection error, will try to reconnect in 5s");
      sbConnected = false;
      io.emit('sb-connected', false);
    };

    sbWs = ws;
  };

  // Function to send action to Streamer.bot
  const sendToStreamerBot = (actionName: string, args: any) => {
    if (sbWs && sbWs.readyState === WebSocket.OPEN && actionName) {
      sbWs.send(JSON.stringify({
        request: "DoAction",
        action: { name: actionName },
        args,
        id: `tiktok-${Date.now()}`
      }));
    }
  };

  // Connect to Streamer.bot on server start
  connectStreamerBot();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send current SB state to new client
    socket.emit('sb-connected', sbConnected);
    socket.emit('sb-actions', sbAvailableActions);
    socket.emit('sb-actions-config', sbActions);

    socket.on("join-room", (username) => {
      socket.join(username);
      // send existing poll for this room if any
      const poll = polls.get(username) || polls.get('global');
      if (poll) socket.emit('poll-update', poll);
    });

    // Polling widget events
    socket.on("poll-create", (payload: any) => {
      const room = getPollRoom(payload);
      socket.join(room);
      const q = (payload.question || '').toString().trim().slice(0, 120);
      const opts = Array.isArray(payload.options) ? payload.options.map((o: any) => String(o).trim()).filter(Boolean).slice(0, 6) : [];
      if (!q || opts.length < 2) return;
      const poll = {
        id: Date.now().toString(),
        room,
        question: q,
        options: opts,
        votes: Array(opts.length).fill(0),
        voterMap: {} as Record<string, number>,
        total: 0,
        theme: payload.theme || 'bar',
        duration: Math.min(600, Math.max(10, parseInt(payload.duration) || 60)),
        createdAt: Date.now(),
        ended: false,
        paused: false,
        visible: payload.visible !== false,
      };
      polls.set(room, poll);
      io.to(room).emit('poll-update', poll);
      io.emit('poll-update', poll);
      if (room !== 'global') io.to('global').emit('poll-update', poll);
      // auto-end after duration (respect pause)
      setTimeout(() => {
        const cur = polls.get(room);
        if (cur && cur.id === poll.id && !cur.ended && !cur.paused) {
          cur.ended = true;
          polls.set(room, cur);
          io.to(room).emit('poll-update', cur);
          io.emit('poll-update', cur);
        }
      }, poll.duration * 1000);
    });
    socket.on("poll-end", (payload: any) => {
      const room = getPollRoom(payload);
      const p = polls.get(room);
      if (p) { p.ended = true; polls.set(room, p); io.to(room).emit('poll-update', p); io.emit('poll-update', p); }
    });
    socket.on("poll-pause", (payload: any) => {
      const room = getPollRoom(payload);
      const p = polls.get(room);
      if (p && !p.ended && !p.paused) { p.paused = true; p.pausedAt = Date.now(); polls.set(room, p); io.to(room).emit('poll-update', p); io.emit('poll-update', p); }
    });
    socket.on("poll-resume", (payload: any) => {
      const room = getPollRoom(payload);
      const p = polls.get(room);
      if (p && p.paused && !p.ended) {
        const pausedDur = Date.now() - (p.pausedAt || Date.now());
        p.createdAt += pausedDur;
        p.paused = false; delete p.pausedAt;
        polls.set(room, p); io.to(room).emit('poll-update', p); io.emit('poll-update', p);
        // re-schedule auto-end with remaining time
        const remain = p.duration * 1000 - (Date.now() - p.createdAt);
        setTimeout(() => {
          const cur = polls.get(room);
          if (cur && cur.id === p.id && !cur.ended && !cur.paused) { cur.ended = true; polls.set(room, cur); io.to(room).emit('poll-update', cur); io.emit('poll-update', cur); }
        }, Math.max(1000, remain));
      }
    });
    socket.on("poll-visibility", (payload: any) => {
      const room = getPollRoom(payload);
      const p = polls.get(room);
      if (p) { p.visible = !!payload.visible; polls.set(room, p); io.to(room).emit('poll-update', p); io.emit('poll-update', p); }
    });
    socket.on("poll-clear", (payload: any) => {
      const room = payload ? getPollRoom(payload) : 'global';
      polls.delete(room);
      io.to(room).emit('poll-clear', { room });
      io.emit('poll-clear', { room });
    });
    socket.on("poll-get", (payload: any) => {
      const room = getPollRoom(payload || {});
      const p = polls.get(room) || polls.get('global');
      if (p) socket.emit('poll-update', p);
    });
    socket.on("poll-vote", (payload: any) => {
      // manual vote via API (for testing)
      const room = getPollRoom(payload);
      const uid = (payload.userId || payload.nickname || 'manual').toString();
      handlePollVote(room, uid, String(payload.vote ?? ''));
    });

    // Streamer.bot action configuration
    socket.on("sb-update-action", ({ key, value }) => {
      sbActions[key] = value;
      io.emit('sb-actions-config', sbActions);
    });

    socket.on("pin-chat", (payload: any) => {
      const room = payload.privateKey || payload.username;
      const chat = payload.chat || payload;
      const username = payload.username || "global";
      if (room) io.to(room).emit("pinned-chat", chat);
      io.to("all").emit("pinned-chat", chat);

      sendToStreamerBot(sbActions.pin, {
        type: 'pin',
        chatNickname: chat.nickname,
        chatMessage: chat.comment,
        chatProfilePic: chat.profilePictureUrl
      });
    });

    socket.on("unpin-chat", (payload: any) => {
      const room = payload?.privateKey || payload?.username;
      if (room) io.to(room).emit("unpin-chat");
      io.to("all").emit("unpin-chat");
    });

    socket.on("update-theme", (payload: any) => {
      const room = payload.privateKey || payload.username;
      if (room) io.to(room).emit("theme-updated", { theme: payload.theme, customTheme: payload.customTheme });
    });

    socket.on("connect-tiktok", async (payload: any) => {
      const rawUsername = typeof payload === "string" ? payload : payload?.username;
      const privateKey = typeof payload === "object" ? String(payload?.privateKey || "").trim() : "";
      const username = String(rawUsername || "").trim().replace(/^@/, "");
      if (!username) return;
      const room = privateKey || username;
      if (privateKey) {
        // verifikasi privateKey bisa ditambah di sini jika mau cek Supabase
        socket.join(room);
      } else {
        socket.join(username);
      }

      const connKey = privateKey ? `${privateKey}:${username}` : username;
      if (connections.has(connKey)) {
        socket.emit("tiktok-connected", "already-connected");
        return;
      }

      console.log(`Connecting to TikTok live for: ${username} | room=${room.slice(0, 8)}...`);
      io.to(room).emit("tiktok-connecting", username);

      const tiktokLiveConnection = new WebcastPushConnection(username, {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 2000,
        disableEulerFallbacks: true
      });

      connections.set(connKey, tiktokLiveConnection);

      tiktokLiveConnection.connect().then((state: any) => {
        console.log(`Connected to room ${state.roomId} | ${room.slice(0, 8)}...`);
        io.to(room).emit("tiktok-connected", state.roomId);
      }).catch((err: any) => {
        console.error("Failed to connect", err);
        connections.delete(connKey);
        let errorMsg = err.message || "Failed to connect";
        if (errorMsg.includes("user_not_found") || errorMsg.includes("liveRoomUserInfo")) {
          errorMsg = "User not found or not currently live.";
        } else if (errorMsg.includes("Unexpected server response: 200")) {
          errorMsg = "TikTok connection failed (Websocket 200). The proxy/network might be blocking the connection or user is offline.";
        }
        io.to(room).emit("tiktok-error", errorMsg);
      });

      tiktokLiveConnection.on("chat", (data: any) => {
        io.to(room).emit("tiktok-chat", data);
        io.to("all").emit("tiktok-chat", data); // Broadcast ke AllChatOverlay
        try {
          const uid = (data.uniqueId || data.nickname || '').toString();
          handlePollVote(room, uid, data.comment);
          handlePollVote('global', uid, data.comment);
        } catch (e) { console.error('poll vote error', e); }
        // Send to Streamer.bot

        sendToStreamerBot(sbActions.chat, {
          type: 'chat',
          nickname: data.nickname,
          comment: data.comment,
          profilePictureUrl: data.profilePictureUrl
        });
      });

      tiktokLiveConnection.on("gift", (data: any) => {
        if (data.giftType === 1 && !data.repeatEnd) {
          // Streak gift in progress, wait for repeatEnd
        } else {
          io.to(room).emit("tiktok-gift", data);

          // Send to Streamer.bot
          sendToStreamerBot(sbActions.gift, {
            type: 'gift',
            nickname: data.nickname,
            giftName: data.giftName,
            repeatCount: data.repeatCount,
            diamondCount: data.diamondCount
          });
        }
      });

      tiktokLiveConnection.on("like", (data: any) => {
        io.to(room).emit("tiktok-like", data);

        // Send to Streamer.bot
        sendToStreamerBot(sbActions.like, {
          type: 'like',
          nickname: data.nickname,
          likeCount: data.likeCount,
          totalLikeCount: data.totalLikeCount
        });
      });

      tiktokLiveConnection.on("social", (data: any) => {
        io.to(room).emit("tiktok-social", data);
      });

      tiktokLiveConnection.on("member", (data: any) => {
        io.to(room).emit("tiktok-member", data);

        // Send to Streamer.bot
        sendToStreamerBot(sbActions.member, {
          type: 'member',
          nickname: data.nickname,
          profilePictureUrl: data.profilePictureUrl
        });
      });

      tiktokLiveConnection.on("roomUser", (data: any) => {
        io.to(room).emit("tiktok-roomUser", data);
        console.log("Room user data:", data);
      });

      tiktokLiveConnection.on("streamEnd", () => {
        io.to(room).emit("tiktok-streamEnd");
        connections.delete(connKey);
      });
    });

    socket.on("disconnect-tiktok", (payload: any) => {
      const rawUsername = typeof payload === "string" ? payload : payload?.username;
      const pKey = typeof payload === "object" ? String(payload?.privateKey || "").trim() : "";
      const u = String(rawUsername || "").trim().replace(/^@/, "");
      const r = pKey || u;
      const cKey = pKey ? `${pKey}:${u}` : u;
      const conn = connections.get(cKey);
      if (conn) {
        conn.disconnect();
        connections.delete(cKey);
        io.to(r).emit("tiktok-disconnected");
      } else if (connections.has(u)) {
        // fallback legacy username-only
        const c2 = connections.get(u);
        if (c2) { c2.disconnect(); connections.delete(u); io.to(u).emit("tiktok-disconnected"); }
      }
    });

    socket.on("mock-events", (username) => {
      socket.join(username);
      console.log("Mocking events started for", username);
      io.to(username).emit("tiktok-connected", "mock-room-id");

      if (mockIntervals.has(username)) {
        clearInterval(mockIntervals.get(username));
      }

      let msgCount = 0;
      const mockInterval = setInterval(() => {
        msgCount++;
        const chatData = {
          uniqueId: `mock_user_${msgCount}`,
          nickname: `User Full ${msgCount}`,
          comment: `This is a mock message ${msgCount} to preview the layout.`,
          profilePictureUrl: `https://ui-avatars.com/api/?name=User+${msgCount}`
        };
        io.to(username).emit("tiktok-chat", chatData);
        io.to("all").emit("tiktok-chat", chatData); // Broadcast mock chat ke AllChatOverlay

        // Send to Streamer.bot
        sendToStreamerBot(sbActions.chat, {
          type: 'chat',
          nickname: chatData.nickname,
          comment: chatData.comment,
          profilePictureUrl: chatData.profilePictureUrl
        });

        if (msgCount % 3 === 0) {
          const likeData = {
            uniqueId: `liker_${msgCount}`,
            nickname: `Liker ${msgCount}`,
            likeCount: Math.floor(Math.random() * 5) + 1,
            totalLikeCount: msgCount * 10
          };
          io.to(username).emit("tiktok-like", likeData);

          // Send to Streamer.bot
          sendToStreamerBot(sbActions.like, {
            type: 'like',
            nickname: likeData.nickname,
            likeCount: likeData.likeCount,
            totalLikeCount: likeData.totalLikeCount
          });
        }

        if (msgCount % 5 === 0) {
          const giftData = {
            uniqueId: `gifter_${msgCount}`,
            nickname: `Gifter ${msgCount}`,
            giftName: "Rose",
            giftPictureUrl: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/99efffccdfcd15c325cdd029c379a613~tplv-obj.png",
            repeatCount: Math.floor(Math.random() * 10) + 1
          };
          io.to(username).emit("tiktok-gift", giftData);

          // Send to Streamer.bot
          sendToStreamerBot(sbActions.gift, {
            type: 'gift',
            nickname: giftData.nickname,
            giftName: giftData.giftName,
            repeatCount: giftData.repeatCount
          });
        }

        if (msgCount % 8 === 0) {
          const memberData = {
            uniqueId: `joiner_${msgCount}`,
            nickname: `Joiner ${msgCount}`,
            profilePictureUrl: `https://ui-avatars.com/api/?name=Joiner+${msgCount}`
          };
          io.to(username).emit("tiktok-member", memberData);

          // Send to Streamer.bot
          sendToStreamerBot(sbActions.member, {
            type: 'member',
            nickname: memberData.nickname,
            profilePictureUrl: memberData.profilePictureUrl
          });
        }
      }, 1500);

      mockIntervals.set(username, mockInterval);
    });

    socket.on("stop-mock", (username) => {
      if (mockIntervals.has(username)) {
        clearInterval(mockIntervals.get(username));
        mockIntervals.delete(username);
      }
      io.to(username).emit("tiktok-disconnected");
    });

    socket.on("disconnect", () => {
      // Don't auto-disconnect TikTok when a single socket leaves, wait for explicit disconnect
      console.log("Client disconnected:", socket.id);
    });
  });

  // Endpoint untuk menerima chat dari Streamer.bot via HTTP (untuk testing dan fleksibilitas)
  app.post('/api/chat', (req, res) => {
    const { username, nickname, comment, profilePictureUrl } = req.body;
    if (nickname && comment) {
      const chatData = {
        uniqueId: username || nickname.toLowerCase().replace(/\s/g, '_'),
        nickname: nickname,
        comment: comment,
        profilePictureUrl: profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}`,
        fromStreamerBot: true
      };

      // Broadcast ke semua client
      io.emit('tiktok-chat', chatData);
      try {
        handlePollVote('global', chatData.uniqueId, chatData.comment);
        for (const r of polls.keys()) if (r !== 'global') handlePollVote(r, chatData.uniqueId, chatData.comment);
      } catch (e) { console.error('poll vote error api', e); }

      res.json({ success: true, data: chatData });
    } else {
      res.status(400).json({ success: false, error: 'nickname and comment are required' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
