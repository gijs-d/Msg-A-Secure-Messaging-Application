const uuid = require('uuid');
const fs = require('fs');
const db = require('../../db');
const notifyer = require('../notifyer');
const socketTopics = new Map();

socketTopics.set('msg', async (msg, session, io) => {
    if (!session || !session.user) {
        return;
    }
    const { user } = session;
    let newmsg;
    if (msg.type === 'text') {
        newmsg = await db.message.sendMessage(user, msg.to, msg.type, msg.msg);
    }
    if (msg.type === 'reply') {
        newmsg = await db.message.sendReplyMessage(user, msg.to, msg.type, msg.msg, msg.reply);
    }
    if (msg.type === 'img') {
        const filename = `${uuid.v4()}.${msg.ext}`;
        const friendId = await db.friend.getFriendship(user, msg.to);
        if (!friendId) {
            return;
        }
        let filePath = `uploads/${friendId.id}`;
        let ok = false;
        try {
            const stat = await fs.promises.stat(filePath);
            ok = stat.isDirectory();
        } catch {
            /* empty */
        }
        if (!ok) {
            await fs.promises.mkdir(filePath);
        }
        filePath += `/${filename}`;
        await fs.promises.writeFile(filePath, Buffer.from(msg.src, 'binary'));
        newmsg = await db.message.sendMessage(
            user,
            msg.to,
            msg.type,
            msg.msg,
            msg.filetype,
            filePath
        );
    }
    if (!newmsg) {
        return;
    }
    if (msg.to != user) {
        io.to(msg.to).emit('msg', newmsg);
    }
    io.to(user).emit('msg', newmsg);
    notifyer.addMsg(msg.to, user, newmsg.type, newmsg.msg, newmsg.createdAt);
});

socketTopics.set('readMsg', async (msg, session, io) => {
    const { user } = session;
    await db.message.readMessage(user, msg.id);
    notifyer.readMsg(user, msg.from);
});

socketTopics.set('typing', async (msg, session, io) => {
    const { user } = session;
    const { to, state } = msg;
    io.to(to).emit('typing', { user, state });
});

module.exports = socketTopics;
