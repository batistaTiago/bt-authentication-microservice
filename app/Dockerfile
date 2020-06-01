FROM node:12-alpine
LABEL maintainer 'Batista Tiago'

COPY ./package*.json ./

RUN npm install -g nodemon && \
    npm install

COPY ./ /app

WORKDIR /app

CMD [ "npm", "start" ]