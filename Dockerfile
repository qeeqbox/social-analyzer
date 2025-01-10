FROM node:18.15.0-alpine3.17
WORKDIR /usr/src/app
COPY . .
RUN apk update && \
  apk add --no-cache firefox-esr && \
  npm ci && \
  npm install lodash && \
  npm install --loglevel=error
EXPOSE 9005
ENTRYPOINT [ "npm", "start", "--","--docker"]
