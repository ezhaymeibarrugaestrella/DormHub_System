import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaCommentDots,
    FaUserGraduate,
    FaIdCard,
    FaHome,
    FaGraduationCap,
    FaPhone,
    FaUserTie,
    FaMapMarkerAlt,
    FaEnvelope,
    FaFingerprint,
    FaHourglassHalf
} from "react-icons/fa";

function StudentApprovals() {
    const [students, setStudents] = useState([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [action, setAction] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showDetails, setShowDetails] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await API.get("/student-registration");
            setStudents(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const openActionModal = (student, actionType) => {
        setSelectedStudent(student);
        setAction(actionType);
        setRemarks("");
        setShowModal(true);
    };

    const handleAction = async () => {
        setProcessing(true);
        try {
            await API.put(`/student-registration/${selectedStudent.id}`, {
                status: action,
                remarks
            });
            setShowModal(false);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved":
                return <span className="badge bg-success px-3 py-2"><FaCheckCircle className="me-1" /> Approved</span>;
            case "rejected":
                return <span className="badge bg-danger px-3 py-2"><FaTimesCircle className="me-1" /> Rejected</span>;
            default:
                return <span className="badge bg-warning text-dark px-3 py-2"><FaHourglassHalf className="me-1" /> Pending</span>;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const filteredStudents = students.filter((s) => {
        if (filter !== "all" && s.registration_status !== filter) return false;
        if (search) {
            const term = search.toLowerCase();
            return (
                s.fullname?.toLowerCase().includes(term) ||
                s.student_id?.toLowerCase().includes(term) ||
                s.email?.toLowerCase().includes(term)
            );
        }
        return true;
    });

    const pendingCount = students.filter((s) => s.registration_status === "pending").length;

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">Student Registration Approvals</h4>
                        <p className="text-muted mb-0">
                            {pendingCount > 0
                                ? `You have ${pendingCount} pending student registration${pendingCount > 1 ? "s" : ""} to review`
                                : "All registrations have been reviewed"}
                        </p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchStudents}>
                        Refresh
                    </button>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h3 className="fw-bold text-warning mb-0">{students.filter((s) => s.registration_status === "pending").length}</h3>
                                <small className="text-muted">Pending</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm bg-success bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h3 className="fw-bold text-success mb-0">{students.filter((s) => s.registration_status === "approved").length}</h3>
                                <small className="text-muted">Approved</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h3 className="fw-bold text-danger mb-0">{students.filter((s) => s.registration_status === "rejected").length}</h3>
                                <small className="text-muted">Rejected</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
                            <div className="card-body text-center py-3">
                                <h3 className="fw-bold text-primary mb-0">{students.length}</h3>
                                <small className="text-muted">Total</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-wrap gap-3 mb-4">
                            <div className="btn-group">
                                {["all", "pending", "approved", "rejected"].map((f) => (
                                    <button
                                        key={f}
                                        className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline-primary"}`}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="ms-auto">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search by name, ID or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: "250px" }}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th><FaUserGraduate className="me-1" /> Name</th>
                                        <th><FaIdCard className="me-1" /> Student ID</th>
                                        <th><FaEnvelope className="me-1" /> Email</th>
                                        <th><FaFingerprint className="me-1" /> Biometric</th>
                                        <th>Registered</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted">
                                                No student registrations found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s) => (
                                            <React.Fragment key={s.id}>
                                                <tr
                                                    className={`${s.registration_status === "pending" ? "table-warning" : ""}`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => setShowDetails(showDetails === s.id ? null : s.id)}
                                                >
                                                    <td className="fw-semibold">{s.fullname}</td>
                                                    <td>{s.student_id}</td>
                                                    <td>{s.email}</td>
                                                    <td>
                                                        {s.fingerprint_registered ? (
                                                            <span className="badge bg-success"><FaCheckCircle className="me-1" /> Registered</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Not Set</span>
                                                        )}
                                                    </td>
                                                    <td className="small">{formatDate(s.created_at)}</td>
                                                    <td>{getStatusBadge(s.registration_status)}</td>
                                                    <td>
                                                        {s.registration_status === "pending" ? (
                                                            <div className="d-flex gap-1">
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    title="Approve"
                                                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, "approved"); }}
                                                                >
                                                                    <FaCheckCircle />
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    title="Reject"
                                                                    onClick={(e) => { e.stopPropagation(); openActionModal(s, "rejected"); }}
                                                                >
                                                                    <FaTimesCircle />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="small text-muted">
                                                                {s.registration_remarks || "—"}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {showDetails === s.id && (
                                                    <tr className="table-light">
                                                        <td colSpan="7" className="p-4">
                                                            <div className="row g-4">
                                                                <div className="col-md-6">
                                                                    <h6 className="fw-bold text-primary mb-3">
                                                                        <FaHome className="me-1" /> Student Address
                                                                    </h6>
                                                                    <p className="mb-1">{s.address || "Not provided"}</p>

                                                                    <h6 className="fw-bold text-primary mt-3 mb-3">
                                                                        <FaGraduationCap className="me-1" /> Academic Info
                                                                    </h6>
                                                                    <p className="mb-1">
                                                                        <strong>Program:</strong> {s.program || "N/A"} | <strong>Year:</strong> {s.year_section || "N/A"}
                                                                    </p>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <h6 className="fw-bold text-primary mb-3">
                                                                        <FaUserTie className="me-1" /> Parent/Guardian Info
                                                                    </h6>
                                                                    <p className="mb-1">
                                                                        <strong><FaUserTie className="me-1" /></strong> {s.parent_name || "Not provided"}
                                                                    </p>
                                                                    <p className="mb-1">
                                                                        <strong><FaPhone className="me-1" /></strong> {s.parent_contact || "Not provided"}
                                                                    </p>
                                                                    <p className="mb-0">
                                                                        <strong><FaMapMarkerAlt className="me-1" /></strong> {s.parent_address || "Not provided"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div
                        className="modal d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className={`modal-header text-white ${action === "approved" ? "bg-success" : "bg-danger"}`}>
                                    <h5 className="modal-title">
                                        {action === "approved" ? (
                                            <><FaCheckCircle className="me-2" /> Approve Student</>
                                        ) : (
                                            <><FaTimesCircle className="me-2" /> Reject Student</>
                                        )}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3 p-3 bg-light rounded">
                                        <p className="mb-2"><strong>Name:</strong> {selectedStudent?.fullname}</p>
                                        <p className="mb-2"><strong>Student ID:</strong> {selectedStudent?.student_id}</p>
                                        <p className="mb-2"><strong>Email:</strong> {selectedStudent?.email}</p>
                                        <p className="mb-0"><strong>Parent/Guardian:</strong> {selectedStudent?.parent_name}</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            <FaCommentDots className="me-1" /> Remarks
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder={`Enter remarks for ${action === "approved" ? "approval" : "rejection"}...`}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => setShowModal(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className={`btn ${action === "approved" ? "btn-success" : "btn-danger"} px-4`}
                                                        onClick={handleAction}
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <span className="spinner-border spinner-border-sm me-1" />
                                                        ) : (
                                                            <>{action === "approved" ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}</>
                                                        )}
                                                        {action === "approved" ? "Approve" : "Reject"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DashboardLayout>
                    );
                }

                export default StudentApprovals;
