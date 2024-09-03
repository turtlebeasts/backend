const db = require('../config/database');
const socketManager = require('../middleware/socketIo');

const channel_messages = async (req, res) => {
    const channelId = req.params.channelId;
    const query = 'SELECT m.id, m.content, u.email FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ? ORDER BY m.created_at';

    try {
        const [results] = await db.query(query, [channelId]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Error fetching messages.');
    }
};

const send_message = async (req, res) => {
    const io = socketManager.getIO();
    const channelId = req.params.channelId;
    const { content } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail;

    if (!content || !content.message) return res.status(400).send('Message content is required.');

    const query = 'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)';

    try {
        const [result] = await db.query(query, [channelId, userId, content.message]);

        const message = {
            id: result.insertId,
            channel_id: channelId,
            user_id: userId,
            content: content.message,
            email: userEmail,
        };

        io.emit('newMessage', message);
        res.status(200).send(message);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).send('Error saving message.');
    }
};

module.exports = {
    channel_messages,
    send_message
};
