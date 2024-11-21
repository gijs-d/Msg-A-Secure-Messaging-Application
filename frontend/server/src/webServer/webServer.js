const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { FRONTEND_DOCKER_PORT, BACKEND_DOCKER_PORT, BACKEND_DOCKER_HOST, NODE_ENV } = process.env;

const Cli = require('../logs');
const cli = new Cli('webserver', 'webserver.js');

const __root = process.cwd();

const sslConfig = {
    key: fs.readFileSync(path.join(__root, 'keys/server.key')),
    cert: fs.readFileSync(path.join(__root, 'keys/server.cert')),
};

let reactDir;
if (NODE_ENV === 'production') {
    reactDir = path.join(__root, '/dist');
} else {
    reactDir = path.join(__root, '../react/dist');
}

class WebServer {
    app = express();
    server = https.createServer(sslConfig, this.app);

    constructor() {
        this.appFunctions();
        this.routes();
        this.server.listen(FRONTEND_DOCKER_PORT, () => {
            cli.log(`listening on https://localhost:${FRONTEND_DOCKER_PORT}/`);
        });
    }

    appFunctions() {
        const helmetOptions = {
            contentSecurityPolicy: {
                directives: {
                    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    'img-src': ["'self'", 'blob:', 'data:'],
                    'default-src': ["'self'", 'https://www.youtube.com'],
                },
            },
        };
        this.app.use(helmet(helmetOptions));
        this.app.use(cors());
        this.app.disable('x-powered-by');
        this.app.use(express.static(reactDir));
    }

    routes() {
        if (NODE_ENV === 'development') {
            this.app.get('*', async (req, res, next) => {
                console.log(req.url);
                next();
            });
        }
        const proxyOptions = {
            target: `http://${BACKEND_DOCKER_HOST}:${BACKEND_DOCKER_PORT}/`,
            changeOrigin: true,
            ws: true,
            pathRewrite: { '^/api': '/' },
            logProvider: () => {
                return cli;
            },
        };
        this.app.use('/api', createProxyMiddleware(proxyOptions));
        this.app.get('*', async (req, res) => {
            res.sendFile(path.join(reactDir, 'index.html'));
        });
    }
}

module.exports = WebServer;
