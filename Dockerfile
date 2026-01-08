FROM node:22-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-bullseye-slim
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
COPY src/lib/websockets/start-websocket-server.ts .
COPY server.js .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh","-c","node server.js"]