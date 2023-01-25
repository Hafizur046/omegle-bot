import fetch from "node-fetch";
import omegleDefaultHeader from "./headers.js";
import {EventEmitter} from "events";

interface EventHandlers {
  connected: Function;
  gotMessage: Function;
  typing: Function;
  stoppedTyping: Function;
  strangerDisconnected: Function;
}

class Omegle {
  noInterest: boolean;
  clientId: string;
  applicationEnabled: boolean;
  randId: string;
  starterMessage: string;
  state: string;
  eventEmitter: EventEmitter;
  messageIndex: number;
  eventHandlers: EventHandlers;
  strangerDisconnected!: boolean;

  constructor(public serverAddress?: string, public interest?: string) {
    this.serverAddress = "https://front41.omegle.com";
    this.noInterest = false;
    this.clientId = "";
    this.applicationEnabled = false;
    this.randId = "HFMANNL5";
    this.starterMessage = "Hey, m here";
    this.state = "running";
    this.applicationEnabled = true;
    this.eventEmitter = new EventEmitter();
    this.messageIndex = 0;
    this.eventHandlers = {
      connected: async () => {
        this.messageIndex = 0;
        this.state = "connected";
        this.eventEmitter.emit("connected");
        await this.sendMessage(this.starterMessage);
        this.mainEventHandler(this.eventEmitter);
      },
      gotMessage: (event: [string, string]) => {
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
      };

      const response = await fetch(
        `${
          this.serverAddress
        }/start?caps=recaptcha2,t2&firstevents=1&spid=&randid=${this.randId}${
          !this.interest ? "" : `&topics=%5B%22${this.interest}%22%5D`
        }&cc=2f67e107645d1121bbf774489831ba392139cea2&lang=en`,
        requestOptions
      );

      const resBody: any = await response.json();

      //reconnect if asked for captcha or presented antinudeBanned,
      //continiously trying to connect bypasses these
      const eventName: string = resBody.events?.[0][0];
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
      if ((this.eventHandlers as any)[eventName])
        await (this.eventHandlers as any)[eventName](event);

      return;
    } catch (err) {
      throw err;
    }
  }

  async mainEventHandler(emitter: EventEmitter) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
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
        const eventName: string = event[0];
        if ((this.eventHandlers as any)[eventName])
          await (this.eventHandlers as any)[eventName](event);
      });
      if (this.strangerDisconnected) return;

      //recursively call mainEventHandler to keep listening to new events
      this.mainEventHandler(emitter);
      return emitter;
    } catch (err) {
      throw err;
    }
  }

  async sendMessage(message: string, clientId = this.clientId) {
    try {
      var urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);
      urlencoded.append("msg", message);

      var requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
      };

      await fetch(`${this.serverAddress}/send`, requestOptions);
    } catch (err) {
      console.log(err);
    }
  }

  async startTyping(clientId?: string) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
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
  async stopTyping(clientId?: string) {
    try {
      const urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      const requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
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
  async disconnect(clientId?: string) {
    try {
      var urlencoded = new URLSearchParams();
      urlencoded.append("id", clientId || this.clientId);

      var requestOptions = {
        method: "POST",
        headers: omegleDefaultHeader,
        body: urlencoded,
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
