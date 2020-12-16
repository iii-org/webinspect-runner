FROM node:alpine3.10

WORKDIR /usr/src/app
COPY package.json .
RUN npm install

CMD [ "node", "app.js" ]

COPY . .
