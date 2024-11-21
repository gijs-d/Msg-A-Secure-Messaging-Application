const socketTopics = new Map();

socketTopics.set('connection', async socket => {
    const userId = socket.request.session.user;
    socket.join(userId);
    socket.join(socket.request.session.peerId);
});

module.exports = socketTopics;
