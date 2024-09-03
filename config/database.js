const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

(async () => {
    try {
        await promisePool.query('SELECT 1');
        console.log('Database connected!');
    } catch (err) {
        console.error('Database connection error:', err.message);
        console.log("host:", process.env.HOST,
            "\nuser:", process.env.DBUSER,
            "\npassword:", process.env.PASSWORD,
            "\ndatabase:", process.env.DATABASE);
    }
})();

module.exports = promisePool;
