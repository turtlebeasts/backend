const db = require('../config/database')
const socketManager = require('../middleware/socketIo')

const save_session = async (req, res) => {
    const { code, name } = req.body;
    const channel_id = req.params.channelId;

    if (!channel_id || !code || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'INSERT INTO jamboard_sessions (channel_id, code, name) VALUES (?, ?, ?)';
    const values = [channel_id, code, name];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error saving session:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Session saved successfully!' });
    });
};

const load_session = async (req, res) => {
    const channel_id = req.params.channelId;

    if(!channel_id) return res.status(400).json({ error: 'Missing required fields' });

    const query = "SELECT * FROM jamboard_sessions WHERE channel_id=?";
    db.query(query, [channel_id], (error, results) => {
        if(error) {
            console.log('Error loading jamboard sessions!')
            return res.status(500).json({ error: 'Internal server error'});
        }
        res.status(200).json({ data: results })
    })
}

module.exports = {
    save_session,
    load_session
}