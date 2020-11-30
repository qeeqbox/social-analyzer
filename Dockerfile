FROM node:latest
RUN apt-get update && apt-get install -y firefox-esr tesseract-ocr
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install lodash
RUN npm install
COPY . .
CMD [ "npm", "start" ]