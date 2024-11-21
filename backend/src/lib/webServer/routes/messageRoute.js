const express = require('express');
const router = express.Router();
const db = require('../../db');
const Cli = require('../../logs');
const fs = require('fs');
const notifyer = require('../notifyer');
const cli = new Cli('webServer', 'routes', 'messageRoute.js');

router.use(async (req, res, next) => {
    if (!req.session.user) {
        return res.json({ error: 'Not loged in' });
    }
    next();
});

router.get('/friendbar', async (req, res) => {
    const { user } = req.session;
    let friendBar = await db.friend.getFriendBar(user);
    if (!friendBar) {
        return res.json({ friendBar: [] });
    }
    const ids = friendBar.map(f => f._id);
    const messages = await db.message.getLastMessages(user, ids);
    friendBar = friendBar.map(friendship => {
        const lastMessage = messages.find(message => message._id.equals(friendship._id));
        if (lastMessage) {
            const send = lastMessage.to.equals(friendship._id);
            const { _id, read, type, msg, createdAt } = lastMessage;
            return {
                ...friendship,
                lastMessage: {
                    _id,
                    msg,
                    send,
                    read,
                    type,
                    createdAt,
                },
                time: createdAt,
            };
        }
        return { ...friendship, time: friendship.acceptedAt };
    });
    friendBar = friendBar.sort((a, b) => b.time - a.time);
    res.json({ friendBar, user });
});

router.get('/unreads', async (req, res) => {
    const { user } = req.session;
    const friendIds = await db.friend.getFriendIds(user);
    const messages = await db.message.getUnreadMessages(user, friendIds);
    res.json({ messages });
});

router.post('/from', async (req, res) => {
    const { user } = req.session;
    const { id, since } = req.body;
    const messages = await db.message.getMessages(user, id, since);
    notifyer.readMsg(user, id);
    res.json({ messages });
});

router.post('/last', async (req, res) => {
    const { user } = req.session;
    const { createdAt } = req.body;
    let lastMsg = await db.message.getLastMessage(user, createdAt);
    if (lastMsg) {
        if (lastMsg.type === 'img') {
            lastMsg.msg = 'sent an image';
        }
        lastMsg = {
            fromUsername: lastMsg.from.username,
            msg: lastMsg.msg,
            keys: lastMsg.from.keys,
        };
    }
    res.json({ lastMsg, user });
});

router.delete('/', async (req, res) => {
    const { user } = req.session;
    const { id } = req.body;
    const message = await db.message.getMessage(user, id);
    if (message && message.type === 'img') {
        try {
            await fs.promises.rm(message.src);
            cli.info('deleted file ' + message.src);
        } catch {
            /* empty */
        }
    }
    let deleted = await db.message.deleteMessage(id, user);
    if (deleted) {
        notifyer.deleteMessage(deleted._id, deleted.from, deleted.to);
        deleted = true;
    }
    res.json({ deleted });
});

module.exports = router;
