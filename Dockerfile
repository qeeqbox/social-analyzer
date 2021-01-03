FROM node:14.15.3-alpine3.12
WORKDIR /usr/src/app
COPY . .
RUN apk update && \
  apk add --no-cache firefox-esr tesseract-ocr && \
  npm install lodash && \
  npm install
EXPOSE 9005
ENTRYPOINT [ "npm", "start" ]
