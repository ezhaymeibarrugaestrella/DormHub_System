const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {

    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            message: "Access Denied"
        });
    }

    try {

        const verified = jwt.verify(
            token.split(" ")[1],
            process.env.JWT_SECRET
        );

        req.user = verified;

        next();

    } catch (error) {

        res.status(401).json({
            message: "Invalid Token"
        });

    }
};