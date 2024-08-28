const mysql = require('mysql2')
require('dotenv').config()

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

db.connect((err) => {
    if (err) {
        console.log(err.message)
        console.log("host:", process.env.HOST,
            "\nuser:", process.env.DBUSER,
            "\npassword:", process.env.PASSWORD,
            "\ndatabase:", process.env.DATABASE)
    } else {
        console.log('Database connected!');
    }
});

module.exports = db