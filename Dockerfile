# syntax=docker/dockerfile:1
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install 
CMD ["node", "/app/index.js"]
EXPOSE 3000
