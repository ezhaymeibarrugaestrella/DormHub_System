const jwt = require("jsonwebtoken");

const REGISTRATION_SCOPED_PATHS = [
    /^\/api\/face-auth\/register$/,
    /^\/api\/webauthn\/register\/begin$/,
    /^\/api\/webauthn\/register\/complete$/
];

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

        if (verified.scope === "registration") {
            const path = (req.originalUrl || "").split("?")[0];
            const allowed = REGISTRATION_SCOPED_PATHS.some((pattern) => pattern.test(path));

            if (!allowed) {
                return res.status(401).json({
                    message: "Registration session is limited to biometric enrollment. Please sign in to continue."
                });
            }
        }

        req.user = verified;

        next();

    } catch (error) {

        res.status(401).json({
            message: "Invalid Token"
        });

    }
};
