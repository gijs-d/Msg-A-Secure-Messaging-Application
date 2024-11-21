const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../../db');
const Cli = require('../../logs');
const cli = new Cli('webServer', 'routes', 'uploadRoute.js');

router.use(async (req, res, next) => {
    if (!req.session.user) {
        return res.json({ error: 'Not loged in' });
    }
    next();
});

router.get('/androidApk', (req, res) => {
    const file = path.join(__dirname, '../downloads/androidApk/msgv7.apk');
    res.download(file);
});

router.get('/:friendId/:fileId', async (req, res) => {
    const { user } = req.session;
    const { friendId, fileId } = req.params;
    const access = await db.friend.isPartOfFriendship(user, friendId);
    if (!access) {
        return res.json({ error: false });
    }
    const filePath = `uploads/${friendId}/${fileId}`;
    let excist = false;
    try {
        const stat = await fs.promises.stat(filePath);
        excist = stat.isFile();
    } catch {
        /* empty */
    }
    if (!excist) {
        return res.json({ error: true });
    }
    const file = await fs.promises.readFile(filePath);
    res.send(file);
});

module.exports = router;
