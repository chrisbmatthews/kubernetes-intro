FROM node:lts-alpine3.14

COPY *.js /home/node/app/
COPY *.json /home/node/app/

RUN cd /home/node/app/ && npm install

WORKDIR /home/node/app
CMD ["npm", "start"]