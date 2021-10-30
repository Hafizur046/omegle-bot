import fetch, { Headers } from "node-fetch";
import myRL from "serverline";
//const readline = require("readline");
//import readline from "readline";

process.stdout.write("\x1Bc");
console.log(Array(process.stdout.rows + 1).join("\n"));

//const myRL = require("serverline");

var myHeaders = new Headers();
myHeaders.append("Host", "front1.omegle.com");
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
  let response = await fetch(
    "https://front1.omegle.com/start?caps=recaptcha2,t&firstevents=1&spid=&randid=xnxx&topics=%5B%22japan%22%2C%22dhaka%22%5D&lang=bn",
    requestOptions
  );

  let resBody = await response.json();
  console.log(resBody);

  if (resBody.events[0][0] === "recaptchaRequired") {
    doAsyncShit();
    return;
  }

  mainEventHandler(resBody.clientID, 0);
  //sendMessage(resBody.clientID, "hey, f 17 Bangladesh");
  //
  keepAddingShit(resBody.clientID);
}

doAsyncShit();

async function mainEventHandler(clientid, n) {
  var urlencoded = new URLSearchParams();
  urlencoded.append("id", clientid);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  let response = await fetch(
    "https://front1.omegle.com/events",
    requestOptions
  );
  let responseBody = await response.json();
  if (Array.isArray(responseBody)) {
    responseBody.forEach((event) => {
      if (event[0] === "connected") {
        console.log("Connected!");
        sendMessage(clientid, "Hey, m here");
      }
      if (event[0] === "gotMessage") {
        //console.log("\n");
        let message = event[1];
        if (
          message.search("telegram") !== -1 ||
          message.search("Telegram") !== -1 ||
          message.search("TELEGRAM") !== -1
        ) {
          console.log("bot detected!");
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
          console.log("male detected!");
          disconnect(clientid);
          //doAsyncShit();
          //return;
        }
        console.log(`Stranger: ${event[1]}`);
      }
      if (event[0] === "typing") {
        //console.log("\n");
        console.log(`Stranger: Typing....`);
      }
    });
  }

  if (responseBody === null) {
    console.log("Stranger Dissconnected!");
    doAsyncShit();
    return;
  }

  //console.log("\n");
  //console.log(responseBody);
  mainEventHandler(clientid, n + 1);
}

async function sendMessage(clientid, message) {
  var urlencoded = new URLSearchParams();
  urlencoded.append("id", clientid);
  urlencoded.append("msg", message);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  await fetch("https://front1.omegle.com/send", requestOptions);
}

myRL.init();

async function disconnect(clientID) {
  console.log("disconnecting...");
  var urlencoded = new URLSearchParams();
  urlencoded.append("id", clientID);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };
  await fetch("https://front1.omegle.com/disconnect", requestOptions);
}

function keepAddingShit(clientID) {
  myRL.getRL().question("Type: ", function (message) {
    if (message === "kill") {
      console.log("heck yeah");
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
