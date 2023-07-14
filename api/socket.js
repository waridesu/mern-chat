const fs = require('fs');
const crypto = require('crypto');
const MessageModel = require('./models/Message');
const users = new Map();

function setupSocketIoServer(server) {
    const io = require('socket.io')(server, {cookie: true, cors: {origin: "*"}});

    io.use((socket, next) => {
        const id = socket.request._query.id
        if (id) {
            users.set(id, socket.id);
        }
        next();
    }).on('connection', (socket) => {
        socket.emit('online', [...users.keys()]);

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
                console.log(users)
                // i send by userId that i get from websocket but i dont know how to do it in socket.io because they have other id
                io.to(users.get(recipient)).emit('message', {
                    text,
                    sender: id,
                    recipient: MessageDoc?.recipient,
                    file: file ? fileName : null,
                    _id: MessageDoc._id,
                });
            }
        });

        socket.on('disconnect', () => {
        });
    });
}

module.exports = setupSocketIoServer;
