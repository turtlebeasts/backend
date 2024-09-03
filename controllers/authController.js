const db = require('../config/database'); // This should now be `promisePool`
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register user function
const register_user = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Check if the user already exists
        const query = 'SELECT email FROM users WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length > 0) return res.status(400).send('User already exists.');

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await db.query('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [firstName, lastName, email, hashedPassword]);

        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error.');
    }
}

// Login function
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send('Email and password are required.');

    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length === 0) return res.status(401).send('Invalid email or password.');

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).send('Invalid email or password.');

        const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

        const [userResults] = await db.query('SELECT * FROM `users` WHERE `email`=?', [email]);

        res.json({ token, user: { id: userResults[0].id, email: userResults[0].email } });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).send('Internal server error.');
    }
}

// Check email function
const check_email = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('All fields are required.');
    }

    try {
        const query = 'SELECT email FROM users WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length > 0) return res.status(200).send({ code: 400, message: 'Email already taken!' });

        res.status(200).send({ code: 200, message: 'Email ok!' });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).send('Internal server error.');
    }
}

module.exports = { register_user, login, check_email };
