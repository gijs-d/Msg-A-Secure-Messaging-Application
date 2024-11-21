const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');
const Cli = require('../logs/cli');
const cli = new Cli('AndroidPush', 'AndroidPush.js');
const {
    FCM_PRIVATE_KEY,
    FCM_PRIVATE_KEY_ID,
    FCM_PROJECT_ID,
    FCM_CLIENT_EMAIL,
    FCM_CLIENT_ID,
    FCM_CLIENT_X509_CERT_URL,
} = process.env;

class AndroidPush {
    constructor() {
        serviceAccount['private_key_id'] = FCM_PRIVATE_KEY_ID;
        serviceAccount['private_key'] = FCM_PRIVATE_KEY;
        serviceAccount['project_id'] = FCM_PROJECT_ID;
        serviceAccount['client_email'] = FCM_CLIENT_EMAIL;
        serviceAccount['client_id'] = FCM_CLIENT_ID;
        serviceAccount['client_x509_cert_url'] = FCM_CLIENT_X509_CERT_URL;
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            this.messaging = admin.messaging();
        } catch (e) {
            if (e.code === 'app/invalid-credential') {
                cli.error(`Error: invalid credential, FCM deactivated: ${e}`);
                this.messaging = { send: () => {} };
                return;
            }
            cli.error(`FCM login failed: ${e}`);
        }
    }

    async sendMessages(tokens, createdAt) {
        return (await Promise.all(tokens.map(token => this.sendMessage(token, createdAt))))
            .filter(b => !b[0])
            .map(b => b[1]);
    }

    async sendMessage(token, createdAt) {
        const message = {
            data: {
                title: 'update',
                createdAt: String(createdAt),
            },
            android: {
                priority: 'high',
                collapseKey: 'hey',
            },
            token,
        };
        try {
            await this.messaging.send(message);
        } catch (e) {
            if (e?.errorInfo?.code == 'messaging/registration-token-not-registered') {
                return [false, token];
            }
            cli.error(e.errorInfo);
        }
        return [true];
    }
}

module.exports = new AndroidPush();
