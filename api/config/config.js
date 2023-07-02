const bcrypt = require("bcrypt");
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const mongoUrl = process.env.MONGO_URL;
const clientUrl = process.env.CLIENT_URL;
const bcryptSalt = bcrypt.genSaltSync(10);

module.exports = {jwtSecret, mongoUrl, clientUrl, bcryptSalt};
