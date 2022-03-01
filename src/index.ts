import debug from "debug";
import express from "express";
import http from "http";
import socketIO from "socket.io";
const CosmosClient = require("@azure/cosmos").CosmosClient;

import config from "./config";

const endpoint = config.endpoint;
const key = config.key;

const databaseId = config.database.id;
const containerId = config.container.id;
const partitionKey = { kind: "Hash", paths: ["/id"] };

const options = {
  endpoint: endpoint,
  key: key,
};

const client = new CosmosClient(options);

const database = client.database(databaseId);

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

require("dotenv").config(
  process.env.NODE_ENV !== "development"
    ? { path: ".env.production" }
    : { path: ".env.development" },
);

const app = express();
const port = process.env.PORT || 8080; // default port to listen

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("whiteboard room!!");
});

const server = http.createServer(app);

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

const io = socketIO(server, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin":
        (req.header && req.header.origin) || "http://localhost:3000",
      "Access-Control-Allow-Credentials": true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

io.on("connection", (socket) => {
  ioDebug("connection established!");
  io.to(`${socket.id}`).emit("init-room");
  socket.on("join-room", (roomID) => {
    socketDebug(`${socket.id} has joined ${roomID}`);
    socket.join(roomID);
    if (io.sockets.adapter.rooms[roomID].length <= 1) {
      io.to(`${socket.id}`).emit("first-in-room");
    } else {
      socket.broadcast.to(roomID).emit("new-user", socket.id);
    }
    io.in(roomID).emit(
      "room-user-change",
      Object.keys(io.sockets.adapter.rooms[roomID].sockets),
    );
  });

  socket.on(
    "server-broadcast",
    (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socketDebug(`${socket.id} sends update to ${roomID}`);
      socket.broadcast.to(roomID).emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on(
    "server-volatile-broadcast",
    (roomID: string, encryptedData: ArrayBuffer, iv: Uint8Array) => {
      socketDebug(`${socket.id} sends volatile update to ${roomID}`);
      socket.volatile.broadcast
        .to(roomID)
        .emit("client-broadcast", encryptedData, iv);
    },
  );

  socket.on("sendMessage", async (roomID, lessonId, studentData, callback) => {
    const newItem = {
      id: lessonId,
      data: [...studentData],
    };
    io.to(roomID).emit("store-data", {
      roomId: roomID,
      studentData,
    });

    try {
      const { resource } = await client
        .database(databaseId)
        .container(containerId)
        .items.upsert(newItem, {});
    } catch (err) {
      console.log(err);
    }
    callback(newItem);
  });

  socket.on("retive-data-from-db", async (lessonId, callback) => {
    console.log("retive-data-from-db");
    let resourceData;
    try {
      const querySpec = {
        query: `SELECT * from c where c.id = "${lessonId}"`,
      };

      const { resources: items } = await await client
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec)
        .fetchAll();
      // const { resources } = await client
      //   .database(databaseId)
      //   .container(containerId)
      //   .items.readAll()
      //   .fetchAll({ id: lessonId });

      resourceData = items[0].data;
      io.to(socket.id).emit("retive-data", { roomId: socket.id, items });
    } catch (err) {
      console.log(err);
    }
    callback(resourceData);
  });

  socket.on("disconnecting", () => {
    const rooms = io.sockets.adapter.rooms;
    for (const roomID in socket.rooms) {
      const clients = Object.keys(rooms[roomID].sockets).filter(
        (id) => id !== socket.id,
      );
      if (clients.length > 0) {
        socket.broadcast.to(roomID).emit("room-user-change", clients);
      }
    }
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
  });
});
