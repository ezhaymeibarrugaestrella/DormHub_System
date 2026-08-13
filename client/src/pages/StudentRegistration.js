import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaUser,
    FaIdCard,
    FaGraduationCap,
    FaLayerGroup,
    FaEnvelope,
    FaShieldAlt,
    FaCheckCircle,
    FaLock,
    FaUserPlus,
    FaArrowRight,
    FaArrowLeft,
    FaHome,
    FaPhone,
    FaClock,
    FaUserTie,
    FaMapMarkerAlt,
    FaCamera,
    FaFingerprint
} from "react-icons/fa";
import axios from "axios";
import FaceCamera from "../components/FaceCamera";
import {
    startRegistration,
    browserSupportsWebAuthn,
    platformAuthenticatorIsAvailable
} from "@simplewebauthn/browser";

const FULLNAME_RE = /^[A-Za-z\u00C0-\u017F]+(?:[ .'-][A-Za-z\u00C0-\u017F]+)+\.?$/;
const STUDENT_ID_RE = /^[A-Za-z0-9-]{5,20}$/;
const ROOM_RE = /^[A-Za-z0-9-]{1,10}$/;
const PHONE_RE = /^09\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StudentRegistration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: "",
        studentId: "",
        program: "",
        yearLevel: "",
        roomNumber: "",
        email: "",
        password: "",
        address: "",
        parentName: "",
        parentContact: "",
        parentAddress: ""
    });
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [registeringFace, setRegisteringFace] = useState(false);
    const [faceDone, setFaceDone] = useState(false);
    const [biometricMethod, setBiometricMethod] = useState(null);
    const [webauthnSupported, setWebauthnSupported] = useState(false);
    const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);
    const [bioLoading, setBioLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const getApiUrl = () => process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;

    useEffect(() => {
        const checkWebAuthn = async () => {
            try {
                const supported = await browserSupportsWebAuthn();
                setWebauthnSupported(supported);
                if (supported) {
                    const available = await platformAuthenticatorIsAvailable();
                    setPlatformAuthAvailable(available);
                }
            } catch {
                setWebauthnSupported(false);
            }
        };
        checkWebAuthn();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateField = (name, value) => {
        const v = (value || "").trim();

        switch (name) {
            case "fullname":
                if (!v) return "Full name is required";
                if (!FULLNAME_RE.test(v)) {
                    return "Full name must only contain letters, spaces, hyphens, and apostrophes (e.g. Juan Dela Cruz)";
                }
                return "";
            case "parentName":
                if (!v) return "Parent/guardian name is required";
                if (!FULLNAME_RE.test(v)) {
                    return "Name must only contain letters, spaces, hyphens, and apostrophes";
                }
                return "";
            case "studentId":
                if (!v) return "Student ID is required";
                if (!STUDENT_ID_RE.test(v)) {
                    return "Student ID must be 5-20 characters using letters, numbers, and hyphens only";
                }
                return "";
            case "roomNumber":
                if (v && !ROOM_RE.test(v)) {
                    return "Room number can only contain letters, numbers, and hyphens";
                }
                return "";
            case "program":
                if (!v) return "Please select your program";
                return "";
            case "yearLevel":
                if (!v) return "Please select your year level";
                return "";
            case "address":
                if (!v) return "Address is required";
                if (v.length < 5) return "Please enter a complete address (min 5 characters)";
                return "";
            case "parentAddress":
                if (!v) return "Parent/guardian address is required";
                if (v.length < 5) return "Please enter a complete address (min 5 characters)";
                return "";
            case "parentContact":
                if (!v) return "Parent/guardian contact number is required";
                if (!PHONE_RE.test(v)) {
                    return "Enter a valid 11-digit mobile number starting with 09 (e.g. 09817272189)";
                }
                return "";
            case "email":
                if (!v) return "Email address is required";
                if (!EMAIL_RE.test(v)) return "Enter a valid email address (e.g. name@example.com)";
                return "";
            case "password":
                if (!v) return "Password is required";
                if (v.length < 6) return "Password must be at least 6 characters";
                return "";
            default:
                return "";
        }
    };

    const validateFields = (names) => {
        const errs = {};
        names.forEach((name) => {
            const msg = validateField(name, formData[name]);
            if (msg) errs[name] = msg;
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const STEP_1_FIELDS = ["fullname", "studentId", "program", "yearLevel", "roomNumber", "address"];
    const STEP_2_FIELDS = ["parentName", "parentContact", "parentAddress"];
    const STEP_3_FIELDS = [
        "fullname", "studentId", "program", "yearLevel", "roomNumber", "address",
        "parentName", "parentContact", "parentAddress", "email", "password"
    ];

    const handleNext = (e) => {
        e.preventDefault();
        const valid = step === 1
            ? validateFields(STEP_1_FIELDS)
            : validateFields(STEP_2_FIELDS);

        if (!valid) {
            setMessage({
                type: "danger",
                text: "Please correct the highlighted fields before continuing."
            });
            return;
        }

        setMessage({ type: "", text: "" });
        setStep(step + 1);
    };

    const handleBack = () => {
        setMessage({ type: "", text: "" });
        setErrors({});
        setStep(step - 1);
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();

        if (!validateFields(STEP_3_FIELDS)) {
            setMessage({
                type: "danger",
                text: "Please correct the highlighted fields before creating your account."
            });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const base = getApiUrl();
            const res = await axios.post(`${base}/api/student-registration/register`, {
                student_id: formData.studentId,
                fullname: formData.fullname,
                email: formData.email,
                password: formData.password,
                program: formData.program,
                year_section: formData.yearLevel,
                room_number: formData.roomNumber,
                address: formData.address,
                parent_name: formData.parentName,
                parent_contact: formData.parentContact,
                parent_address: formData.parentAddress
            });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            setMessage({ type: "success", text: "Account created! Now register your face." });
            setStep(4);
        } catch (err) {
            setMessage({
                type: "danger",
                text: err.response?.data?.message || err.response?.data?.sqlMessage || "Registration failed"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCapture = async (descriptor, imageData) => {
        setRegisteringFace(true);
        try {
            const base = getApiUrl();
            await axios.post(
                `${base}/api/face-auth/register`,
                { descriptor },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            setFaceDone(true);
            setMessage({ type: "success", text: "Face registered successfully!" });

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setTimeout(() => {
                navigate("/?registration=pending");
            }, 5000);
        } catch (err) {
            console.error(err);
            setMessage({
                type: "danger",
                text: err.response?.data?.message || err.message || "Face registration failed"
            });
            setRegisteringFace(false);
        }
    };

    const handleFaceError = (errorText) => {
        setMessage({ type: "danger", text: errorText });
    };

    const handleSkip = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/?registration=pending");
    };

    const handleFingerprintRegister = async () => {
        setBioLoading(true);
        setMessage({ type: "", text: "" });
        try {
            const base = getApiUrl();
            const token = localStorage.getItem("token");
            const beginRes = await axios.post(
                `${base}/api/webauthn/register/begin`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const credential = await startRegistration(beginRes.data);
            await axios.post(
                `${base}/api/webauthn/register/complete`,
                { credential },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFaceDone(true);
            setMessage({ type: "success", text: "Fingerprint registered successfully!" });
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => {
                navigate("/?registration=pending");
            }, 5000);
        } catch (err) {
            console.error(err);
            setMessage({
                type: "danger",
                text: err.response?.data?.message || err.message || "Fingerprint registration failed"
            });
            setBiometricMethod(null);
        } finally {
            setBioLoading(false);
        }
    };

    const fieldClass = (name) =>
        `form-control${errors[name] ? " is-invalid" : ""}`;

    const renderError = (name) =>
        errors[name] ? <div className="invalid-feedback">{errors[name]}</div> : null;

    return (
        <div
            className="d-flex align-items-start justify-content-center py-3 py-sm-4 py-md-5 px-2 px-sm-3"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #081028 0%, #1a1a4e 50%, #0d6efd 100%)"
            }}
        >
            <div className="container" style={{ maxWidth: "860px", padding: 0 }}>
                <div className="text-center mb-3">
                    <Link to="/" className="text-white-50 text-decoration-none small">
                        ← Back to Login
                    </Link>
                </div>

                <div className="card border-0 shadow-lg mx-0">
                    <div className="card-body p-3 p-sm-4 p-md-5">
                        <div className="text-center mb-3 mb-md-4">
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: "64px", height: "64px" }}>
                                <FaUserPlus size={28} className="text-primary" />
                            </div>
                            <h3 className="fw-bold mb-1 fs-4">Student Registration</h3>
                            <p className="text-muted small mb-0">Create your account and register your fingerprint</p>
                        </div>

                        <div className="d-flex justify-content-center mb-4 mb-md-5 step-indicator px-2">
                            {[1, 2, 3, 4].map((s) => (
                                <div key={s} className="d-flex align-items-center">
                                    <div
                                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0
                                            ${step > s ? "bg-success text-white" : step === s ? "bg-primary text-white" : "bg-light text-muted"}`}
                                        style={{ width: "34px", height: "34px", fontSize: "14px" }}
                                    >
                                        {step > s ? <FaCheckCircle size={14} /> : s}
                                    </div>
                                    <span className={`ms-1 small fw-semibold ${step === s ? "text-primary" : "text-muted"}`}>
                                        {s === 1 ? "Info" : s === 2 ? "Parents" : s === 3 ? "Account" : "Fingerprint"}
                                    </span>
                                    {s < 4 && <FaArrowRight className="mx-2 text-muted" style={{ fontSize: "12px", flexShrink: 0 }} />}
                                </div>
                            ))}
                        </div>

                        {step === 1 && (
                            <form onSubmit={handleNext} noValidate>
                                <h6 className="fw-bold text-primary mb-2 mb-md-3">
                                    <FaUser className="me-2" />Student Information
                                </h6>
                                <div className="row g-2 g-md-3 mb-3 mb-md-4">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Full Name</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaUser size={12} /></span>
                                            <input type="text" name="fullname" className={fieldClass("fullname")}
                                                placeholder="Enter full name" value={formData.fullname}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("fullname")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Student ID Number</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaIdCard size={12} /></span>
                                            <input type="text" name="studentId" className={fieldClass("studentId")}
                                                placeholder="Enter student ID" value={formData.studentId}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("studentId")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Program</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaGraduationCap size={12} /></span>
                                            <select name="program" className={`form-select${errors.program ? " is-invalid" : ""}`}
                                                value={formData.program} onChange={handleChange}>
                                                <option value="">Select Program</option>
                                                <option>BSIT</option><option>BSCS</option><option>BSED</option>
                                                <option>BSBA</option><option>BSHM</option>
                                            </select>
                                        </div>
                                        {renderError("program")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Year Level</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaLayerGroup size={12} /></span>
                                            <select name="yearLevel" className={`form-select${errors.yearLevel ? " is-invalid" : ""}`}
                                                value={formData.yearLevel} onChange={handleChange}>
                                                <option value="">Select Year Level</option>
                                                <option>1st Year</option><option>2nd Year</option>
                                                <option>3rd Year</option><option>4th Year</option>
                                            </select>
                                        </div>
                                        {renderError("yearLevel")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small"><FaHome className="me-1" /> Room Number</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaHome size={12} /></span>
                                            <input type="text" name="roomNumber" className={fieldClass("roomNumber")}
                                                placeholder="e.g. 201, 3B" value={formData.roomNumber}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("roomNumber")}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small"><FaMapMarkerAlt className="me-1 text-muted" /> Address</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaHome size={12} /></span>
                                            <textarea name="address" className={fieldClass("address")} placeholder="Enter your complete address"
                                                value={formData.address} onChange={handleChange} rows="2" />
                                        </div>
                                        {renderError("address")}
                                    </div>
                                </div>

                                {message.text && (
                                    <div className={`alert alert-${message.type} mt-2 py-2 small`}>{message.text}</div>
                                )}

                                <div className="d-flex justify-content-end">
                                    <button type="submit" className="btn btn-primary py-2 fw-bold px-4">
                                        Next <FaArrowRight className="ms-2" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleNext} noValidate>
                                <h6 className="fw-bold text-primary mb-2 mb-md-3">
                                    <FaUserTie className="me-2" />Parent / Guardian Information
                                </h6>
                                <div className="row g-2 g-md-3 mb-3 mb-md-4">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Parent/Guardian Name</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaUserTie size={12} /></span>
                                            <input type="text" name="parentName" className={fieldClass("parentName")}
                                                placeholder="Enter parent/guardian name" value={formData.parentName}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("parentName")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Parent/Guardian Contact No.</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaPhone size={12} /></span>
                                            <input type="text" name="parentContact" className={fieldClass("parentContact")}
                                                placeholder="Enter contact number" value={formData.parentContact}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("parentContact")}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold small"><FaMapMarkerAlt className="me-1 text-muted" /> Parent/Guardian Address</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaMapMarkerAlt size={12} /></span>
                                            <textarea name="parentAddress" className={fieldClass("parentAddress")} placeholder="Enter parent/guardian address"
                                                value={formData.parentAddress} onChange={handleChange} rows="2" />
                                        </div>
                                        {renderError("parentAddress")}
                                    </div>
                                </div>

                                {message.text && (
                                    <div className={`alert alert-${message.type} mt-2 py-2 small`}>{message.text}</div>
                                )}

                                <div className="d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary py-2 fw-bold px-4"
                                        onClick={handleBack}>
                                        <FaArrowLeft className="me-2" /> Back
                                    </button>
                                    <button type="submit" className="btn btn-primary py-2 fw-bold px-4">
                                        Next <FaArrowRight className="ms-2" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleCreateAccount} noValidate>
                                <h6 className="fw-bold text-primary mb-2 mb-md-3">
                                    <FaEnvelope className="me-2" />Account Credentials
                                </h6>
                                <div className="row g-2 g-md-3 mb-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Email Address</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaEnvelope size={12} /></span>
                                            <input type="email" name="email" className={fieldClass("email")}
                                                placeholder="Enter email" value={formData.email}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("email")}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold small">Password</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><FaLock size={12} /></span>
                                            <input type="password" name="password" className={fieldClass("password")}
                                                placeholder="Create password (min 6 chars)" value={formData.password}
                                                onChange={handleChange} />
                                        </div>
                                        {renderError("password")}
                                    </div>
                                </div>

                                <div className="alert alert-info py-2 small">
                                    <FaShieldAlt className="me-2" />
                                    By clicking Create Account, your information will be saved and you will proceed to biometric registration (face or fingerprint).
                                </div>

                                {message.text && (
                                    <div className={`alert alert-${message.type} mt-2 py-2 small`}>{message.text}</div>
                                )}

                                <div className="d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary py-2 fw-bold px-4"
                                        onClick={handleBack}>
                                        <FaArrowLeft className="me-2" /> Back
                                    </button>
                                    <button type="submit" className="btn btn-primary py-2 fw-bold px-4"
                                        disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                        Create Account <FaArrowRight className="ms-2" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 4 && (
                            <div className="text-center py-3 py-md-4">
                                {faceDone ? (
                                    <>
                                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                            style={{ width: "90px", height: "90px" }}>
                                            <FaCheckCircle size={44} className="text-success" />
                                        </div>
                                        <h5 className="fw-bold text-success">Biometric Registered!</h5>
                                        <p className="text-muted small mb-1">Your registration has been submitted.</p>
                                        <p className="text-muted small"><FaClock className="me-1" />Please wait for the landlady to approve your account.</p>
                                        <p className="small text-muted">Redirecting to login page...</p>
                                    </>
                                ) : !biometricMethod ? (
                                    <>
                                        <h5 className="fw-bold mb-2">Register Your Biometric</h5>
                                        <p className="text-muted small mb-4">Choose your preferred authentication method</p>

                                        <div className="row g-3 justify-content-center mb-3" style={{ maxWidth: "500px", margin: "0 auto" }}>
                                            {platformAuthAvailable && (
                                                <div className="col-12 col-sm-6">
                                                    <button
                                                        className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2 border-2"
                                                        onClick={() => setBiometricMethod("fingerprint")}
                                                        style={{ borderRadius: "14px", padding: "1.5rem 1rem", minHeight: "130px" }}>
                                                        <FaFingerprint size={38} className="text-primary" />
                                                        <span className="fw-bold">Fingerprint</span>
                                                        <small className="text-muted">Use sensor</small>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="col-12 col-sm-6">
                                                <button
                                                    className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2 border-2"
                                                    onClick={() => setBiometricMethod("face")}
                                                    style={{ borderRadius: "14px", padding: "1.5rem 1rem", minHeight: "130px" }}>
                                                    <FaCamera size={36} className="text-primary" />
                                                    <span className="fw-bold">Face</span>
                                                    <small className="text-muted">Use camera</small>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <button className="btn btn-link btn-sm text-muted text-decoration-none"
                                                onClick={handleSkip}>
                                                Skip for now
                                            </button>
                                        </div>
                                    </>
                                ) : biometricMethod === "fingerprint" ? (
                                    <>
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                            style={{ width: "100px", height: "100px" }}>
                                            <FaFingerprint size={40} className="text-primary" />
                                        </div>
                                        <h5 className="fw-bold mb-2">Register Your Fingerprint</h5>
                                        <p className="text-muted small mb-3">
                                            {bioLoading ? "Please complete the prompt on your device..." : "Tap the button to register using your device's fingerprint sensor"}
                                        </p>

                                        <button
                                            className="btn btn-primary btn-lg px-5 py-3 mb-3"
                                            onClick={handleFingerprintRegister}
                                            disabled={bioLoading}
                                            style={{ borderRadius: "12px" }}>
                                            {bioLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2" /> Processing...</>
                                            ) : (
                                                <><FaFingerprint className="me-2" /> Register Fingerprint</>
                                            )}
                                        </button>

                                        <div className="alert alert-info d-inline-flex align-items-center gap-2 mx-0 mx-md-5 mt-2 py-2 small">
                                            <FaShieldAlt size={14} />
                                            <span>Your fingerprint stays on your device and is never shared with the server.</span>
                                        </div>

                                        {message.text && (
                                            <div className={`alert alert-${message.type} mx-0 mx-md-5 mt-2 py-2 small`}>{message.text}</div>
                                        )}

                                        <div className="mt-3 d-flex gap-2 justify-content-center flex-wrap">
                                            <button className="btn btn-outline-secondary px-3 py-2 btn-sm"
                                                onClick={() => setBiometricMethod(null)}
                                                disabled={bioLoading}>Back</button>
                                            <button className="btn btn-link btn-sm text-muted text-decoration-none"
                                                onClick={handleSkip} disabled={bioLoading}>
                                                Skip for now
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                            style={{ width: "100px", height: "100px" }}>
                                            <FaCamera size={40} className="text-primary" />
                                        </div>
                                        <h5 className="fw-bold mb-2">Register Your Face</h5>
                                        <p className="text-muted small mb-3">Use your phone's camera to scan your face</p>

                                        <div className="mx-auto" style={{ maxWidth: "420px" }}>
                                            <FaceCamera
                                                mode="register"
                                                onSuccess={handleFaceCapture}
                                                onError={handleFaceError}
                                            />
                                        </div>

                                        <div className="alert alert-info d-inline-flex align-items-center gap-2 mx-0 mx-md-5 mt-3 py-2 small">
                                            <FaShieldAlt size={14} />
                                            <span>Your face data is stored securely as an encrypted mathematical representation.</span>
                                        </div>

                                        {message.text && (
                                            <div className={`alert alert-${message.type} mx-0 mx-md-5 mt-2 py-2 small`}>{message.text}</div>
                                        )}

                                        <div className="mt-3 d-flex gap-2 justify-content-center flex-wrap">
                                            <button className="btn btn-outline-secondary px-3 py-2 btn-sm"
                                                onClick={() => setBiometricMethod(null)}
                                                disabled={registeringFace}>Back</button>
                                            <button className="btn btn-link btn-sm text-muted text-decoration-none"
                                                onClick={handleSkip} disabled={registeringFace}>
                                                Skip for now
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentRegistration;
