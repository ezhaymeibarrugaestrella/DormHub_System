require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

const { Server } = require("socket.io");

const { connectDB } = require("./config/db");
require("./models");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");
const gateRequestRoutes = require("./routes/gateRequestRoutes");
const studentRegistrationRoutes = require("./routes/studentRegistrationRoutes");
const demeritRoutes = require("./routes/demeritRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const faceAuthRoutes = require("./routes/faceAuthRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("DormHub API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webauthn", webauthnRoutes);
app.use("/api/gate-requests", gateRequestRoutes);
app.use("/api/student-registration", studentRegistrationRoutes);
app.use("/api/demerits", demeritRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/face-auth", faceAuthRoutes);
app.use("/api/users", userRoutes);

app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
        return next();
    }
    res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
        if (err) next();
    });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("User Connected");
    socket.on("disconnect", () => {
        console.log("User Disconnected");
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    const { ensureSuperAdmin } = require("./seeders/superAdminSeeder");
    try {
        const result = await ensureSuperAdmin();
        if (result.created) console.log("Super Admin seeded on startup");
    } catch (err) {
        console.log("Super Admin seeding skipped:", err.message);
    }
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
