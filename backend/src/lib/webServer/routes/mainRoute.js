const express = require('express');
const router = express.Router();
const path = require('path');
const Cli = require('../../logs');
const cli = new Cli('webServer', 'routes', 'mainRoute.js');

///router.get('/*', async (req, res) => {
//       res.sendFile(
//              path.join(__dirname, '../public/index.html')
//       );
//});
module.exports = router;
