FROM node:18

WORKDIR /backend
COPY package.json .
RUN yarn install
ADD ./src ./src
CMD ["npm", "start"]