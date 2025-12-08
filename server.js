const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Usuário conectado:", socket.id);

    socket.on("join-room", ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`${socket.id} entrou na sala ${roomId}`);

      socket.to(roomId).emit("user-joined", username);
    });

    socket.on("typing", ({ roomId, progress, index }) => {
      socket.to(roomId).emit("opponent-typing", { progress, index });
    });

    socket.on("advance", ({ roomId, index }) => {
      socket.to(roomId).emit("opponent-advanced", { index });
    });

    socket.on("finish", ({ roomId, wpm }) => {
      socket.to(roomId).emit("opponent-finished", wpm);
    });

    socket.on("disconnect", () => {
      console.log("Usuário saiu:", socket.id);
    });
  });

  server.listen(3000, () => {
    console.log("🚀 Server + Socket rodando em http://localhost:3000");
  });
});
