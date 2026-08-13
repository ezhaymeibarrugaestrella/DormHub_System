require("dotenv").config();

const mongoose = require("mongoose");

const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dormhub_db";

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Connected...");
    } catch (err) {
        console.log("Database Error:", err);
    }
}

module.exports = { connectDB, mongoose, MONGODB_URI };
