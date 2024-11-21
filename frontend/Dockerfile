
FROM node:18 as build-stage
WORKDIR /react
COPY ./react/package.json .
RUN npm install
ADD ./react/src ./src
ADD ./react/public ./public
COPY ./react/.babelrc .
COPY ./react/webpack.config.js .

RUN npm run build

FROM node:18 as serv-stage
WORKDIR /server
COPY --from=build-stage react/dist ./dist
COPY ./server/package.json .
RUN npm install
ADD ./server/src ./src
ADD ./server/keys ./keys

CMD ["npm", "start"]