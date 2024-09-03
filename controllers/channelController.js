const db = require('../config/database')
const socketManager = require('../middleware/socketIo')

const add_channel = async (req, res) => {
    const io = socketManager.getIO()
    const { name } = req.body;
    const userId = req.userId; // ID of the user creating the channel

    if (!name) return res.status(400).send('Channel name is required.');

    db.beginTransaction((err) => {
        if (err) return res.status(500).send('Error starting transaction.');

        db.query('INSERT INTO channels (name) VALUES (?)', [name], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).send('Error creating channel.');
                });
            }

            const channelId = result.insertId;

            db.query('INSERT INTO channel_users (channel_id, user_id) VALUES (?, ?)', [channelId, userId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).send('Error adding user to channel.');
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).send('Error committing transaction.');
                        });
                    }
                    res.status(200).send({ channelId });
                    io.emit('channel_created')
                });
            });
        });
    });
}

const get_channel_list = async (req, res) => {
    const userId = req.userId;
    const query = 'SELECT * FROM channel_users INNER JOIN channels ON channel_users.channel_id = channels.id WHERE channel_users.user_id = ?';
    // const query = 'SELECT * FROM channels';
    
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).send('Error fetching channels.');
        res.json(results);
    });
};


const delete_channel = (req, res) => {
    const io = socketManager.getIO()
    const channelId = req.params.channelId;
    if (!channelId) return res.status(400).send('Channel ID is required.');

    db.beginTransaction((err) => {
        if (err) return res.status(500).send('Error starting transaction.');

        // First, delete the channel-users associations
        db.query('DELETE FROM channel_users WHERE channel_id = ?', [channelId], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).send('Error removing users from channel.');
                });
            }

            // Then, delete the channel itself
            db.query('DELETE FROM channels WHERE id = ?', [channelId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).send('Error deleting channel.');
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).send('Error committing transaction.');
                        });
                    }
                    res.status(200).send('Channel deleted successfully.');
                    io.emit('channel_delete')
                });
            });
        });
    });
}

const rename_channel = (req, res) => {
    const io = socketManager.getIO()
    const channelId = req.params.channelId;
    const { newName } = req.body;

    if (!newName) return res.status(400).send('New channel name is required.');

    db.query('UPDATE channels SET name = ? WHERE id = ?', [newName, channelId], (err, result) => {
        if (err) {
            return res.status(500).send('Error renaming channel.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Channel not found.');
        }

        res.status(200).send('Channel renamed successfully.');
        io.emit('channel_rename', { id: channelId, channel_name: newName })
    });
}

const channel_members = (req, res) => {
    const channelId = req.params.channelId;
    const formattedQuery = "SELECT * FROM channel_users INNER JOIN users ON channel_users.user_id=users.id WHERE channel_users.channel_id=?"
    db.query(formattedQuery, [channelId], (err, result) => {
        if (err) {
            return res.status(500).send('Error fetching users')
        }
        res.status(200).json(result)
    })
}

module.exports = {
    add_channel,
    get_channel_list,
    delete_channel,
    rename_channel,
    channel_members
}