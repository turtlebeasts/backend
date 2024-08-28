const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { channel_messages, send_message } = require('../controllers/messageController');
const messageRoutes = express.Router()

messageRoutes.get('/channels/:channelId/', verifyToken, channel_messages);
messageRoutes.post('/channels/:channelId/', verifyToken, send_message);

module.exports = messageRoutes