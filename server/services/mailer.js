const EMAIL_MODE = (process.env.EMAIL_MODE || "dev").toLowerCase();

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

    if (EMAIL_MODE === "dev") {
        console.log("------------------------------------------------------------");
        console.log("[MAILER:dev] Email verification message");
        console.log(`[MAILER:dev] To: ${to}${fullname ? ` (${fullname})` : ""}`);
        console.log(`[MAILER:dev] Verification link: ${link}`);
        console.log("------------------------------------------------------------");
        return { mode: "dev", link };
    }

    throw new Error(
        `Email delivery is not configured (EMAIL_MODE=${EMAIL_MODE}). Configure an SMTP provider before using this mode.`
    );
}

module.exports = { EMAIL_MODE, buildVerificationLink, sendVerificationEmail };
