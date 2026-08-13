require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const SUPER_ADMIN_EMAIL = "superadmin@dormhub.com";
const SUPER_ADMIN_PASSWORD = "admin123";

async function ensureSuperAdmin() {
    const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (existing) {
        return { created: false, message: "Super Admin already exists" };
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    await User.create({
        student_id: "SUPER-ADMIN-001",
        fullname: "DormHub Super Admin",
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: "superadmin",
        status: "active"
    });

    return { created: true, message: "Super Admin Created Successfully" };
}

async function createSuperAdmin() {
    await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dormhub_db"
    );

    const result = await ensureSuperAdmin();
    console.log(result.message);
    process.exit(0);
}

if (require.main === module) {
    createSuperAdmin().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { ensureSuperAdmin };
