const db = require('../config/database')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const register_user = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Check if the user already exists
        const query = 'SELECT email FROM users WHERE email = ?';
        const formattedQuery = mysql.format(query, [email]);
        db.query(formattedQuery, async (err, results) => {

            if (err) console.log(err.message)
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
}

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send('Email and password are required.');

    const query = 'SELECT * FROM users WHERE email = ?';
    const formattedQuery = mysql.format(query, [email]);
    db.query(formattedQuery, (err, results) => {
        if (err) console.log(err.message)
        if (err) return res.status(500).send('Error querying user.');

        if (results.length === 0) return res.status(401).send('Invalid email or password.');

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).send('Error comparing passwords.');

            if (!isMatch) return res.status(401).send('Invalid email or password.');

            const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
            db.query('SELECT * FROM `users` WHERE `email`=?', [email], (err, results) => {
                res.json({ token, user: { id: results[0].id, email: results[0].email } });
            })
        });
    });
}

const check_email = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('All fields are required.');
    }

    try{
        const query = 'SELECT email FROM users WHERE email = ?';
        const formattedQuery = mysql.format(query, [email]);
        db.query(formattedQuery, async (err, results)=>{
            if (err) return res.status(500).send('Error querying the database!')
            if(results.length>0) return res.status(200).send({code: 400, message: 'Email already taken!'})
            res.status(200).send({code: 200, message:'Email ok!'})
        })
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error.');
    }
}

module.exports = { register_user, login, check_email }