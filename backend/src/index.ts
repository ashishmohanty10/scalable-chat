import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";

const publishClient = createClient();
publishClient.connect();

const subscribeClient = createClient();
subscribeClient.connect();

const server = http.createServer();
const port = 4000;

const wss = new WebSocketServer({ server });

const subscriptions: {
  [key: string]: {
    ws: WebSocket;
    rooms: string[];
  };
} = {};

wss.on("connection", (connection, req) => {
  const userId = randomId();
  console.log(`testUser${userId} connected`);
  subscriptions[userId] = {
    ws: connection,
    rooms: [],
  };

  connection.on("message", (data) => {
    const parsedMessage = JSON.parse(data.toString());

    if (parsedMessage.type === "SUBSCRIBE") {
      subscriptions[userId].rooms.push(parsedMessage.room);
    }

    if (parsedMessage.type === "UNSUBSCRIBE") {
      subscriptions[userId].rooms = subscriptions[userId].rooms.filter(
        (x) => x !== parsedMessage.roomId
      );
    }

    if (parsedMessage === "sendMessage") {
      const message = parsedMessage.message;
      const roomId = parsedMessage.roomId;

      publishClient.publish(
        roomId,
        JSON.stringify({
          type: "sendMessage",
          roomId: roomId,
          message: message,
        })
      );
    }
  });
});

function randomId() {
  return Math.floor(Math.random() * 10);
}

server.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
