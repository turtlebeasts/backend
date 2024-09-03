const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { save_session, load_session } = require('../controllers/jamboardController')
const jamboardRoutes = express.Router();

jamboardRoutes.post('/:channelId/save-jamboard', verifyToken, save_session);
jamboardRoutes.get('/:channelId/load-session', verifyToken, load_session);

module.exports = jamboardRoutes