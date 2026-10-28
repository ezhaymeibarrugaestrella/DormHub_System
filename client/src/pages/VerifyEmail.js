import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaEnvelope,
    FaArrowLeft
} from "react-icons/fa";
import API from "../services/api";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [state, setState] = useState({ status: "working", message: "" });
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        if (!token) {
            setState({
                status: "error",
                message: "Verification link is invalid or has expired."
            });
            return;
        }

        (async () => {
            try {
                const res = await API.post("/auth/verify-email", {
                    token
                });
                localStorage.removeItem("pendingVerificationEmail");
                localStorage.removeItem("pendingVerificationDevLink");
                setState({ status: "success", message: res.data.message });
            } catch (err) {
                setState({
                    status: "error",
                    message:
                        err.response?.data?.message ||
                        "Verification failed. Please try again."
                });
            }
        })();
    }, [token]);

    return (
        <div
            className="d-flex align-items-center justify-content-center p-3 p-sm-4"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #081028 0%, #1a1a4e 50%, #0d6efd 100%)"
            }}
        >
            <div
                className="card border-0 shadow-lg text-center"
                style={{ maxWidth: "460px", width: "100%", borderRadius: "20px" }}
            >
                <div className="card-body p-4 p-sm-5">
                    {state.status === "working" && (
                        <>
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: "80px", height: "80px" }}>
                                <FaEnvelope size={32} className="text-primary" />
                            </div>
                            <h5 className="fw-bold mb-2">Verifying your email…</h5>
                            <p className="text-muted small mb-0">
                                Please wait while we confirm your verification link.
                            </p>
                            <div className="spinner-border text-primary mt-3" role="status" />
                        </>
                    )}

                    {state.status === "success" && (
                        <>
                            <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: "80px", height: "80px" }}>
                                <FaCheckCircle size={40} className="text-success" />
                            </div>
                            <h5 className="fw-bold text-success mb-2">Email Verified</h5>
                            <p className="text-muted small mb-4">{state.message}</p>
                            <Link to="/?verification=verified" className="btn btn-primary px-4 fw-bold">
                                <FaArrowLeft className="me-2" /> Go to Sign In
                            </Link>
                        </>
                    )}

                    {state.status === "error" && (
                        <>
                            <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: "80px", height: "80px" }}>
                                <FaExclamationTriangle size={36} className="text-danger" />
                            </div>
                            <h5 className="fw-bold text-danger mb-2">Verification Failed</h5>
                            <p className="text-muted small mb-4">{state.message}</p>
                            <Link to="/" className="btn btn-outline-primary px-4 fw-bold">
                                <FaArrowLeft className="me-2" /> Back to Sign In
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
