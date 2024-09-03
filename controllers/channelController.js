const db = require('../config/database');
const socketManager = require('../middleware/socketIo');

const add_channel = async (req, res) => {
    const io = socketManager.getIO();
    const { name } = req.body;
    const userId = req.userId; // ID of the user creating the channel

    if (!name) return res.status(400).send('Channel name is required.');

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query('INSERT INTO channels (name) VALUES (?)', [name]);
        const channelId = result.insertId;

        await connection.query('INSERT INTO channel_users (channel_id, user_id) VALUES (?, ?)', [channelId, userId]);

        await connection.commit();
        res.status(200).send({ channelId });
        io.emit('channel_created');
    } catch (err) {
        await connection.rollback();
        console.error('Error in add_channel:', err);
        res.status(500).send('Error creating channel.');
    } finally {
        connection.release();
    }
}

const get_channel_list = async (req, res) => {
    const userId = req.userId;
    const query = 'SELECT * FROM channel_users INNER JOIN channels ON channel_users.channel_id = channels.id WHERE channel_users.user_id = ?';

    try {
        const [results] = await db.query(query, [userId]);
        res.json(results);
    } catch (err) {
        console.error('Error in get_channel_list:', err);
        res.status(500).send('Error fetching channels.');
    }
};

const delete_channel = async (req, res) => {
    const io = socketManager.getIO();
    const channelId = req.params.channelId;
    if (!channelId) return res.status(400).send('Channel ID is required.');

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM channel_users WHERE channel_id = ?', [channelId]);
        await connection.query('DELETE FROM channels WHERE id = ?', [channelId]);

        await connection.commit();
        res.status(200).send('Channel deleted successfully.');
        io.emit('channel_delete');
    } catch (err) {
        await connection.rollback();
        console.error('Error in delete_channel:', err);
        res.status(500).send('Error deleting channel.');
    } finally {
        connection.release();
    }
}

const rename_channel = async (req, res) => {
    const io = socketManager.getIO();
    const channelId = req.params.channelId;
    const { newName } = req.body;

    if (!newName) return res.status(400).send('New channel name is required.');

    try {
        const [result] = await db.query('UPDATE channels SET name = ? WHERE id = ?', [newName, channelId]);

        if (result.affectedRows === 0) {
            return res.status(404).send('Channel not found.');
        }

        res.status(200).send('Channel renamed successfully.');
        io.emit('channel_rename', { id: channelId, channel_name: newName });
    } catch (err) {
        console.error('Error in rename_channel:', err);
        res.status(500).send('Error renaming channel.');
    }
}

const channel_members = async (req, res) => {
    const channelId = req.params.channelId;
    const formattedQuery = "SELECT * FROM channel_users INNER JOIN users ON channel_users.user_id=users.id WHERE channel_users.channel_id=?";

    try {
        const [result] = await db.query(formattedQuery, [channelId]);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in channel_members:', err);
        res.status(500).send('Error fetching users');
    }
}

module.exports = {
    add_channel,
    get_channel_list,
    delete_channel,
    rename_channel,
    channel_members
}
