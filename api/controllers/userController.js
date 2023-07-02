const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const { jwtSecret } = require('../config/config');

async function getProfile(req, res) {
    const {token} = req.cookies;
    if (!token) {
        return res.status(420).json({message: 'NO TOKEN'});
    }
    jwt.verify(token, jwtSecret, {}, async (err, payload) => {
        if (err) {
            throw err;
        }
        res.json(payload);
    });
}

async function getPeople(req, res) {
    const users = await UserModel.find({}, {'_id': true, 'username': true});
    res.json(users);
}

module.exports = { getProfile, getPeople };
