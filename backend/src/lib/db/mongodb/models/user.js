const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const bcrypt = require('bcrypt');
const saltRounds = 11;
const Cli = require('../../../logs');
const cli = new Cli('db', 'mongodb', 'models', 'user.js');

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
        },
        searchable: {
            type: Boolean,
            required: true,
            default: false,
        },
        password: {
            type: String,
            required: true,
        },
        keys: {
            type: [String, String],
        },
        androidIds: {
            type: [String],
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const hash = await bcrypt.hash(this.password, saltRounds);
    this.password = hash;
    next();
});

userSchema.statics.deleteAndroidId = async function (userId, androidIds) {
    try {
        await this.updateOne({ _id: userId }, { $pullAll: { androidIds: androidIds } });
        return true;
    } catch (e) {
        cli.error('deleteAndroidId: ' + e);
        return false;
    }
};

userSchema.statics.addAndroidId = async function (userId, androidId) {
    try {
        await this.updateOne({ _id: userId }, { $addToSet: { androidIds: androidId } });
        return true;
    } catch (e) {
        cli.error('addAndroidId: ' + e);
        return false;
    }
};

userSchema.statics.getAndroidIds = async function (userId) {
    try {
        return await this.findOne({ _id: userId }, { androidIds: 1 });
    } catch (e) {
        cli.error('getAndroidIds: ' + e);
        return false;
    }
};

userSchema.statics.register = async function (email, password, username) {
    try {
        const { id } = await this.create({ email, password, username });
        return { username, id };
    } catch (e) {
        cli.error('register: ' + e);
        return false;
    }
};

userSchema.statics.login = async function (email, password) {
    try {
        const user = await this.findOne({ email: email });
        if (!user) {
            return false;
        }
        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) {
            return false;
        }
        const { username, id } = user;
        return { username, id };
    } catch (e) {
        cli.error('login: ' + e);
        return false;
    }
};

userSchema.statics.searchUsers = async function (query) {
    try {
        let users = await this.find(
            {
                username: { $regex: query, $options: 'i' },
                searchable: true,
            },
            { username: 1 },
            { limit: 10 }
        );
        if (users.length == 0 && mongoose.isValidObjectId(query)) {
            users = await this.find(
                {
                    _id: query,
                },
                { username: 1, _id: 1 },
                { limit: 1 }
            );
        }
        return users;
    } catch (e) {
        cli.error('searchUsers: ' + e);
        return [];
    }
};

userSchema.statics.getUsername = async function (id) {
    try {
        return await this.findOne({ _id: id }, { username: 1 });
    } catch (e) {
        cli.error('getUsername: ' + e);
        return false;
    }
};

userSchema.statics.getUsernameArray = async function (ids) {
    try {
        return await this.find({ _id: { $in: ids } }, { username: 1 });
    } catch (e) {
        cli.error('getUsernameArray: ' + e);
        return false;
    }
};

userSchema.statics.setSearchable = async function (id, searchable) {
    try {
        await this.findOneAndUpdate({ _id: id }, { searchable });
        return true;
    } catch (e) {
        cli.error('setSearchable: ' + e);
        return false;
    }
};

userSchema.statics.getSearchable = async function (id) {
    try {
        return await this.findOne({ _id: id }, { searchable: 1 });
    } catch (e) {
        cli.error('getSearchable: ' + e);
        return false;
    }
};

userSchema.statics.getUsernameAndKeys = async function (id) {
    try {
        return await this.findOne({ _id: id }, { username: 1, keys: 1 });
    } catch (e) {
        cli.error('getUsernameAndKeys: ' + e);
        return false;
    }
};

userSchema.statics.getUsernameAndKeysArray = async function (ids) {
    try {
        return await this.find({ _id: { $in: ids } }, { username: 1, keys: 1 });
    } catch (e) {
        cli.error('getUsernameAndKeysArray: ' + e);
        return false;
    }
};

userSchema.statics.getKeys = async function (id) {
    try {
        return await this.findOne({ _id: id }, { keys: 1 });
    } catch (e) {
        cli.error('getKeys: ' + e);
        return false;
    }
};

userSchema.statics.setKeys = async function (id, keys) {
    try {
        await this.findOneAndUpdate({ _id: id }, { keys: keys });
        return true;
    } catch (e) {
        cli.error('setKeys: ' + e);
        return false;
    }
};

userSchema.statics.allUsers = async function () {
    try {
        return await this.find();
    } catch (e) {
        cli.error('allUsers: ' + e);
        return false;
    }
};

const User = model('User', userSchema);

module.exports = User;
