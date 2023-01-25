// import * as express from "express";
import express from "express";
import { Server } from "socket.io";
import Omegle from "./omegle/index.js";
// import Omegle from "./omegle/index.js";

//constants
const PORT = process.env["PORT"] || 3000;

const app = express();
app.use(express.static("public/"));

const server = app.listen(PORT, () => {
  // if (err) return;
  console.log("Started successfully! ");
  console.log("You can now view frontend in the browser.\n");
  console.log("http://localhost:" + PORT);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//handle omegle events
const omegle = new Omegle();
omegle.eventEmitter.on("connected", () => {
  io.emit("message", "Connected!");
  return;
});
omegle.eventEmitter.on("strangerDisconnected", async () => {
  io.emit("message", "Stranger Dissconnected!");
  omegle.applicationEnabled && (await omegle.connect());
  return;
});
omegle.eventEmitter.on("message", async (message, messageIndex) => {
  io.emit("message", `Stranger: ${message}`);
  if (messageIndex == 0 && isBot(message)) {
    io.emit("message", "Bot detected! Disconnecting...");
    await omegle.disconnect();
  }
  return;
});
omegle.eventEmitter.on("typing", () => {
  io.emit("started-typing");
  return;
});
omegle.eventEmitter.on("stoppedTyping", () => {
  io.emit("stopped-typing");
  return;
});

function isBot(message: String) {
  message = message.toLowerCase();
  return (
    message.includes("m") ||
    message.includes("http") ||
    message.includes("www") ||
    message.includes("telegram") ||
    message.includes("snap") ||
    message.includes("snaap") ||
    message.includes("@") ||
    message.includes("kik")
  );
}

//handle frontend events from socket.io
async function messageHandler(message: string) {
  io.emit("message", `You: ${message}`);
  if (message === "!help") {
    io.emit(
      "message",
      "available commands: !status `!set $interest` !start !end !kill !stop"
    );
  }
  if (message === "!status") {
    io.emit("message", "---------------------------------------------");
    io.emit(
      "message",
      `interest: ${omegle.interest}, enabled: ${!omegle.noInterest}`
    );
    io.emit("message", ` applicationEnabled: ${omegle.applicationEnabled}`);
    io.emit("message", "---------------------------------------------");
    return;
  }
  if (message === "!start") {
    omegle.applicationEnabled = true;
    await omegle.connect();
    return;
  }
  if (message === "!togglein") {
    omegle.noInterest = !omegle.noInterest;
    io.emit("message", "---------------------------------------------");
    io.emit(
      "message",
      `Interest ${omegle.noInterest ? "disabled" : "enabled"}!`
    );
    io.emit("message", "---------------------------------------------");
    return;
  }
  if (message.split(" ")[0] === "!set") {
    omegle.interest = message.split(" ")[1];
    io.emit("message", "---------------------------------------------");
    io.emit("message", `API: Current interest is ${omegle.interest}`);
    io.emit("message", "---------------------------------------------");
    return;
  }
  if (message === "!greeting") {
    io.emit("message", `You: ${omegle.starterMessage}`);
    return;
  }
  if (message.split(" ")[0] === "!greeting") {
    let wordArray = message.split(" ");
    wordArray.shift();
    omegle.starterMessage = wordArray.reduce((prev, current) => {
      return prev + " " + current;
    });
    io.emit("message", "---------------------------------------------");
    io.emit("message", `API: Current greeting is "${omegle.starterMessage}"`);
    io.emit("message", "---------------------------------------------");
    return;
  }
  if (message === "!end") {
    omegle.applicationEnabled = false;
    return;
  }
  if (message === "!kill") {
    await omegle.disconnect();
    io.emit("message", "You have disconnected.");
    return;
  }
  await omegle.sendMessage(message);
}
io.on("connection", (socket) => {
  socket.on("message", messageHandler);
  socket.on("start-typing", async () => {
    await omegle.startTyping();
  });
  socket.on("stop-typing", async () => {
    await omegle.startTyping();
  });
});
