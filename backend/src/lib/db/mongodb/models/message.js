const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const Cli = require('../../../logs');
const cli = new Cli('db', 'mongodb', 'models', 'message.js');

const messageSchema = new Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        msg: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            required: true,
            default: false,
        },
        type: {
            type: String,
            enum: ['text', 'reply', 'img'],
            default: 'text',
            required: true,
        },
        reply: {
            id: { type: String },
            from: { type: String },
            to: { type: String },
            msg: { type: String },
        },
        src: {
            type: String,
        },
        fileType: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
//messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 });

messageSchema.statics.getMessage = async function (from, id) {
    try {
        const { _id, type, msg, src } = await this.findOne({ _id: id, from });
        return { _id, type, msg, src };
    } catch (e) {
        cli.error('getMessageType: ' + e);
        return false;
    }
};

messageSchema.statics.deleteMessage = async function (message, user) {
    try {
        const { _id, from, to } = await this.findOneAndDelete({ _id: message, from: user });
        return { _id: _id.toString(), from: from.toString(), to: to.toString() };
    } catch (e) {
        cli.error('deleteMessage: ' + e);
        return false;
    }
};

messageSchema.statics.getLastMessage = async function (user, createdAt) {
    try {
        return await this.findOne({ to: user, createdAt }, { from: 1, msg: 1, type: 1 }).populate({
            path: 'from',
            select: ['username', 'keys'],
        });
    } catch (e) {
        cli.error('getLastMessage: ' + e);
        return false;
    }
};

messageSchema.statics.sendMessage = async function (
    from,
    to,
    type,
    msg,
    fileType = false,
    src = false
) {
    try {
        const newObj = { from, to, type, msg };
        if (fileType && src) {
            newObj['fileType'] = fileType;
            newObj['src'] = src;
        }
        return await this.create(newObj);
    } catch (e) {
        cli.error('sendMessage: ' + e);
        return false;
    }
};

messageSchema.statics.sendReplyMessage = async function (from, to, type, msg, reply) {
    try {
        const newObj = { from, to, type, msg, reply };
        return await this.create(newObj);
    } catch (e) {
        cli.error('sendReplyMessage: ' + e);
        return false;
    }
};

messageSchema.statics.readMessage = async function (to, id) {
    try {
        return await this.updateOne({ _id: id, to, read: false }, { read: true });
    } catch (e) {
        cli.error('readMessage: ' + e);
        return false;
    }
};

messageSchema.statics.getMessages = async function (user, friend, since) {
    try {
        const filer = {
            $or: [
                { from: user, to: friend },
                { from: friend, to: user },
            ],
        };
        if (since) {
            filer['createdAt'] = { $lt: since };
        } else {
            await this.updateMany(
                {
                    from: friend,
                    to: user,
                    read: false,
                },
                {
                    read: true,
                }
            );
        }
        return await this.find(filer, {}, { limit: 30, sort: { createdAt: -1 } });
    } catch (e) {
        cli.error('getMessages: ' + e);
        return false;
    }
};

messageSchema.statics.getUnreadMessages = async function (id, ids) {
    try {
        id = new mongoose.Types.ObjectId(id);
        const unreads = await this.aggregate([
            { $match: { to: id, from: { $in: ids }, read: false } },
            { $project: { from: 1 } },
            { $group: { _id: '$from' } },
        ]);
        return unreads.map(u => u._id);
    } catch (e) {
        cli.error('getUnreadMessages: ' + e);
        return false;
    }
};

messageSchema.statics.getLastMessages = async function (id, ids) {
    try {
        id = new mongoose.Types.ObjectId(id);
        return await this.aggregate([
            {
                $match: {
                    $or: [
                        { to: id, from: { $in: ids } },
                        { from: id, to: { $in: ids } },
                    ],
                },
            },
            {
                $project: {
                    from: 1,
                    to: 1,
                    createdAt: 1,
                    msg: 1,
                    read: 1,
                    type: 1,
                    frien: { $cond: { if: { $eq: ['$from', id] }, then: '$to', else: '$from' } },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$frien',
                    from: { $first: '$from' },
                    to: { $first: '$to' },
                    read: { $first: '$read' },
                    type: { $first: '$type' },
                    msg: { $first: '$msg' },
                    createdAt: { $first: '$createdAt' },
                },
            },
        ]);
    } catch (e) {
        cli.error('getLastMessages: ' + e);
        return false;
    }
};

const Message = model('Message', messageSchema);

module.exports = Message;
