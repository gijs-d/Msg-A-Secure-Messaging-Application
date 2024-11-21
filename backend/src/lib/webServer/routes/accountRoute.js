const express = require('express');
const router = express.Router();
const notifyer = require('../notifyer');
const db = require('../../db');
const Cli = require('../../logs');
const cli = new Cli('webServer', 'routes', 'accountRoute.js');

router.use(async (req, res, next) => {
    if (!req.session.user) {
        return res.json({ error: 'Not loged in' });
    }
    next();
});

router.get('/', async (req, res) => {
    const { user } = req.session;
    const userProfile = await db.user.getUsername(user);
    const friendsAndRequests = await db.friend.getFriendAndRequests(user);
    if (!userProfile) {
        req.session.destroy();
        return res.json({ error: 'Not loged in' });
    }
    res.json({ ...userProfile._doc, ...friendsAndRequests });
});

router.get('/requests', async (req, res) => {
    const { user } = req.session;
    let requests = await db.friend.getFriendRequestIds(user);
    if (requests.length > 0) {
        requests = requests.map(r => r.from);
    }
    res.json({ requests });
});

router.get('/searchable', async (req, res) => {
    const { user } = req.session;
    const result = await db.user.getSearchable(user);
    if (!result) {
        return res.json({ error: true });
    }
    res.json(result);
});

router.post('/searchable', async (req, res) => {
    const { user } = req.session;
    const { searchable } = req.body;
    const changed = await db.user.setSearchable(user, searchable);
    res.json({ changed });
});

router.post('/profile', async (req, res) => {
    const { user } = req.session;
    const { profileId } = req.body;
    const profile = await db.user.getUsername(profileId);
    const friend = await db.friend.getFriendship(user, profileId);
    let statusNr = 1;
    switch (friend?.status) {
        case 'accepted':
            statusNr = 0;
            break;
        case 'send':
            statusNr = friend.from == user ? 2 : 3;
            break;
    }
    const status = await db.friend.getUserStatusEnum(statusNr);
    res.json({ profile, status, statusNr });
});

router.post('/friend', async (req, res) => {
    const { user } = req.session;
    const { profileId, status } = req.body;
    const statusnr = await db.friend.getUserStatusEnumNr(status);
    if (statusnr < 0) {
        return;
    }
    let changed = false;
    switch (statusnr) {
        case 0:
            changed = await db.friend.unFriend(user, profileId);
            break;
        case 1:
            changed = await db.friend.sendFriendRequests(user, profileId);
            break;
        case 2:
            changed = await db.friend.cancelFriendRequest(user, profileId);
            break;
        case 3:
            changed = await db.friend.acceptFriendRequest(user, profileId);
            break;
    }
    let nStatus;
    if (changed) {
        nStatus = await db.friend.getStatus(user, profileId);
        notifyer.friendRequest(nStatus.to, nStatus.from, nStatus);
    }
    res.json({ changed: changed && nStatus.userStatusEnum });
});

router.post('/search', async (req, res) => {
    const { query } = req.body;
    const users = await db.user.searchUsers(query);
    res.json(users);
});

router.get('/keys', async (req, res) => {
    const { user } = req.session;
    const keys = await db.user.getKeys(user);
    res.json(keys);
});

router.post('/keys', async (req, res) => {
    const { keys } = req.body;
    const { user } = req.session;
    if (keys.length !== 2) {
        return res.json({ update: false });
    }
    const changedKeys = await db.user.setKeys(user, keys);
    if (!changedKeys) {
        return res.json({ update: false });
    }
    res.json({ update: true });
});

router.post('/androidId', async (req, res) => {
    const { user } = req.session;
    const { androidId } = req.body;
    const update = await db.user.addAndroidId(user, androidId);
    res.json({ update });
});

module.exports = router;
