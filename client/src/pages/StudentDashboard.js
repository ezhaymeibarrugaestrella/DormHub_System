import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaSignOutAlt,
    FaSignInAlt,
    FaMapMarkerAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaExclamationTriangle,
    FaShieldAlt,
    FaHistory,
    FaPaperPlane,
    FaUser,
    FaMapPin,
    FaExternalLinkAlt,
    FaUserCheck,
    FaCrosshairs,
    FaMapMarkedAlt,
    FaCamera,
    FaFingerprint,
    FaMoon
} from "react-icons/fa";
import FaceCamera from "../components/FaceCamera";
import {
    startRegistration,
    startAuthentication,
    browserSupportsWebAuthn
} from "@simplewebauthn/browser";

function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [faceRegistered, setFaceRegistered] = useState(false);
    const [fingerprintRegistered, setFingerprintRegistered] = useState(false);
    const [webauthnSupported, setWebauthnSupported] = useState(false);
    const [requests, setRequests] = useState([]);
    const [requestType, setRequestType] = useState("out");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [location, setLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showMap, setShowMap] = useState(null);
    const [showFaceModal, setShowFaceModal] = useState(null);
    const [bioMethod, setBioMethod] = useState(null); // 'face' or 'fingerprint' for gate pass
    const [nightlyCheckedIn, setNightlyCheckedIn] = useState(false);
    const [nightlyCheckedAt, setNightlyCheckedAt] = useState(null);
    const [nightlyLoading, setNightlyLoading] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        fetchStatus();
        fetchWebAuthnStatus();
        fetchRequests();
        checkWebAuthnSupport();
        fetchNightlyStatus();
    }, []);

    const checkWebAuthnSupport = async () => {
        try {
            const supported = await browserSupportsWebAuthn();
            setWebauthnSupported(supported);
        } catch {
            setWebauthnSupported(false);
        }
    };

    const fetchNightlyStatus = async () => {
        try {
            const res = await API.get("/attendance/nightly/status");
            setNightlyCheckedIn(res.data.checkedIn);
            setNightlyCheckedAt(res.data.checkedAt);
        } catch (err) {
            console.log(err);
        }
    };

    const handleNightlyCheckIn = async () => {
        setNightlyLoading(true);
        let lat = null, lng = null;

        try {
            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            }
        } catch { }

        try {
            await API.post("/attendance/nightly/checkin", { locationLat: lat, locationLng: lng });
            setNightlyCheckedIn(true);
            setNightlyCheckedAt(new Date().toISOString());
            showMessage("success", "Nightly check-in successful!");
        } catch (err) {
            showMessage("danger", err.response?.data?.message || "Check-in failed");
        } finally {
            setNightlyLoading(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await API.get("/face-auth/status");
            setFaceRegistered(res.data.registered);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchWebAuthnStatus = async () => {
        try {
            const res = await API.get("/webauthn/status");
            setFingerprintRegistered(res.data.registered);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await API.get("/gate-requests");
            setRequests(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleFaceRegister = async (descriptor) => {
        try {
            await API.post("/face-auth/register", { descriptor });
            setFaceRegistered(true);
            const updatedUser = { ...user, fingerprint_registered: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setShowFaceModal(null);
            showMessage("success", "Face registered successfully!");
        } catch (err) {
            showMessage("danger", err.response?.data?.message || err.message || "Registration failed");
        }
    };

    const handleFaceVerify = async (descriptor) => {
        try {
            const verifyRes = await API.post("/face-auth/verify", { descriptor });
            if (verifyRes.data.verified) {
                setShowFaceModal(null);
                await submitGateRequest();
            }
        } catch (err) {
            setShowFaceModal(null);
            showMessage("danger", err.response?.data?.message || "Face verification failed");
        }
    };

    const handleFingerprintRegister = async () => {
        try {
            const beginRes = await API.post("/webauthn/register/begin");
            const credential = await startRegistration(beginRes.data);
            await API.post("/webauthn/register/complete", { credential });
            setFingerprintRegistered(true);
            const updatedUser = { ...user, fingerprint_registered: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            showMessage("success", "Fingerprint registered successfully!");
        } catch (err) {
            showMessage("danger", err.response?.data?.message || err.message || "Fingerprint registration failed");
        }
    };

    const handleFingerprintVerify = async () => {
        try {
            const beginRes = await API.post("/webauthn/auth/begin");
            const assertion = await startAuthentication(beginRes.data);
            const verifyRes = await API.post("/webauthn/auth/complete", { assertion });
            if (verifyRes.data.verified) {
                await submitGateRequest();
            }
        } catch (err) {
            showMessage("danger", err.response?.data?.message || "Fingerprint verification failed");
        }
    };

    const captureLocation = () => {
        if (!navigator.geolocation) {
            showMessage("warning", "Geolocation is not supported on this device");
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationLoading(false);
                showMessage("success", "Location captured successfully");
            },
            () => {
                setLocationLoading(false);
                showMessage("danger", "Failed to get location. Please enable GPS and try again.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const submitGateRequest = async () => {
        if (!location) {
            showMessage("warning", "Please capture your location first");
            return;
        }

        setLoading(true);
        showMessage("", "");

        try {
            await API.post("/gate-requests", {
                requestType,
                locationLat: location.lat,
                locationLng: location.lng
            });

            showMessage("success", "Gate request submitted successfully! Waiting for approval.");
            fetchRequests();
            setRequestType("out");
            setLocation(null);
        } catch (err) {
            showMessage("danger", err.response?.data?.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = () => {
        if (!faceRegistered && !fingerprintRegistered) {
            showMessage("warning", "Please register a biometric (face or fingerprint) first");
            return;
        }
        if (!location) {
            showMessage("warning", "Please capture your location first");
            return;
        }
        if (faceRegistered && fingerprintRegistered) {
            setBioMethod(null); // Let user choose
        } else if (fingerprintRegistered) {
            handleFingerprintVerify();
            return;
        } else {
            setShowFaceModal("verify");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return <span className="badge bg-success"><FaCheckCircle className="me-1" /> Approved</span>;
            case "rejected":
                return <span className="badge bg-danger"><FaTimesCircle className="me-1" /> Rejected</span>;
            default:
                return <span className="badge bg-warning text-dark"><FaHourglassHalf className="me-1" /> Pending</span>;
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">
                            <FaUser className="me-2 text-primary" />
                            {user?.fullname || "Student"}
                        </h4>
                        <p className="text-muted mb-0 small">
                            <FaMapPin className="me-1" />
                            Student Dashboard
                        </p>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-12 col-lg-5">
                        <div className="card border-0 shadow-sm h-100 stat-card">
                            <div className="card-body p-3 p-md-4">
                                <h6 className="fw-bold mb-3"><FaShieldAlt className="me-2 text-primary" />Biometric Authentication</h6>

                                {faceRegistered || fingerprintRegistered ? (
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {faceRegistered && (
                                            <div className="d-flex align-items-center gap-2 p-2 bg-success bg-opacity-10 rounded">
                                                <FaCamera className="text-success flex-shrink-0" />
                                                <span className="small flex-grow-1">Face Registered</span>
                                                <FaCheckCircle className="text-success flex-shrink-0" size={14} />
                                            </div>
                                        )}
                                        {fingerprintRegistered && (
                                            <div className="d-flex align-items-center gap-2 p-2 bg-success bg-opacity-10 rounded">
                                                <FaFingerprint className="text-success flex-shrink-0" />
                                                <span className="small flex-grow-1">Fingerprint Registered</span>
                                                <FaCheckCircle className="text-success flex-shrink-0" size={14} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted small mb-3 text-center">No biometric registered yet</p>
                                )}

                                {(!faceRegistered || !fingerprintRegistered) && (
                                    <div className="d-flex gap-2 flex-wrap">
                                        {!faceRegistered && (
                                            <button className="btn btn-outline-primary btn-sm flex-fill"
                                                onClick={() => setShowFaceModal("register")}>
                                                <FaCamera className="me-1" /> Register Face
                                            </button>
                                        )}
                                        {!fingerprintRegistered && webauthnSupported && (
                                            <button className="btn btn-outline-primary btn-sm flex-fill"
                                                onClick={handleFingerprintRegister}>
                                                <FaFingerprint className="me-1" /> Register Fingerprint
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-7">
                        <div className="card border-0 shadow-sm h-100 stat-card">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className={`p-3 rounded-circle ${faceRegistered ? "bg-success bg-opacity-10" : "bg-secondary bg-opacity-10"}`}>
                                        <FaPaperPlane size={20} className={faceRegistered ? "text-success" : "text-secondary"} />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Request Gate Pass</h6>
                                        <small className="text-muted">Going out or coming in</small>
                                    </div>
                                </div>

                                {!faceRegistered && !fingerprintRegistered ? (
                                    <div className="alert alert-info py-2 small mb-0">
                                        <FaShieldAlt className="me-1" />
                                        Register a biometric (face or fingerprint) first.
                                    </div>
                                ) : (
                                    <>
                                        <label className="form-label fw-semibold small mb-2">Select Type</label>
                                        <div className="mb-3">
                                            <div className="d-flex gap-2">
                                                <button
                                                    className={`btn ${requestType === "out" ? "btn-danger" : "btn-outline-danger"} flex-fill py-2`}
                                                    onClick={() => setRequestType("out")}
                                                >
                                                    <FaSignOutAlt className="me-1" />
                                                    Going Out
                                                </button>
                                                <button
                                                    className={`btn ${requestType === "in" ? "btn-success" : "btn-outline-success"} flex-fill py-2`}
                                                    onClick={() => setRequestType("in")}
                                                >
                                                    <FaSignInAlt className="me-1" />
                                                    Coming In
                                                </button>
                                            </div>
                                        </div>

                                        <label className="form-label fw-semibold small mb-2">
                                            <FaMapMarkerAlt className="me-1 text-danger" />
                                            Location <span className="text-muted fw-normal">(GPS required)</span>
                                        </label>
                                        <div className="mb-3">
                                            {location ? (
                                                <div className="border rounded overflow-hidden">
                                                    <div className="d-flex align-items-center justify-content-between p-2 px-3 bg-light small">
                                                        <span className="text-success d-flex align-items-center gap-2">
                                                            <FaCheckCircle size={12} />
                                                            <span>Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>
                                                        </span>
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-sm btn-outline-primary py-0 px-2"
                                                                onClick={() => setShowMap(location)}>
                                                                <FaMapMarkedAlt className="me-1" />Map
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-secondary py-0 px-2"
                                                                onClick={captureLocation} disabled={locationLoading}>
                                                                <FaCrosshairs className="me-1" />Refresh
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="map-container">
                                                        <iframe
                                                            title="Location Map"
                                                            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                                                            width="100%"
                                                            height="100%"
                                                            style={{ border: 0 }}
                                                            allowFullScreen
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                </div>
                                            ) : locationLoading ? (
                                                <div className="d-flex align-items-center justify-content-center gap-2 p-3 bg-light rounded small">
                                                    <span className="spinner-border spinner-border-sm" />
                                                    Getting location...
                                                </div>
                                            ) : (
                                                <div className="text-center p-3 bg-light rounded">
                                                    <FaMapMarkerAlt size={28} className="text-muted mb-2" />
                                                    <p className="text-muted small mb-2">Capture your current location to show on the map</p>
                                                    <button className="btn btn-primary btn-sm px-3"
                                                        onClick={captureLocation} disabled={locationLoading}>
                                                        <FaCrosshairs className="me-1" />Get Current Location
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="btn btn-primary w-100 py-2 fw-bold"
                                            onClick={handleSubmitRequest}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <FaShieldAlt className="me-1" />
                                                    Verify & Submit
                                                </>
                                            )}
                                        </button>

                                        {message.text && (
                                            <div className={`alert alert-${message.type} mt-3 d-flex align-items-center py-2 small mb-0`}>
                                                {message.type === "success" ? <FaCheckCircle className="me-2" /> : <FaExclamationTriangle className="me-2" />}
                                                {message.text}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm stat-card">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="bg-dark bg-opacity-10 p-3 rounded-circle">
                                        <FaMoon size={20} className="text-dark" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Nightly Check-in</h6>
                                        <small className="text-muted">Confirm your presence for tonight</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                                    <div className="d-flex align-items-center gap-3">
                                        {nightlyCheckedIn ? (
                                            <>
                                                <FaCheckCircle size={28} className="text-success" />
                                                <div>
                                                    <p className="fw-bold text-success mb-0">Checked In</p>
                                                    <small className="text-muted">
                                                        {nightlyCheckedAt ? new Date(nightlyCheckedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                                                    </small>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <FaHourglassHalf size={28} className="text-warning" />
                                                <div>
                                                    <p className="fw-bold mb-0 text-warning">Not Yet Checked In</p>
                                                    <small className="text-muted">Tap the button to check in for tonight</small>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        className={`btn ${nightlyCheckedIn ? "btn-outline-success" : "btn-dark"} px-4 fw-semibold`}
                                        onClick={handleNightlyCheckIn}
                                        disabled={nightlyCheckedIn || nightlyLoading}
                                    >
                                        {nightlyLoading ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : nightlyCheckedIn ? (
                                            <>Checked</>
                                        ) : (
                                            <>Check In</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                <FaHistory size={20} className="text-info" />
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0">My Gate Pass History</h6>
                                <small className="text-muted">View your past requests and their status</small>
                            </div>
                        </div>

                        {requests.length === 0 ? (
                            <div className="text-center py-5">
                                <FaHistory size={40} className="text-muted mb-2" />
                                <p className="text-muted mb-0">No gate pass requests yet</p>
                                <small className="text-muted">Submit your first request above</small>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Type</th>
                                            <th>Date & Time</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Approved By</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((req) => (
                                            <tr key={req.id}>
                                                <td>
                                                    {req.request_type === "out" ? (
                                                        <span className="badge bg-danger bg-opacity-75 px-3 py-2">
                                                            <FaSignOutAlt className="me-1" /> Going Out
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success bg-opacity-75 px-3 py-2">
                                                            <FaSignInAlt className="me-1" /> Coming In
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-nowrap">{formatDate(req.created_at)}</td>
                                                <td>
                                                    {req.location_lat && req.location_lng ? (
                                                        <a href={`https://www.google.com/maps?q=${req.location_lat},${req.location_lng}`}
                                                            target="_blank" rel="noreferrer"
                                                            className="text-decoration-none small">
                                                            <FaMapMarkerAlt className="text-danger me-1" />
                                                            {parseFloat(req.location_lat).toFixed(4)}, {parseFloat(req.location_lng).toFixed(4)}
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted small">N/A</span>
                                                    )}
                                                </td>
                                                <td>{getStatusBadge(req.status)}</td>
                                                <td className="small">
                                                    {req.approved_by_name ? (
                                                        <span className="text-muted"><FaUserCheck className="me-1 text-primary" />{req.approved_by_name}</span>
                                                    ) : req.status === "pending" ? (
                                                        <span className="text-muted">—</span>
                                                    ) : (
                                                        <span className="text-muted">System</span>
                                                    )}
                                                </td>
                                                <td className="small">{req.remarks || <span className="text-muted">—</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {bioMethod === null && faceRegistered && fingerprintRegistered && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title"><FaShieldAlt className="me-2" />Choose Verification</h6>
                                <button type="button" className="btn-close btn-close-white"
                                    onClick={() => setBioMethod("cancelled")}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="small text-muted mb-3">Select how to verify your identity</p>
                                <div className="d-flex gap-3 justify-content-center">
                                    <button className="btn btn-outline-primary d-flex flex-column align-items-center gap-2 p-3 border-2"
                                        style={{ borderRadius: "12px", minWidth: "100px" }}
                                        onClick={() => { setBioMethod("face"); setShowFaceModal("verify"); }}>
                                        <FaCamera size={28} />
                                        <span className="fw-bold small">Face</span>
                                    </button>
                                    <button className="btn btn-outline-primary d-flex flex-column align-items-center gap-2 p-3 border-2"
                                        style={{ borderRadius: "12px", minWidth: "100px" }}
                                        onClick={() => { setBioMethod("fingerprint"); handleFingerprintVerify(); }}>
                                        <FaFingerprint size={28} />
                                        <span className="fw-bold small">Fingerprint</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMap && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title"><FaMapMarkerAlt className="me-2" />Your Location</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMap(null)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="map-modal-container">
                                    <iframe
                                        title="Location Map"
                                        src={`https://maps.google.com/maps?q=${showMap.lat},${showMap.lng}&z=16&output=embed`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer py-2 d-flex justify-content-between">
                                <span className="small text-muted">
                                    <FaMapPin className="me-1" />
                                    {showMap.lat.toFixed(6)}, {showMap.lng.toFixed(6)}
                                </span>
                                <a href={`https://www.google.com/maps?q=${showMap.lat},${showMap.lng}`}
                                    target="_blank" rel="noreferrer"
                                    className="btn btn-primary btn-sm">
                                    <FaExternalLinkAlt className="me-2" />Open in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showFaceModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title">
                                    <FaCamera className="me-2" />
                                    {showFaceModal === "register" ? "Register Your Face" : "Verify Your Face"}
                                </h6>
                                <button type="button" className="btn-close btn-close-white"
                                    onClick={() => { setShowFaceModal(null); setBioMethod(null); }}></button>
                            </div>
                            <div className="modal-body p-3">
                                <FaceCamera
                                    mode={showFaceModal}
                                    onSuccess={
                                        showFaceModal === "register"
                                            ? (descriptor) => handleFaceRegister(descriptor)
                                            : (descriptor) => { setBioMethod(null); handleFaceVerify(descriptor); }
                                    }
                                    onError={(err) => {
                                        setShowFaceModal(null);
                                        setBioMethod(null);
                                        showMessage("danger", err);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default StudentDashboard;
