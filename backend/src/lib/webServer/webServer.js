const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const MongoDBStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const {
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_HOST,
    MONGODB_PORT,
    MONGODB_DATABASE,
    CLIENT_ORIGIN,
    MONGODB_CONNECTION_STRING,
    SESSION_SECRET,
    BACKEND_DOCKER_PORT,
} = process.env;

const notifyer = require('./notifyer');
const routes = require('./routes');
const topics = require('./topics');

const Cli = require('../logs');
const cli = new Cli('webServer', 'webServer.js');

const PORT = BACKEND_DOCKER_PORT || 80;

class WebServer {
    app = express();
    server = http.createServer(this.app);
    io = new Server(this.server, {
        cors: {
            origin: 'https://localhost',
        },
        path: '/socket',
    });
    peerServer = ExpressPeerServer(this.server, { debug: true });
    socketHandlers = new Map();

    constructor() {
        this.appFunctions();
        this.sessions();
        this.routes();
        this.topics();
        this.socketRoutes();
        notifyer.io = this.io;
        this.server.listen(PORT, () => {
            cli.log(`listening on http://localhost:${PORT}/`);
        });
    }

    appFunctions() {
        this.app.use(helmet());
        const corsOptions = {
            origin: CLIENT_ORIGIN,
        };
        this.app.use('/peerjs', this.peerServer);
        this.app.use(cors(corsOptions));
        this.app.use(express.static(path.join(__dirname, './public')));
        this.app.disable('x-powered-by');
        this.app.set('trust proxy', 1);
        this.app.use(
            bodyParser.urlencoded({
                extended: true,
            })
        );
        this.app.use(bodyParser.json());
    }

    sessions() {
        let store;
        if (MONGODB_CONNECTION_STRING) {
            store = new MongoDBStore({
                uri: MONGODB_CONNECTION_STRING,
                //databaseName: MONGODB_DATABASE,
                collection: 'sessions',
            });
        } else {
            store = new MongoDBStore({
                uri: `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/?authMechanism=DEFAULT`,
                databaseName: MONGODB_DATABASE,
                collection: 'sessions',
            });
        }
        const sessionMiddleware = session({
            name: 'koekje',
            secret: SESSION_SECRET,
            resave: false,
            store: store,
            saveUninitialized: true,
            cookie: {
                maxAge: 365 * 24 * 60 * 60 * 1000,
            },
        });
        this.app.use(sessionMiddleware);
        const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
        this.io.use(wrap(sessionMiddleware));
    }

    socketRoutes() {
        let i = 0;
        this.peerServer.on('connection', p => {
            console.log(++i, 'peer connection');
        });
        this.peerServer.on('disconnect', client => {
            console.log(--i, 'peer disconnection');
        });
        this.io.on('connection', socket => {
            if (this.socketHandlers.has('connection')) {
                this.socketHandlers.get('connection')(socket);
            }
            socket.onAny((topic, msg) => {
                if (this.socketHandlers.has(topic)) {
                    this.socketHandlers.get(topic)(msg, socket.request.session, this.io, socket.id);
                } else {
                    cli.log('unhandeld', topic, msg);
                }
            });
        });
    }

    socketSend(topic, msg) {
        this.io.emit(topic, msg);
    }

    routes() {
        this.app.use(async (req, res, next) => {
            cli.info(req.url);
            next();
        });
        routes.forEach(route => this.app.use(route[0], route[1]));
        this.app.get('*', async (req, res) => {
            cli.log(`Path not found "${req.path}"`);
            res.sendStatus(404);
        });
    }

    topics() {
        Object.values(topics).forEach(topicMap => {
            topicMap.forEach((handler, topic) => this.socketHandlers.set(topic, handler));
        });
    }

    addSockHandler(topic, handler) {
        this.socketHandlers.set(topic, handler);
    }
}

module.exports = WebServer;
