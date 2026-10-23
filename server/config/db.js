require("dotenv").config();

const mysql = require("mysql2");

console.log("DB USER:", process.env.DB_USER);

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {

    if (err) {
        console.log("Database Error:", err);
    } else {
        console.log("MySQL Connected...");
    }

});

module.exports = db;