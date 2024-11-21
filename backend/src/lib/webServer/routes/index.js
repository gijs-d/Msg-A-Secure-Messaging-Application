//name: ['/path', require('./router')],
module.exports = [
    ['/', require('./mainRoute')],
    ['/login', require('./loginRoute')],
    ['/account', require('./accountRoute')],
    ['/message', require('./messageRoute')],
    ['/uploads', require('./uploadsRoute')],
];
