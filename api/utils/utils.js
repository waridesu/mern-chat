const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

async function getUserDataFromToken(req) {
    return new Promise((resolve, reject) => {
        const { token } = req.cookies;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, payload) => {
                if (err) {
                    throw err;
                }
                resolve(payload);
            });
        } else {
            reject('No token');
        }
    });
}
function getUsernamePassword(req) {
    const {username, password} = req.body;
    return {username, password};
}

module.exports = { getUserDataFromToken, getUsernamePassword };
