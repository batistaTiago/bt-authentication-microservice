FROM node:12-alpine
LABEL maintainer 'Batista Tiago'


COPY ./ /worker

RUN npm install --global node-pre-gyp nodemon
RUN npm install


WORKDIR /worker

CMD [ "npm", "start" ]