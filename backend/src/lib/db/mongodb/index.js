const mongodb = require('./mongodb');
const models = require('./models');
module.exports = {
    mongodb,
    ...models,
};
