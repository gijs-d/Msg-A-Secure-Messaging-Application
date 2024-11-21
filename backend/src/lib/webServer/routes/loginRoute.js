const express = require('express');
const router = express.Router();

const db = require('../../db');
const Cli = require('../../logs');
const cli = new Cli('webServer', 'routes', 'loginRoute.js');

router.get('/logout', async (req, res) => {
    req.session.destroy();
    res.json({ logdout: true });
});

router.get('/islogdin', async (req, res) => {
    if (!req.session.peerId) {
        const id = Math.random().toString(36).slice(2) + new Date().getTime().toString(36);
        req.session.peerId = id;
    }
    if (req.session.user) {
        return res.json({ user: req.session.user });
    }
    res.json({ user: undefined });
});

router.use('/*', async (req, res, next) => {
    if (req.session.user) {
        return res.json({ error: 'already logd in' });
    }
    next();
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    const login = await db.user.login(email, password);
    if (!login) {
        return res.json({ error: 'Invalid login' });
    }
    req.session.user = login.id;
    req.session.username = login.username;
    res.json(login);
});

router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;
    const register = await db.user.register(email, password, username);
    if (!register) {
        return res.json({ error: 'Invalid register' });
    }
    db.friend.createOwnFriendship(register.id);
    req.session.user = register.id;
    req.session.username = register.username;
    res.json(register);
});

module.exports = router;
