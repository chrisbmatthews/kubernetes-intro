FROM node:lts-alpine3.14

COPY *.js /home/node/app/
COPY *.json /home/node/app/
COPY scripts/*.sh /home/node/app/

RUN chmod +x /home/node/app/*.sh && cd /home/node/app/ && npm install

WORKDIR /home/node/app
CMD ["sh", "start.sh"]