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
const cookieParser = require('cookie-parser');
const bcryptSalt = bcrypt.genSaltSync(10);
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));
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

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptSalt);
        const createdUser =
            await UserModel.create({
                username,
                password: hashedPassword
            });
        console.log(createdUser);
        jwt.sign({userId: createdUser._id, username, password: createdUser.password}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: "none", secure: true}).status(201).json({
                id: createdUser._id
            });
        })
    } catch (e) {
        if (e) throw e
    }
});

const server = app.listen(4040)
const wss = new ws.WebSocketServer({server});

wss.on('connection', (connection, req) => {
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
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify(
            {
                online: [...wss.clients].map(c => ({userId: c.userId, username: c.username}))

            }
        ))
    });
});
