const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { jwtSecret, bcryptSalt} = require("../config/config");
const {getUsernamePassword} = require("../utils/utils");

async function loginUser(req, res) {
    const {username, password} = getUsernamePassword(req);
    const foundUser = await UserModel.findOne({username});
    console.log(foundUser);

    if (!foundUser) {
        return res.status(401).json({message: 'Invalid username or password'});
    }

    const passOk = bcrypt.compareSync(password, foundUser?.password);
    if (!passOk) {
        return res.status(401).json({message: 'Invalid username or password'});
    }

    jwt.sign({userId: foundUser?._id, username}, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, {sameSite: 'none', secure: true}).status(201).json({
            id: foundUser?._id
        });
    });
}

function logoutUser(req, res) {
    res.cookie('token', '', {sameSite: 'none', secure: true, maxAge: 0}).status(200).json({message: 'ok'});
}

async function registerUser(req, res) {
    const {username, password} = getUsernamePassword(req);
    try {
        const hashedPassword = await bcrypt.hashSync(password, bcryptSalt);
        const createdUser =
            await UserModel.create({
                username,
                password: hashedPassword
            });
        jwt.sign({userId: createdUser?._id, username, password: createdUser?.password}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: "none", secure: true}).status(201).json({
                id: createdUser?._id
            });
        })
    } catch (e) {
        if (e.code === 11000)
            return res.status(400).json({message: 'Username already exists'});
        throw e;
    }
}

module.exports = { loginUser, logoutUser, registerUser };
