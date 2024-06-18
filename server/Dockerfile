
FROM node:22.2-alpine

RUN apk update && apk add ffmpeg

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "dev"]
