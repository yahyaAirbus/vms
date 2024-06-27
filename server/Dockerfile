FROM node:22.2-alpine

RUN apk update && apk add ffmpeg bash

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001 

EXPOSE 8083

EXPOSE 8554

CMD ["npm", "run", "dev"]
