const db = require("../config/db");

function createTables() {
    const webauthnCredentials = `
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            credential_id TEXT NOT NULL,
            public_key TEXT,
            counter INT DEFAULT 0,
            transports TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    const gateRequests = `
        CREATE TABLE IF NOT EXISTS gate_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            request_type ENUM('in', 'out') NOT NULL,
            location_lat DECIMAL(10, 8),
            location_lng DECIMAL(11, 8),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT,
            remarks TEXT,
            fingerprint_verified TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `;

    const attendanceLogs = `
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            time_in TIME,
            time_out TIME,
            status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
            remarks TEXT,
            marked_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
        )
    `;

    const faceDescriptors = `
        CREATE TABLE IF NOT EXISTS face_descriptors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            descriptor TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(faceDescriptors, (err) => {
        if (err) console.error("Error creating face_descriptors table:", err);
        else console.log("✓ face_descriptors table ready");
    });

    const alterUsers = `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS room_number VARCHAR(20) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS parent_contact VARCHAR(100) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS parent_address TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS registration_remarks TEXT DEFAULT NULL
    `;

    db.query(webauthnCredentials, (err) => {
        if (err) console.error("Error creating webauthn_credentials table:", err);
        else console.log("✓ webauthn_credentials table ready");
    });

    db.query(gateRequests, (err) => {
        if (err) console.error("Error creating gate_requests table:", err);
        else console.log("✓ gate_requests table ready");
    });

    db.query(attendanceLogs, (err) => {
        if (err) console.error("Error creating attendance_logs table:", err);
        else console.log("✓ attendance_logs table ready");
    });

    db.query(alterUsers, (err) => {
        if (err) console.error("Error adding user columns:", err);
        else console.log("✓ users table columns ready");
    });

    const nightlyAttendance = `
        CREATE TABLE IF NOT EXISTS nightly_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            status ENUM('pending', 'checked_in') DEFAULT 'pending',
            checked_at TIMESTAMP NULL,
            location_lat DECIMAL(10, 8),
            location_lng DECIMAL(11, 8),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_nightly (user_id, date)
        )
    `;

    db.query(nightlyAttendance, (err) => {
        if (err) console.error("Error creating nightly_attendance table:", err);
        else console.log("✓ nightly_attendance table ready");
    });
}

module.exports = { createTables };
