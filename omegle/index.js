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
    this.eventHandlers = {
      connected: async () => {
        this.messageIndex = 0;
        this.state = "connected";
        this.eventEmitter.emit("connected");
        await this.sendMessage(this.starterMessage);
        this.mainEventHandler(this.eventEmitter);
      },
      gotMessage: (event) => {
        const message = event[1];
        this.eventEmitter.emit("message", message, this.messageIndex);
        this.messageIndex++;
      },
      typing: () => {
        this.eventEmitter.emit("typing");
      },
      stoppedTyping: () => {
        this.eventEmitter.emit("stoppedTyping");
      },
      strangerDisconnected: () => {
        console.log("disconnected!");
        this.eventEmitter.emit("strangerDisconnected");
        this.strangerDisconnected = true;
      },
    };
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
      const eventName = resBody.events?.[0][0];
      const event = resBody.events?.[0][1];
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

      this.clientId = resBody.clientID;
      this.eventHandlers[eventName] &&
        (await this.eventHandlers[eventName](event));

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

      this.strangerDisconnected = false;

      responseBody.forEach(async (event) => {
        const eventName = event[0];
        this.eventHandlers[eventName] && this.eventHandlers[eventName](event);
      });
      if (this.strangerDisconnected) return;

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
