import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../services/api";
import { Link, useSearchParams } from "react-router-dom";
import {
    FaUserGraduate,
    FaUserShield,
    FaFingerprint,
    FaEnvelope,
    FaLock,
    FaDoorOpen,
    FaBuilding,
    FaUserPlus,
    FaHourglassHalf,
    FaCheckCircle
} from "react-icons/fa";

function Login() {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [loginRole, setLoginRole] = useState("student");
    const [error, setError] = useState("");
    const registrationStatus = searchParams.get("registration");
    const verificationStatus = searchParams.get("verification");
    const [pendingEmail, setPendingEmail] = useState(() => localStorage.getItem("pendingVerificationEmail") || "");
    const [pendingDevLink, setPendingDevLink] = useState(() => localStorage.getItem("pendingVerificationDevLink") || "");
    const [needsVerification, setNeedsVerification] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const resendVerification = async (targetEmail) => {
        if (!targetEmail) return;
        setResending(true);
        setResendMessage("");
        try {
            const res = await axios.post(`${API_BASE}/api/auth/resend-verification`, {
                email: targetEmail
            });
            if (res.data.dev_link) {
                setPendingDevLink(res.data.dev_link);
                localStorage.setItem("pendingVerificationDevLink", res.data.dev_link);
            }
            setResendMessage(
                res.data.message || "If that account needs verification, a new link has been sent."
            );
        } catch (err) {
            setResendMessage(
                err.response?.data?.message || "Could not resend verification email."
            );
        } finally {
            setResending(false);
        }
    };

    const loginUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setNeedsVerification(false);

        try {
            const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            localStorage.removeItem("pendingVerificationEmail");
            localStorage.removeItem("pendingVerificationDevLink");

            const user = res.data.user;

            if (user.role === "superadmin") {
                window.location.href = "/dashboard";
                return;
            }

            if (user.role === "student") {
                window.location.href = "/student-dashboard";
                return;
            }

            if (user.role === "staff") {
                window.location.href = "/dashboard";
            }
        } catch (error) {
            const data = error.response?.data;
            setError(
                data?.message || "Login Failed. Please check your credentials."
            );
            if (data?.requires_verification) {
                setPendingEmail(email);
                setNeedsVerification(true);
                localStorage.setItem("pendingVerificationEmail", email);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="d-flex align-items-center justify-content-center p-3 p-sm-4"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #081028 0%, #1a1a4e 50%, #0d6efd 100%)",
                position: "relative",
                overflow: "hidden"
            }}
        >
            <div className="row g-0 shadow-lg login-container" style={{ maxWidth: "900px", width: "100%", borderRadius: "20px", overflow: "hidden", position: "relative", zIndex: 1, margin: "0 auto" }}>
                <div
                    className="col-md-5 d-none d-md-flex flex-column align-items-center justify-content-center p-4 p-xl-5 text-white"
                    style={{
                        background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)"
                    }}
                >
                    <FaBuilding size={54} className="mb-3" />
                    <h2 className="fw-bold text-center fs-3">DormHub System</h2>
                    <p className="text-center text-white-50 mb-4 small">
                        Attendance & Biometrics Management
                    </p>
                    <div className="mt-2 text-center">
                        <FaFingerprint size={36} className="mb-2 opacity-75" />
                        <p className="small text-white-50 mb-0">
                            Secure • Biometric • IoT-Enabled
                        </p>
                    </div>
                </div>

                <div className="col-md-7 bg-white p-4 p-sm-5">
                    <div className="text-center mb-3 d-md-none">
                        <FaBuilding size={36} className="text-primary mb-2" />
                        <h4 className="fw-bold">DormHub System</h4>
                        <p className="text-muted small">Attendance & Biometrics Management</p>
                    </div>

                    {registrationStatus === "pending" && (
                        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small">
                            <FaHourglassHalf className="flex-shrink-0" />
                            <div>Your registration is complete! Please wait for the landlady to approve your account before signing in.</div>
                        </div>
                    )}

                    {registrationStatus === "approved" && (
                        <div className="alert alert-success d-flex align-items-center gap-2 py-2 small">
                            <FaCheckCircle className="flex-shrink-0" />
                            <div>Your registration has been approved! You can now sign in.</div>
                        </div>
                    )}

                    {verificationStatus === "verified" && (
                        <div className="alert alert-success d-flex align-items-center gap-2 py-2 small">
                            <FaCheckCircle className="flex-shrink-0" />
                            <div>Your email has been verified. You can now sign in.</div>
                        </div>
                    )}

                    {pendingEmail && needsVerification && (
                        <div className="alert alert-warning py-2 small">
                            <div className="d-flex align-items-start gap-2">
                                <FaEnvelope className="flex-shrink-0 mt-1" />
                                <div>
                                    Your email <b>{pendingEmail}</b> has not been verified yet.
                                    <div className="mt-2 d-flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => resendVerification(pendingEmail)}
                                            disabled={resending}
                                        >
                                            {resending ? "Sending…" : "Resend verification email"}
                                        </button>
                                        {pendingDevLink && (
                                            <a
                                                href={pendingDevLink}
                                                className="btn btn-warning btn-sm"
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open verification link
                                            </a>
                                        )}
                                    </div>
                                    {resendMessage && (
                                        <div className="text-muted mt-2">{resendMessage}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <h4 className="fw-bold mb-1 fs-5">Welcome Back</h4>
                    <p className="text-muted mb-3 small">Sign in to continue to your account</p>

                    <div className="d-flex mb-3 bg-light rounded-3 p-1" style={{ cursor: "pointer" }}>
                        <div
                            className={`flex-fill text-center py-2 rounded-3 small ${loginRole === "student" ? "bg-white shadow-sm text-primary fw-bold" : "text-muted"}`}
                            onClick={() => { setLoginRole("student"); setError(""); }}
                        >
                            <FaUserGraduate className="me-1" /> Student
                        </div>
                        <div
                            className={`flex-fill text-center py-2 rounded-3 small ${loginRole === "admin" ? "bg-white shadow-sm text-primary fw-bold" : "text-muted"}`}
                            onClick={() => { setLoginRole("admin"); setError(""); }}
                        >
                            <FaUserShield className="me-1" /> Admin
                        </div>
                    </div>

                    <form onSubmit={loginUser}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold small">
                                <FaEnvelope className="me-1 text-muted" /> Email Address
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder={loginRole === "student" ? "Enter your student email" : "Enter admin email"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold small">
                                <FaLock className="me-1 text-muted" /> Password
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="alert alert-danger py-2 small">
                                <FaDoorOpen className="me-1" /> {error}
                            </div>
                        )}

                        <button
                            className="btn btn-primary w-100 py-2 fw-bold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <FaFingerprint className="me-2" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {loginRole === "student" && (
                        <div className="text-center mt-3 pt-3 border-top">
                            <p className="text-muted mb-2 small">Don't have an account yet?</p>
                            <Link
                                to="/student-registration"
                                className="btn btn-outline-primary px-3 py-2 btn-sm w-100 w-sm-auto"
                            >
                                <FaUserPlus className="me-2" />
                                Register as Student
                            </Link>
                        </div>
                    )}

                    <p className="text-center text-muted small mt-3 mb-0">
                        {loginRole === "student"
                            ? "Use your registered student email to sign in"
                            : "Administrator access only"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
