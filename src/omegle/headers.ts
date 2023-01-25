import { Headers } from "node-fetch";
const omegleDefaultHeader = new Headers();
omegleDefaultHeader.append("Host", "front41.omegle.com");
omegleDefaultHeader.append(
  "Sec-Ch-Ua",
  '"Chromium";v="91", " Not;A Brand";v="99"'
);
omegleDefaultHeader.append("Accept", "application/json");
omegleDefaultHeader.append("Sec-Ch-Ua-Mobile", "?0");
omegleDefaultHeader.append(
  "User-Agent",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
);
omegleDefaultHeader.append(
  "Content-Type",
  "application/x-www-form-urlencoded; charset=UTF-8"
);
omegleDefaultHeader.append("Origin", "https://www.omegle.com");
omegleDefaultHeader.append("Sec-Fetch-Site", "same-site");
omegleDefaultHeader.append("Sec-Fetch-Mode", "cors");
omegleDefaultHeader.append("Sec-Fetch-Dest", "empty");
omegleDefaultHeader.append("Referer", "https://www.omegle.com/");
omegleDefaultHeader.append("Accept-Language", "en-US,en;q=0.9");

export default omegleDefaultHeader;
