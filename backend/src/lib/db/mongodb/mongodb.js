const mongoose = require('mongoose');
const Cli = require('../../logs/cli');
const cli = new Cli('db', 'mongodb', 'mongodb.js');

const {
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_HOST,
    MONGODB_PORT,
    MONGODB_DATABASE,
    MONGODB_CONNECTION_STRING,
} = process.env;

class MongoDb {
    constructor() {
        this.loadDB();
    }

    async loadDB() {
        try {
            if (MONGODB_CONNECTION_STRING) {
                await mongoose.connect(MONGODB_CONNECTION_STRING);
            } else {
                await mongoose.connect(
                    `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/?authMechanism=DEFAULT`,
                    { dbName: MONGODB_DATABASE }
                );
            }
            cli.succes('Connected to MongoDB');
        } catch (e) {
            cli.error(e);
            process.exit(1);
        }
    }
}

module.exports = new MongoDb();
