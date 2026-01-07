import { Server } from "socket.io";

export const startWebsocketServer = async (httpServer: any) => {
  const io = new Server(httpServer);

  io.on("connection", (socket) => {    
    socket.on("landed", async (data) => {
      console.log(data);

      // Emit a message to the frontend
    //   io.sockets.emit("reset");
    });

    // Add any other events here...
  });
};
