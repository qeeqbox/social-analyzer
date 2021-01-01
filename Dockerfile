FROM node:latest
RUN apt-get update && apt-get install -y firefox-esr tesseract-ocr
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install lodash
RUN npm install
COPY . .
EXPOSE 9005
CMD [ "npm", "start" ]
