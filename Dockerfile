FROM node:12

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "build/src/index.js"]

