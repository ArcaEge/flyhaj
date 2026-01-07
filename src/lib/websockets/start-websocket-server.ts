import { Server } from "socket.io";

export const startWebsocketServer = async (httpServer: any) => {
  const io = new Server(httpServer);

  let flyingSocket;
  let laptopSocket;

  io.on("connection", (socket) => {
    socket.on("phone", async (data) => {
        flyingSocket = socket;
    });

    socket.on("laptop", async (data) => {
        laptopSocket = socket;
    });

    socket.on("landed", async (data) => {
      console.log(data);

      // Emit a message to the frontend
    //   io.sockets.emit("reset");
      socket.emit("reset");
    });

    // Add any other events here...
  });
};
