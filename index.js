import fetch, { Headers } from "node-fetch";
import myRL from "serverline";

//const express = require("express");
import express from "express";

const app = express();

app.use(express.static("./public"));

//const { Server } = require("socket.io");
import { Server } from "socket.io";

//global state
let noInterest = false;
let globalClientId = "";
let globalInterest = "japan";
let applicationEnabled = false;
let globalStarterMessage = "Hey, m here";

//socket.io shits

let server = app.listen(3000);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//io.listen(80);

io.on("connection", (socket) => {
  //doAsyncShit();

  socket.on("message", (message) => {
    //message = String(message);
    console.log(message);
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
        `interest: ${globalInterest}, enabled: ${!noInterest}`
      );
      io.emit("message", ` applicationEnabled: ${applicationEnabled}`);
      io.emit("message", "---------------------------------------------");
      return;
    }
    if (message === "!start") {
      applicationEnabled = true;
      doAsyncShit();
      return;
    }
    if (message === "!togglein") {
      noInterest = !noInterest;
      io.emit("message", "---------------------------------------------");
      io.emit("message", `Interest ${noInterest ? "disabled" : "enabled"}!`);
      io.emit("message", "---------------------------------------------");
      return;
    }
    if (message.split(" ")[0] === "!set") {
      globalInterest = message.split(" ")[1];
      io.emit("message", "---------------------------------------------");
      io.emit("message", `API: Current interest is ${globalInterest}`);
      io.emit("message", "---------------------------------------------");
      return;
    }
    if (message === "!greeting") {
      io.emit("message", `You: ${globalStarterMessage}`);
      return;
    }
    if (message.split(" ")[0] === "!greeting") {
      let wordArray = message.split(" ");
      wordArray.shift();
      //console.log(wordArray);
      globalStarterMessage = wordArray.reduce((prev, current) => {
        return prev + " " + current;
      });
      io.emit("message", "---------------------------------------------");
      io.emit("message", `API: Current greeting is "${globalStarterMessage}"`);
      io.emit("message", "---------------------------------------------");
      return;
    }
    if (message === "!end") {
      applicationEnabled = false;
      return;
    }
    if (message === "!kill") {
      disconnect(globalClientId);
      return;
    }
    sendMessage(globalClientId, message);
  });
  socket.on("start-typing", () => {
    startTyping(globalClientId);
  });
  socket.on("stop-typing", () => {
    endTypinng(globalClientId);
  });
});

process.stdout.write("\x1Bc");
console.log(Array(process.stdout.rows + 1).join("\n"));

//const myRL = require("serverline");

var myHeaders = new Headers();
myHeaders.append("Host", "front25.omegle.com");
myHeaders.append("Sec-Ch-Ua", '"Chromium";v="91", " Not;A Brand";v="99"');
myHeaders.append("Accept", "application/json");
myHeaders.append("Sec-Ch-Ua-Mobile", "?0");
myHeaders.append(
  "User-Agent",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
);
myHeaders.append(
  "Content-Type",
  "application/x-www-form-urlencoded; charset=UTF-8"
);
myHeaders.append("Origin", "https://www.omegle.com");
myHeaders.append("Sec-Fetch-Site", "same-site");
myHeaders.append("Sec-Fetch-Mode", "cors");
myHeaders.append("Sec-Fetch-Dest", "empty");
myHeaders.append("Referer", "https://www.omegle.com/");
myHeaders.append("Accept-Language", "en-US,en;q=0.9");

var requestOptions = {
  method: "POST",
  headers: myHeaders,
  redirect: "follow",
};

async function doAsyncShit() {
  try {
    let response = await fetch(
      `https://front25.omegle.com/start?caps=recaptcha2,t&firstevents=1&spid=&randid=jasdf${
        noInterest ? "" : `&topics=%5B%22${globalInterest}%22%5D`
      }&lang=bn`,
      requestOptions
    );

    let resBody = await response.json();

    if (resBody.events && resBody.events[0][0] === "recaptchaRequired") {
      applicationEnabled && doAsyncShit();
      return;
    }
    if (resBody.events && resBody.events[0][0] === "antinudeBanned") {
      applicationEnabled && doAsyncShit();
      return;
    }

    // this globalClientId is used by the socket server to send messages received from the socket.io - client
    globalClientId = resBody.clientID;

    mainEventHandler(resBody.clientID, 0);
    keepAddingShit(resBody.clientID);
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

async function mainEventHandler(clientid, n) {
  try {
    var urlencoded = new URLSearchParams();
    urlencoded.append("id", clientid);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(
      "https://front25.omegle.com/events",
      requestOptions
    );
    let responseBody = await response.json();
    if (Array.isArray(responseBody)) {
      responseBody.forEach((event) => {
        if (event[0] === "connected") {
          io.emit("message", "Connected!");
          sendMessage(clientid, globalStarterMessage);
          //sendMessage(resBody.clientID, "hey, f 17 Bangladesh");
        }
        if (event[0] === "gotMessage") {
          //console.log("\n");
          let message = event[1];
          if (
            message.search("telegram") !== -1 ||
            message.search("Telegram") !== -1 ||
            message.search("TELEGRAM") !== -1
          ) {
            io.emit("message", "bot detected!");
            disconnect(clientid);
            //doAsyncShit();
            return;
          }
          if (
            (n === 1 || n === 0) &&
            (message.search("m") !== -1 ||
              message.search("M") !== -1 ||
              message.search("male") !== -1)
          ) {
            io.emit("message", "male detected!");
            disconnect(clientid);
            //doAsyncShit();
            //return;
          }
          io.emit("message", `Stranger: ${event[1]}`);
        }
        if (event[0] === "typing") {
          io.emit("started-typing");
        }
        if (event[0] === "stoppedTyping") {
          io.emit("stopped-typing");
        }
        if (event[0] === "strangerDisconnected") {
          io.emit("message", "Stranger Dissconnected!");
          applicationEnabled && doAsyncShit();
          return;
        }
      });
    }
    if (responseBody === null) {
      //console.log("Stranger Dissconnected!");
      //doAsyncShit();
      return;
    }

    //console.log("\n");
    //console.log(responseBody);
    mainEventHandler(clientid, n + 1);
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

async function sendMessage(clientid, message) {
  try {
    var urlencoded = new URLSearchParams();
    urlencoded.append("id", clientid);
    urlencoded.append("msg", message);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    await fetch("https://front25.omegle.com/send", requestOptions);
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

myRL.init();

async function startTyping(clientID) {
  try {
    var urlencoded = new URLSearchParams();
    urlencoded.append("id", clientID);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(
      "https://front25.omegle.com/typing",
      requestOptions
    );
    await response.text();
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

async function endTypinng(clientID) {
  try {
    var urlencoded = new URLSearchParams();
    urlencoded.append("id", clientID);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };

    let response = await fetch(
      "https://front25.omegle.com/stoppedtyping",
      requestOptions
    );
    await response.text();
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

async function disconnect(clientID) {
  try {
    var urlencoded = new URLSearchParams();
    urlencoded.append("id", clientID);

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
      redirect: "follow",
    };
    await fetch("https://front25.omegle.com/disconnect", requestOptions);
    io.emit("message", "You have disconnected.");
    applicationEnabled && doAsyncShit();
  } catch (err) {
    console.log(err);
    io.send("message", String(err));
  }
}

function keepAddingShit(clientID) {
  myRL.getRL().question("Type: ", function (message) {
    if (message === "kill") {
      //console.log("heck yeah");
      disconnect(clientID);
      return;
    }
    console.log(`You: ${message}`);
    sendMessage(clientID, message);
    keepAddingShit(clientID);
  });
}

//.then((response) => response.json())
//.then((result) => console.log(result))
//.catch((error) => console.log("error", error));
