const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const messageController = require('../controllers/messageController');

const router = express.Router();

//Auth routes
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.post('/register', authController.registerUser);

// user routes
router.get('/profile', userController.getProfile);
router.get('/people', userController.getPeople);

// Message routes
router.get('/messages/:userId', messageController.getMessages);

module.exports = router;
