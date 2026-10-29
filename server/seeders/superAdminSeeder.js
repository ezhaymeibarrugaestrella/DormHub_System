const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

async function createSuperAdmin() {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD to run this one-time seeder");
    }

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
        console.log("Super admin already exists");
        return;
    }

    await User.create({
        student_id: "SUPER-ADMIN-001",
        fullname: "DormHub Super Admin",
        email,
        password: await bcrypt.hash(password, 10),
        role: "superadmin",
        status: "active"
    });
    console.log("Super admin created");
}

createSuperAdmin()
    .catch((error) => {
        console.error("Super admin seeding failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState) await mongoose.disconnect();
    });