const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const {
            student_id,
            fullname,
            email,
            password,
            role
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (student_id, fullname, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [student_id, fullname, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    return res.status(500).json(err);
                }

                res.status(201).json({
                    message: "User Registered Successfully",
                    id: result.insertId
                });
            }
        );
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        if (user.registration_status === "pending") {
            return res.status(403).json({
                message: "Your registration is pending approval from the landlady. Please wait for confirmation."
            });
        }

        if (user.registration_status === "rejected") {
            return res.status(403).json({
                message: "Your registration was rejected. Please contact the landlady for more information."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                fingerprint_registered: user.fingerprint_registered === 1 || user.fingerprint_registered === true,
                registration_status: user.registration_status || null
            }
        });
    });
};
