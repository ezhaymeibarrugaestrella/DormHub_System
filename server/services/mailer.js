const nodemailer = require("nodemailer");

const EMAIL_MODE = (process.env.EMAIL_MODE || (process.env.NODE_ENV === "production" ? "smtp" : "dev")).toLowerCase();

function buildVerificationLink(token) {
    const base =
        process.env.CLIENT_URL ||
        (process.env.NODE_ENV !== "production"
            ? "http://localhost:3000"
            : process.env.RP_ORIGIN);
    return `${base.replace(/\/+$/, "")}/verify-email?token=${token}`;
}

async function sendVerificationEmail({ to, fullname, token }) {
    const link = buildVerificationLink(token);

    if (EMAIL_MODE === "dev" && process.env.NODE_ENV !== "production") {
        console.log("------------------------------------------------------------");
        console.log("[MAILER:dev] Email verification message");
        console.log(`[MAILER:dev] To: ${to}${fullname ? ` (${fullname})` : ""}`);
        console.log(`[MAILER:dev] Verification link: ${link}`);
        console.log("------------------------------------------------------------");
        return { mode: "dev", link };
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM) {
        const error = new Error("SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM are required for verification email delivery");
        error.code = "EMAIL_DELIVERY_NOT_CONFIGURED";
        throw error;
    }

    const port = Number(SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
    });
    await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject: "Verify your DormHub email address",
        text: `Hello ${fullname || ""},\n\nVerify your email address using this link:\n${link}\n\nThis link expires in 24 hours.`,
        html: `<p>Hello ${fullname || ""},</p><p>Verify your email address:</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`
    });
    return { mode: "smtp" };
}

module.exports = { EMAIL_MODE, buildVerificationLink, sendVerificationEmail };
