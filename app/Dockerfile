FROM node:12-alpine
LABEL maintainer 'Batista Tiago'


COPY ./ /app

RUN npm install --global node-pre-gyp nodemon
RUN apk --no-cache add --virtual builds-deps build-base python


RUN npm install bcrypt
RUN npm install

WORKDIR /app

CMD [ "npm", "start" ]