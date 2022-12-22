import fetch from "node-fetch";
import omegleDefaultHeader from "./headers.js";
import EventEmmitter from "events";

class Omegle {
  constructor(server) {
    this.serverAddress = server || "https://front41.omegle.com";
    this.noInterest = false;
    this.clientId = "";
    this.interest;
    this.applicationEnabled = false;
    this.randId = "HFMANNL5";
    this.starterMessage = "Hey, m here";
    this.state = "running";
    this.applicationEnabled = true;
    this.eventEmitter = new EventEmmitter();
    this.messageIndex = 0;
  }

  async connect() {
    try {
      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        redirect: "follow",
      };

      const response = await fetch(
        `${
          this.serverAddress
        }/start?caps=recaptcha2,t2&firstevents=1&spid=&randid=${this.randId}${
          !this.interest ? "" : `&topics=%5B%22${this.interest}%22%5D`
        }&cc=2f67e107645d1121bbf774489831ba392139cea2&lang=en`,
        requestOptions
      );

      const resBody = await response.json();

      //reconnect if asked for captcha or presented antinudeBanned,
      //continiously trying to connect bypasses these
      if (resBody.events && resBody.events[0][0] === "recaptchaRequired") {
        console.log("captcha!");
        this.applicationEnabled && this.connect();
        return;
      }
      if (resBody.events && resBody.events[0][0] === "antinudeBanned") {
        console.log("antinudeBanned!");
        this.applicationEnabled && this.connect();
        return;
      }

      this.messageIndex = 0;
      this.state = "connected";
      this.eventEmitter.emit("connected");
      await this.sendMessage(this.starterMessage);
      this.clientId = resBody.clientID;
      this.mainEventHandler(this.eventEmitter);
      return;
    } catch (err) {
      throw err;
    }
  }

  async mainEventHandler(emitter) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(
        `${this.serverAddress}/events`,
        requestOptions
      );
      const responseBody = await response.json();

      if (!Array.isArray(responseBody) || responseBody === null) {
        return;
      }

      let strangerDisconnected = false;
      const eventHandlers = {
        gotMessage: (event) => {
          const message = event[1];
          emitter.emit("message", message, this.messageIndex);
          this.messageIndex++;
        },
        typing: () => {
          emitter.emit("typing");
        },
        stoppedTyping: () => {
          emitter.emit("stoppedTyping");
        },
        strangerDisconnected: () => {
          console.log("disconnected!");
          emitter.emit("strangerDisconnected");
          strangerDisconnected = true;
        },
      };

      responseBody.forEach(async (event) => {
        const eventName = event[0];
        eventHandlers[eventName] && eventHandlers[eventName](event);
      });
      if (strangerDisconnected) return;

      //recursively call mainEventHandler to keep listening to new events
      this.mainEventHandler(emitter);
      return emitter;
    } catch (err) {
      throw err;
    }
  }

  async sendMessage(message, clientid = this.clientId) {
    try {
      var urlencoded = new URLSearchParams();
      urlencoded.append("id", this.clientId);
      urlencoded.append("msg", message);

      var requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
        redirect: "follow",
      };

      await fetch(`${this.serverAddress}/send`, requestOptions);
    } catch (err) {
      console.log(err);
      io.send("message", String(err));
    }
  }

  async startTyping(clientId) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(
        `${this.serverAddress}/typing`,
        requestOptions
      );
      return await response.text();
    } catch (err) {
      throw err;
    }
  }
  async stopTyping(clientId) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
        redirect: "follow",
      };

      const response = await fetch(
        `${this.serverAddress}/stoppedtyping`,
        requestOptions
      );
      return await response.text();
    } catch (err) {
      throw err;
    }
  }
  async disconnect(clientId) {
    try {
      var urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      var requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
        redirect: "follow",
      };
      await fetch(`${this.serverAddress}/disconnect`, requestOptions);
      this.applicationEnabled && this.connect();
    } catch (err) {
      console.error(err);
      this.eventEmitter.emit("message", String(err));
    }
  }
}

export default Omegle;
