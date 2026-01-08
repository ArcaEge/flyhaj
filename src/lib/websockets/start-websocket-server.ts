import { Server, Socket, type DefaultEventsMap } from "socket.io";

export const startWebsocketServer = async (httpServer: any) => {
  const io = new Server(httpServer);

  let flyingSocket: Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >;
  let laptopSocket: Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >;

  io.on("connection", (socket) => {
    let connectionType = 0; // 0 = not determined, 1 = laptop, 2 = phone

    socket.on("phone", async () => {
      flyingSocket = socket;
      connectionType = 2;
    });

    socket.on("laptop", async () => {
      laptopSocket = socket;
      connectionType = 1;
    });

    socket.on("reset", async () => {
      if (connectionType === 1) {
        flyingSocket?.emit("reset");
      }
    });

    socket.on("throw", async () => {
      if (connectionType === 2) {
        laptopSocket?.emit("throw");
      }
    });


    socket.on("data", async (data) => {
      if (connectionType === 2) {
        console.log(data);
      }
    });

    socket.on("fly", async () => {
      if (connectionType === 2) {
        laptopSocket?.emit("fly");
      }
    });

    socket.on("land", async (data) => {
      if (connectionType === 2) {
        console.log(data);

        laptopSocket?.emit("land", data);
      }
    });
  });
};
