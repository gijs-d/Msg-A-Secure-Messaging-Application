const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const Cli = require('../../../logs');
const cli = new Cli('db', 'mongodb', 'models', 'friend.js');

const statusEnum = ['accepted', 'canceled', 'send'];
const userStatusEnum = [
    'Delete friend',
    'Send friend request',
    'Cancel friend request',
    'Accept friend request',
];

const friendSchema = new Schema(
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
        status: {
            type: String,
            enum: statusEnum,
            default: 'send',
            required: true,
        },
        acceptedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

friendSchema.index({ from: 1, to: 1 }, { unique: true });

friendSchema.statics.getStatus = async function (userId, friendId) {
    try {
        const friendship = await this.findOne({
            $or: [
                { from: userId, to: friendId },
                { from: friendId, to: userId },
            ],
        });
        const { from, to } = friendship;
        let statusNr = 1;
        if (friendship?.status === 'accepted') {
            statusNr = 0;
        }
        if (friendship?.status === 'send') {
            statusNr = 2;
            if (friendship.to === userId) {
                statusNr = 3;
            }
        }
        return { userStatusEnum: userStatusEnum[statusNr], statusNr, from, to };
    } catch (e) {
        cli.error('getStatus: ' + e);
        return false;
    }
};

friendSchema.statics.getUserStatusEnum = async function (i) {
    return userStatusEnum[i];
};

friendSchema.statics.getUserStatusEnumNr = async function (txt) {
    return userStatusEnum.indexOf(txt);
};

friendSchema.statics.isPartOfFriendship = async function (userId, friendshipId) {
    try {
        const friendship = await this.findOne({
            _id: friendshipId,
            $or: [{ from: userId }, { to: userId }],
        });
        return !!friendship;
    } catch (e) {
        cli.error('isPartOfFriendship: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendship = async function (user1, user2) {
    try {
        const friendship = await this.findOne({
            $or: [
                { from: user1, to: user2 },
                { from: user2, to: user1 },
            ],
        });
        return friendship;
    } catch (e) {
        cli.error('getFriendship: ' + e);
        return false;
    }
};

friendSchema.statics.unFriend = async function (user1, user2) {
    try {
        await this.findOneAndUpdate(
            {
                $or: [
                    { from: user1, to: user2 },
                    { from: user2, to: user1 },
                ],
            },
            { status: 'canceled' }
        );
        return true;
    } catch (e) {
        cli.error('unFriend: ' + e);
        return false;
    }
};

friendSchema.statics.cancelFriendRequest = async function (user1, user2) {
    try {
        await this.findOneAndUpdate(
            {
                $or: [
                    { from: user1, to: user2 },
                    { from: user2, to: user1 },
                ],
            },
            { status: 'canceled' }
        );
        return true;
    } catch (e) {
        cli.error('cancelFriendRequest: ' + e);
        return false;
    }
};

friendSchema.statics.acceptFriendRequest = async function (to, from) {
    try {
        await this.findOneAndUpdate(
            {
                from,
                to,
                status: 'send',
            },
            {
                status: 'accepted',
                acceptedAt: new Date(),
            }
        );
        return true;
    } catch (e) {
        cli.error('acceptFriendRequest: ' + e);
        return false;
    }
};

friendSchema.statics.createOwnFriendship = async function (id) {
    try {
        const alreadyExcist = await this.findOne({
            from: id,
            to: id,
        });
        if (alreadyExcist) {
            cli.error('already excist');
            return false;
        }
        await this.create({
            from: id,
            to: id,
            status: 'accepted',
            acceptedAt: new Date(),
        });
        return true;
    } catch (e) {
        cli.error('createOwnFriendship: ' + e);
        return false;
    }
};

friendSchema.statics.sendFriendRequests = async function (user1, user2) {
    try {
        const alreadyExcist = await this.findOne({
            $or: [
                { from: user1, to: user2 },
                { from: user2, to: user1 },
            ],
        });
        if (alreadyExcist) {
            if (alreadyExcist.status === 'canceled') {
                await this.findOneAndUpdate(
                    {
                        $or: [
                            { from: user1, to: user2 },
                            { from: user2, to: user1 },
                        ],
                    },
                    {
                        from: user1,
                        to: user2,
                        status: 'send',
                    }
                );
                return true;
            }
            return false;
        }
        await this.create({
            from: user1,
            to: user2,
        });
        return true;
    } catch (e) {
        cli.error('sendFriendRequests: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendBar = async function (uid) {
    try {
        const id = new mongoose.Types.ObjectId(uid);
        const setPopulate = path => ({
            path: path,
            match: { _id: { $ne: id } },
            select: {
                username: 1,
                keys: 1,
            },
        });

        let friends = await this.find(
            {
                $or: [{ from: id }, { to: id }],
                status: 'accepted',
            },
            {
                from: 1,
                to: 1,
                acceptedAt: 1,
            }
        ).populate([setPopulate('from'), setPopulate('to')]);
        let self = friends.find(f => !f.from && !f.to);
        if (self?._id) {
            const selfPopulate = path => ({
                path: path,
                match: { _id: id },
                select: {
                    username: 1,
                    keys: 1,
                },
            });
            friends = friends.filter(f => f.from || f.to);
            self = await this.findOne({ from: id, to: id }, { from: 1, acceptedAt: 1 }).populate([
                selfPopulate('from'),
            ]);
            if (self?.from?._id) {
                self.from.username = `u:${self.from.username}`;
                friends.push(self);
            }
        }
        friends = friends.map(f =>
            f?.from
                ? { ...f.from._doc, acceptedAt: f.acceptedAt }
                : { ...f.to._doc, acceptedAt: f.acceptedAt }
        );
        return friends;
    } catch (e) {
        cli.error('getFriendBar: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendRequests = async function (to) {
    try {
        const friends = await this.find({ to: to, status: 'send' }, { from: 1 }).populate('from', {
            username: 1,
        });
        return friends;
    } catch (e) {
        cli.error('getFriendRequests: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendRequestIds = async function (to) {
    try {
        const friends = await this.find({ to: to, status: 'send' }, { from: 1 });
        return friends;
    } catch (e) {
        cli.error('getFriendRequests: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendIds = async function (id) {
    try {
        const friends = await this.find(
            { $or: [{ to: id }, { from: id }], status: 'accepted' },
            { from: 1, to: 1 }
        );
        return friends.map(f => (f.from == id ? f.to : f.from));
    } catch (e) {
        cli.error('getFriendIds: ' + e);
        return false;
    }
};

friendSchema.statics.getFriendAndRequests = async function (id) {
    try {
        const friendsAndRequests = await this.find(
            {
                $or: [
                    {
                        $or: [{ from: id }, { to: id }],
                        status: 'accepted',
                    },
                    {
                        to: id,
                        status: 'send',
                    },
                ],
            },
            { from: 1, to: 1, status: 1 }
        )
            .populate('from', { username: 1 })
            .populate('to', { username: 1 });

        const friends = friendsAndRequests
            .filter(f => f.status === 'accepted')
            .map(f => (f.to.id === id ? { ...f.from._doc } : { ...f.to._doc }))
            .filter(f => f._id != id);
        const requests = friendsAndRequests
            .filter(f => f.status === 'send')
            .map(f => ({ ...f.from._doc }));
        return { friends, requests };
    } catch (e) {
        cli.error('getFriendAndRequests: ' + e);
        return false;
    }
};

const Friend = model('Friend', friendSchema);

module.exports = Friend;
