FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5001

CMD ["node", "src/server.js"]