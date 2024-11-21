const db = require('../db');
const androidPush = require('../androidPush');

class Notifyer {
    io;
    async friendRequest(to, from, status) {
        switch (status.statusNr) {
            case 0:
                this.confirmrequest(to, from, status);
                break;
            case 1:
                this.deleterequest(to, from, status);
                break;
            case 2:
                this.addrequest(to, from, status);
                break;
            case 3:
                this.acceptrequest(to, from, status);
                break;
        }
    }

    async addrequest(to, from, status) {
        const userFromDb = await db.user.getUsername(from);
        if (!userFromDb) {
            return;
        }
        const { username } = userFromDb;
        status = await db.friend.getUserStatusEnum(3);
        this.io.to(to.toString()).emit('newRequest', {
            from,
            fromUsername: username,
            status: {
                userStatusEnum: status,
                statusNr: 3,
            },
        });
    }

    async confirmrequest(to, from, status) {
        const userFromDb = await db.user.getUsername(to);
        if (!userFromDb) {
            return;
        }
        const { username } = userFromDb;
        this.io
            .to(from.toString())
            .emit('confirmRequest', { from, to, status, fromUsername: username });
        this.io.to(to.toString()).emit('confirmRequest', { to, from, status });
    }

    async deleterequest(to, from, status) {
        this.io.to(to.toString()).emit('deleteRequest', { from, to, status });
        this.io.to(from.toString()).emit('deleteRequest', { from, to, status });
    }

    async deleteMessage(message, from, to) {
        this.io.to(from).emit('deleteMessage', { message, from });
        this.io.to(to).emit('deleteMessage', { message, from });
    }

    async addMsg(to, from, type, msg, createdAt) {
        if (type === 'img') {
            msg = 'image';
        }
        const { username, keys } = await db.user.getUsernameAndKeys(from);
        createdAt = new Date(createdAt).getTime();
        this.io.to(to).emit('newMsg', { from, fromUsername: username, keys, msg, createdAt });
        const { androidIds } = await db.user.getAndroidIds(to);
        if (androidIds?.length > 0) {
            const badIds = await androidPush.sendMessages(androidIds, createdAt);
            if (badIds.length > 0) {
                db.user.deleteAndroidId(to, badIds);
            }
        }
    }

    async readMsg(to, from) {
        this.io.to(to).emit('readMsg', { from });
    }
}

module.exports = new Notifyer();
