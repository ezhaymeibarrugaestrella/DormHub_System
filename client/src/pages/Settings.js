import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaCog,
    FaUser,
    FaEnvelope,
    FaGraduationCap,
    FaLock,
    FaSave,
    FaServer,
    FaDatabase,
    FaFingerprint,
    FaDoorOpen,
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaEye,
    FaEyeSlash
} from "react-icons/fa";

function Settings() {
    const [, setProfile] = useState(null);
    const [systemInfo, setSystemInfo] = useState(null);
    const [form, setForm] = useState({ fullname: "", email: "", program: "", year_section: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState("profile");

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "superadmin" || user.role === "staff";

    useEffect(() => {
        fetchProfile();
        if (isAdmin) fetchSystemInfo();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get("/settings/profile");
            setProfile(res.data);
            setForm({
                fullname: res.data.fullname || "",
                email: res.data.email || "",
                program: res.data.program || "",
                year_section: res.data.year_section || ""
            });
        } catch (err) { console.log(err); }
    };

    const fetchSystemInfo = async () => {
        try {
            const res = await API.get("/settings/system");
            setSystemInfo(res.data);
        } catch (err) { console.log(err); }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.put("/settings/profile", form);
            const updated = { ...user, fullname: form.fullname, email: form.email };
            localStorage.setItem("user", JSON.stringify(updated));
            showMessage("success", "Profile updated successfully");
        } catch (err) {
            showMessage("danger", err.response?.data?.message || "Failed to update");
        } finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showMessage("danger", "Passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            showMessage("danger", "Password must be at least 6 characters");
            return;
        }
        setChangingPw(true);
        try {
            await API.put("/settings/change-password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            showMessage("success", "Password changed successfully");
        } catch (err) {
            showMessage("danger", err.response?.data?.message || "Failed to change password");
        } finally { setChangingPw(false); }
    };

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                        <FaCog size={24} className="text-primary" />
                    </div>
                    <div>
                        <h4 className="fw-bold mb-1">Settings</h4>
                        <p className="text-muted mb-0">Manage your account and system settings</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible py-2`}>
                        {message.type === "success" ? <FaCheckCircle className="me-1" /> : <FaExclamationTriangle className="me-1" />}
                        {message.text}
                        <button type="button" className="btn-close py-2" onClick={() => setMessage({ type: "", text: "" })} />
                    </div>
                )}

                <div className="row g-4">
                    <div className="col-lg-3">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-3">
                                <div className="nav flex-column nav-pills gap-1">
                                    {[
                                        { key: "profile", label: "My Profile", icon: FaUser },
                                        { key: "security", label: "Security", icon: FaLock },
                                        ...(isAdmin ? [{ key: "system", label: "System Info", icon: FaServer }] : [])
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button key={key}
                                            className={`nav-link text-start ${activeTab === key ? "active" : "text-dark"}`}
                                            onClick={() => setActiveTab(key)}>
                                            <Icon className="me-2" /> {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-9">
                        {activeTab === "profile" && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-3 p-md-4">
                                    <h6 className="fw-bold mb-3"><FaUser className="me-2" />My Profile</h6>
                                    <form onSubmit={handleSaveProfile}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold"><FaUser className="me-1 text-muted" /> Full Name</label>
                                                <input type="text" className="form-control" value={form.fullname}
                                                    onChange={(e) => setForm({ ...form, fullname: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold"><FaEnvelope className="me-1 text-muted" /> Email</label>
                                                <input type="email" className="form-control" value={form.email}
                                                    onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold"><FaGraduationCap className="me-1 text-muted" /> Program</label>
                                                <input type="text" className="form-control" value={form.program}
                                                    onChange={(e) => setForm({ ...form, program: e.target.value })} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold">Year/Section</label>
                                                <input type="text" className="form-control" value={form.year_section}
                                                    onChange={(e) => setForm({ ...form, year_section: e.target.value })} />
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                                            {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <FaSave className="me-1" />}
                                            Save Changes
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-3 p-md-4">
                                    <h6 className="fw-bold mb-3"><FaLock className="me-2" />Change Password</h6>
                                    <form onSubmit={handleChangePassword} style={{ maxWidth: "450px" }}>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Current Password</label>
                                            <div className="input-group">
                                                <span className="input-group-text"><FaLock /></span>
                                                <input type={showPw ? "text" : "password"} className="form-control"
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                    required />
                                                <button type="button" className="btn btn-outline-secondary"
                                                    onClick={() => setShowPw(!showPw)}>
                                                    {showPw ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">New Password</label>
                                            <input type="password" className="form-control" minLength={6}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Confirm New Password</label>
                                            <input type="password" className="form-control" minLength={6}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                required />
                                        </div>
                                        <button type="submit" className="btn btn-primary" disabled={changingPw}>
                                            {changingPw ? <span className="spinner-border spinner-border-sm me-1" /> : <FaLock className="me-1" />}
                                            Change Password
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === "system" && isAdmin && (
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-3 p-md-4">
                                    <h6 className="fw-bold mb-3"><FaServer className="me-2" />System Information</h6>
                                    {systemInfo ? (
                                        <div className="row g-3">
                                            <div className="col-sm-6">
                                                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                                                    <FaDatabase size={24} className="text-primary" />
                                                    <div>
                                                        <small className="text-muted d-block">Total Users</small>
                                                        <span className="fw-bold fs-5">{systemInfo.totalUsers}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                                                    <FaDoorOpen size={24} className="text-warning" />
                                                    <div>
                                                        <small className="text-muted d-block">Gate Requests</small>
                                                        <span className="fw-bold fs-5">{systemInfo.totalGateRequests}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                                                    <FaFingerprint size={24} className="text-success" />
                                                    <div>
                                                        <small className="text-muted d-block">Biometric Registrations</small>
                                                        <span className="fw-bold fs-5">{systemInfo.totalBiometricRegistrations}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3">
                                                    <FaInfoCircle size={24} className="text-info" />
                                                    <div>
                                                        <small className="text-muted d-block">Server Time</small>
                                                        <span className="fw-bold fs-5">{new Date(systemInfo.serverTime).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <FaServer size={32} className="mb-2" />
                                            <p>Loading system info...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Settings;
