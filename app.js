const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

const expressServer = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})

// const server = http.createServer(app);
const io = new Server(expressServer, {
    cors: {
        origin: 'https://ilct.netlify.app', // React app domain
        methods: ['GET', 'POST']
    }
});


const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12725465',
    password: 'J1jSzhDpnh',
    database: 'sql12725465'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Database connected!');
});

app.use(cors()); // Enabling CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).send('No token provided.');

    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) return res.status(500).send('Failed to authenticate token.');
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    });
};

// Registration endpoint
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Check if the user already exists
        db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).send('Error checking user existence.');

            if (results.length > 0) return res.status(400).send('User already exists.');

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user into the database
            db.query('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [firstName, lastName, email, hashedPassword], (err) => {
                if (err) return res.status(500).send('Error registering user.');
                res.status(201).send('User registered successfully.');
            });
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error.');
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send('Email and password are required.');

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).send('Error querying user.');

        if (results.length === 0) return res.status(401).send('Invalid email or password.');

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).send('Error comparing passwords.');

            if (!isMatch) return res.status(401).send('Invalid email or password.');

            const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
            db.query('SELECT * FROM `users` WHERE `email`=?', [email], (err, results) => {
                res.json({ token, user: { id: results[0].id, email: results[0].email } });
                // console.log(results[0].id)
            })
        });
    });
});

// API endpoint to create a new channel
app.post('/add-channel', verifyToken, (req, res) => {
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
                });
            });
        });
    });
});

// API endpoint to fetch channels (for listing)
app.get('/channels', verifyToken, (req, res) => {
    const query = 'SELECT * FROM channels';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Error fetching channels.');
        res.json(results);
    });
});

// API endpoint to fetch messages for a channel
app.get('/channels/:channelId/messages', verifyToken, (req, res) => {
    const channelId = req.params.channelId;
    const query = 'SELECT m.id, m.content, u.email FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ? ORDER BY m.created_at';
    db.query(query, [channelId], (err, results) => {
        if (err) return res.status(500).send('Error fetching messages.');
        res.json(results);
    });
});

// API endpoint to add a message to a channel
app.post('/channels/:channelId/messages', verifyToken, (req, res) => {
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
});

// Socket.IO connection
io.on('connection', (socket) => {
    // console.log('a user connected');

    socket.on('joinChannel', (channelId) => {
        socket.join(channelId);
        // console.log(`User joined channel: ${channelId}`);
    });

    socket.on('leaveChannel', (channelId) => {
        socket.leave(channelId);
    });

});