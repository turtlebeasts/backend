const db = require('../config/database')
const socketManager = require('../middleware/socketIo')

const channel_messages = async (req, res) => {
    const channelId = req.params.channelId;
    const query = 'SELECT m.id, m.content, u.email FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ? ORDER BY m.created_at';
    db.query(query, [channelId], (err, results) => {
        if (err) return res.status(500).send('Error fetching messages.');
        res.json(results);
    });
}

const send_message = (req, res) => {
    const io = socketManager.getIO()
    const channelId = req.params.channelId;
    const { content } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail;
    if (!content.message) return res.status(400).send('Message content is required.');

    const query = 'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)';
    db.query(query, [channelId, userId, content.message], (err, result) => {
        if (err) return res.status(500).send('Error saving message.');

        const message = {
            id: result.insertId,
            channel_id: channelId,
            user_id: userId,
            content: content.message,
            email: userEmail,
        };

        io.emit('newMessage', message);
        res.status(200).send(message);
    });
}

module.exports = {
    channel_messages,
    send_message
}