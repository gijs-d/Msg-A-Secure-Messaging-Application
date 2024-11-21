const db = require('../../db');
const callHandler = require('../callHandler');
const socketTopics = new Map();

socketTopics.set('getPeerId', async (msg, session, io, socketId) => {
    const { peerId } = session;
    io.to(socketId).emit('peerId', { peerId });
});

socketTopics.set('call', async (msg, session, io, socketId) => {
    const { user, peerId } = session;
    const { username } = await db.user.getUsername(user);
    const username2 = (await db.user.getUsername(msg.id)).username;
    const callObj = {
        user: user,
        user2: msg.id,
        username,
        username2,
        peerid: peerId,
        type: msg.type,
    };
    if (!callHandler.addCaller(user, peerId, msg.id, callObj, io)) {
        io.to(peerId).emit('callEnd', { user: msg.id });
        return;
    }
    io.to(msg.peerId).emit('calling', callObj);
});

socketTopics.set('callStart', async (msg, session, io) => {
    const { user } = session;
    io.to(msg.id).emit('callStart', { user });
});

socketTopics.set('stream', async (msg, session, io) => {
    const { user } = session;
    const { id, stream } = msg;
    io.to(id).emit('stream', {
        user,
        stream,
    });
});

socketTopics.set('pingCall', async (msg, session, io, socketId) => {
    const { user, peerId } = session;
    callHandler.callerPing(user, peerId);
});

socketTopics.set('callEnd', async (msg, session, io, socketId) => {
    const { user, peerId } = session;
    if (!callHandler.removeCaller(user, peerId)) {
        return;
    }
    io.to(msg.id).emit('callEnd', {
        user,
    });
});

module.exports = socketTopics;
