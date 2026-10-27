const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

        const user = await User.create({ student_id, fullname, email, password: hashedPassword, role });
        res.status(201).json({ message: "User Registered Successfully", id: user.id });
    } catch (error) {
        res.status(error.code === 11000 ? 409 : 500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid password" });

        if (user.registration_status === "pending") {
            return res.status(403).json({ message: "Your registration is pending approval from the landlady. Please wait for confirmation." });
        }
        if (user.registration_status === "rejected") {
            return res.status(403).json({ message: "Your registration was rejected. Please contact the landlady for more information." });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                fingerprint_registered: Boolean(user.fingerprint_registered),
                registration_status: user.registration_status || null
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
