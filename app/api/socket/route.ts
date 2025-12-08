import { Server } from "socket.io";

export const dynamic = "force-dynamic";

declare global {
  var io: Server | undefined;
}

export async function GET() {
  if (!global.io) {
    console.log("🔥 Socket.IO iniciado");

    global.io = new Server({
      path: "/api/socket",
      cors: {
        origin: "*",
      },
    });

    global.io.on("connection", (socket) => {
      console.log("Usuário conectado:", socket.id);

      socket.on("join-room", ({ roomId, username }) => {
        console.log(`Entrou na sala ${roomId}`);
        socket.join(roomId);

        socket.to(roomId).emit("user-joined", username);
      });

      socket.on("typing", ({ roomId, progress }) => {
        socket.to(roomId).emit("opponent-typing", progress);
      });

      socket.on("finish", ({ roomId, wpm }) => {
        socket.to(roomId).emit("opponent-finished", wpm);
      });

      socket.on("disconnect", () => {
        console.log("Usuário desconectado:", socket.id);
      });
    });
  }

  return new Response("Socket running");
}
