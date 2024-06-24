FROM node:22.2-alpine

RUN apk update && apk add ffmpeg bash

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
