import express from 'express';
import { handler } from './build/handler.js';
import http from 'http';
import {startWebsocketServer} from './start-websocket-server.ts'

const app = express();
const server = http.createServer(app);

app.use(handler);

startWebsocketServer(server);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Listening on ${port}`);
});