require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

async function createSuperAdmin() {
    await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dormhub_db"
    );

    const existing = await User.findOne({ email: "superadmin@dormhub.com" });

    if (existing) {
        console.log("Super Admin already exists");
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
        student_id: "SUPER-ADMIN-001",
        fullname: "DormHub Super Admin",
        email: "superadmin@dormhub.com",
        password: hashedPassword,
        role: "superadmin",
        status: "active"
    });

    console.log("Super Admin Created Successfully");
    process.exit(0);
}

createSuperAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
