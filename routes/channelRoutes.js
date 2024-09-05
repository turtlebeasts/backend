const express = require('express');
const { add_channel, get_channel_list, delete_channel, rename_channel, channel_members, search_channels, join_channel } = require('../controllers/channelController');
const verifyToken = require('../middleware/verifyToken');
const channelRoutes = express.Router()



channelRoutes.post('/add-channel', verifyToken, add_channel);
channelRoutes.get('/channels', verifyToken, get_channel_list);
channelRoutes.get('/members/:channelId', verifyToken, channel_members);
channelRoutes.delete('/delete-channel/:channelId', verifyToken, delete_channel);
channelRoutes.put('/rename-channel/:channelId', verifyToken, rename_channel);
channelRoutes.post('/search', verifyToken, search_channels);
channelRoutes.post('/join', verifyToken, join_channel);

module.exports = channelRoutes