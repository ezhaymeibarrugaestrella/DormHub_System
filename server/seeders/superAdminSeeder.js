const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createSuperAdmin() {

    const hashedPassword =
        await bcrypt.hash("admin123", 10);

    const sql = `
        INSERT INTO users
        (
            student_id,
            fullname,
            email,
            password,
            role,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            "SUPER-ADMIN-001",
            "DormHub Super Admin",
            "superadmin@dormhub.com",
            hashedPassword,
            "superadmin",
            "active"
        ],
        (err, result) => {

            if (err) {
                console.log(err);
            } else {
                console.log(
                    "Super Admin Created Successfully"
                );
            }

            process.exit();
        }
    );
}

createSuperAdmin();