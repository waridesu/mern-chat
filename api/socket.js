const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require('crypto');
const MessageModel = require('./models/Message');
const jwtSecret = process.env.JWT_SECRET;

function setupSocketIoServer(server) {
    const io = require('socket.io')(server, {cors: {origin: "*"}});


    io.on('connection', (socket) => {

        function notifyAboutOnlinePeople() {
            // notify all clients that a new user has connected
            socket.broadcast.emit('online', {
                online: Array.from(io.sockets.sockets.values()).map(s => ({userId: s.userId, username: s.username}))
            });
        }

        // read user name and id from the token
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
            const tokenCookieString = cookies.split(';').find(str => str.startsWith('token=')).split('=')[1];
            if (tokenCookieString) {
                jwt.verify(tokenCookieString, jwtSecret, {}, (err, payload) => {
                    if (err) {
                        throw err;
                    }
                    const {userId, username} = payload;
                    socket.userId = userId;
                    socket.username = username;
                });
            }
        }

        notifyAboutOnlinePeople();

        socket.on('message', async (message) => {
            const {recipient, text, file, id} = message;
            let fileName = null;
            if (file) {
                const parts = file.name.split('.');
                const ext = parts[parts.length - 1];
                fileName = `${crypto.randomUUID()}.${ext}`;
                const filePath = __dirname + '/uploads/' + fileName;
                const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
                fs.writeFile(filePath, bufferData, () => {
                    console.log('File saved:', filePath);
                });
            }

            if (recipient && (text || file)) {
                const MessageDoc = await MessageModel.create({
                    sender: id,
                    recipient,
                    text,
                    file: file ? fileName : null
                });
                console.log(socket.client, id);

                // i send by userId that i get from websocket but i dont know how to do it in socket.io because they have other id
                socket.emit('message', {
                    text,
                    sender: id,
                    recipient: MessageDoc?.recipient,
                    file: file ? fileName : null,
                    _id: MessageDoc._id,
                });
            }
        });

        socket.on('disconnect', () => {
            notifyAboutOnlinePeople();
        });
    });
}

module.exports = setupSocketIoServer;
