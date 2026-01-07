import { type ViteDevServer } from "vite";
import { startWebsocketServer } from "./start-websocket-server";

export const configureServer = (server: ViteDevServer) => {
  if (!server.httpServer) return;

  startWebsocketServer(server.httpServer);
};

const webSocketServer = {
  name: "webSocketServer",
  configureServer,
};

export default webSocketServer;
