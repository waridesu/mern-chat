const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ws = require('ws');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const UserModel = require('./models/User');
const MessageModel = require('./models/Message');
const cookieParser = require('cookie-parser');
const bcryptSalt = bcrypt.genSaltSync(10);
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromToken(req) {
    return new Promise((resolve, reject) => {
        const {token} = req.cookies;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, payload) => {
                if (err) {
                    throw err
                }
                resolve(payload);
            });
        } else {
            reject('No token');
        }
    })

}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.get('/profile', async (req, res) => {
    const {token} = req.cookies;
    if (!token) {
        return res.status(420).json({message: 'NO TOKEN'});
    }
    jwt.verify(token, jwtSecret, {}, async (err, payload) => {
        if (err) {
            throw err
        }
        res.json(payload);
    })
});
app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const foundUser = await UserModel.findOne({username});

    if (!foundUser) {
        return res.status(401).json({message: 'Invalid username or password'});
    }

    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (!passOk) {
        return res.status(401).json({message: 'Invalid username or password'});
    }

    jwt.sign({userId: foundUser._id, username}, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {sameSite: 'none', secure: true}).status(201).json({
            id: foundUser._id
        });
    });
});
app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite: 'none', secure: true, maxAge: 0}).status(200).json({message: 'ok'});
})
app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptSalt);
        const createdUser =
            await UserModel.create({
                username,
                password: hashedPassword
            });
        jwt.sign({userId: createdUser._id, username, password: createdUser.password}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: "none", secure: true}).status(201).json({
                id: createdUser._id
            });
        })
    } catch (e) {
        if (e.code === 11000)
            return res.status(400).json({message: 'Username already exists'});
        throw e;
    }
});

const server = app.listen(4040)
const wss = new ws.WebSocketServer({server});

app.get('/messages/:userId', async (req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromToken(req);
    const ourUserId = userData.userId;
    const msg = await MessageModel.find({
        sender: {$in: [userId, ourUserId]},
        recipient: {$in: [userId, ourUserId]}
    }).sort({createdAt: 1})
    res.json(msg);
});
app.get('/people', async (req, res) => {
    const users = await UserModel.find({}, {'_id': true, 'username': true})
    res.json(users);
});
wss.on('connection', (connection, req) => {

    function notifyAboutOnlinePeople() {
        // notify all clients that a new user has connected
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify(
                {
                    online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))

                }
            ))
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();

        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer)
            connection.terminate()
            notifyAboutOnlinePeople();
            console.log('dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    // read user name and id from the token
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token=')).split('=')[1];
        if (tokenCookieString) {
            jwt.verify(tokenCookieString, jwtSecret, {}, (err, payload) => {
                if (err) {
                    throw err
                }
                const {userId, username} = payload
                connection.userId = userId;
                connection.username = username;
            });
        }
    }
    // notify all clients that a new user has connected
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify(
            {
                online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))

            }
        ))
    });

    notifyAboutOnlinePeople();

    connection.on('message', async (message) => {
        const msgData = JSON.parse(message.toString());
        const {recipient, text, file} = msgData.message;
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
                sender: connection.userId,
                recipient,
                text,
                file: file ? fileName : null
            });

            [...wss.clients]
                .filter(client => client.userId === recipient)
                .forEach(client => {
                    client.send(JSON.stringify({
                        text,
                        sender: connection.userId,
                        recipient: MessageDoc.recipient,
                        file: file ? fileName : null,
                        _id: MessageDoc._id,
                    }))
                })
        }
    });
});
