import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaCheckCircle,
    FaTimesCircle,
    FaCommentDots,
    FaMapMarkerAlt,
    FaSignOutAlt,
    FaSignInAlt,
    FaHourglassHalf,
    FaSearch,
    FaUser,
    FaIdCard,
    FaExternalLinkAlt,
    FaUserCheck,
    FaMapMarkedAlt
} from "react-icons/fa";

function GateRequestManagement() {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [action, setAction] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showMap, setShowMap] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await API.get("/gate-requests");
            setRequests(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const openActionModal = (request, actionType) => {
        setSelectedRequest(request);
        setAction(actionType);
        setRemarks("");
        setShowModal(true);
    };

    const handleAction = async () => {
        setProcessing(true);
        try {
            await API.put(`/gate-requests/${selectedRequest.id}`, {
                status: action,
                remarks
            });
            setShowModal(false);
            fetchRequests();
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
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const filteredRequests = requests.filter((req) => {
        if (filter !== "all" && req.status !== filter) return false;
        if (search) {
            const term = search.toLowerCase();
            return (
                req.fullname?.toLowerCase().includes(term) ||
                req.student_id?.toLowerCase().includes(term) ||
                req.room_number?.toLowerCase().includes(term)
            );
        }
        return true;
    });

    const pendingCount = requests.filter((r) => r.status === "pending").length;

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">Gate Request Management</h4>
                        <p className="text-muted mb-0 small">
                            {pendingCount > 0
                                ? `You have ${pendingCount} pending request${pendingCount > 1 ? "s" : ""} to review`
                                : "All requests have been reviewed"}
                        </p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchRequests}>
                        <FaSearch className="me-1" /> Refresh
                    </button>
                </div>

                <div className="row g-2 g-md-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-warning mb-0">{requests.filter((r) => r.status === "pending").length}</h5>
                                <small className="text-muted">Pending</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-success mb-0">{requests.filter((r) => r.status === "approved").length}</h5>
                                <small className="text-muted">Approved</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-danger mb-0">{requests.filter((r) => r.status === "rejected").length}</h5>
                                <small className="text-muted">Rejected</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-primary mb-0">{requests.length}</h5>
                                <small className="text-muted">Total</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-column flex-sm-row flex-wrap gap-3 mb-4">
                            <div className="btn-group btn-group-sm">
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
                            <div className="ms-sm-auto">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search by name, ID or room..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ minWidth: "200px" }}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 small">
                                <thead className="table-light">
                                    <tr>
                                        <th><FaUser className="me-1" /> Student</th>
                                        <th><FaIdCard className="me-1" /> ID</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th><FaMapMarkerAlt className="me-1" /> Location</th>
                                        <th>Status</th>
                                        <th>Approved By</th>
                                        <th><FaCommentDots className="me-1" /> Remarks</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-5 text-muted">
                                                No gate requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <tr key={req.id} className={req.status === "pending" ? "table-warning" : ""}>
                                                <td className="fw-semibold text-nowrap">{req.fullname}</td>
                                                <td>{req.student_id}</td>
                                                <td>
                                                    {req.request_type === "out" ? (
                                                        <span className="badge bg-danger px-3 py-2">
                                                            <FaSignOutAlt className="me-1" /> Going Out
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success px-3 py-2">
                                                            <FaSignInAlt className="me-1" /> Coming In
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-nowrap">{formatDate(req.created_at)}</td>
                                                <td>
                                                    {req.location_lat && req.location_lng ? (
                                                        <div className="d-flex gap-1">
                                                            <a href={`https://www.google.com/maps?q=${req.location_lat},${req.location_lng}`}
                                                                target="_blank" rel="noreferrer"
                                                                className="text-decoration-none small" title="View on Google Maps">
                                                                <FaMapMarkerAlt className="text-danger me-1" />
                                                                {parseFloat(req.location_lat).toFixed(4)}, {parseFloat(req.location_lng).toFixed(4)}
                                                            </a>
                                                            <button className="btn btn-sm btn-outline-info py-0 px-1 ms-1"
                                                                title="View on Map"
                                                                onClick={() => setShowMap({ lat: parseFloat(req.location_lat), lng: parseFloat(req.location_lng), name: req.fullname })}>
                                                                <FaMapMarkedAlt size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">Not captured</span>
                                                    )}
                                                </td>
                                                <td>{getStatusBadge(req.status)}</td>
                                                <td className="small">
                                                    {req.approved_by_name ? (
                                                        <span><FaUserCheck className="me-1 text-primary" />{req.approved_by_name}</span>
                                                    ) : req.status === "pending" ? (
                                                        <span className="text-muted">—</span>
                                                    ) : (
                                                        <span className="text-muted">System</span>
                                                    )}
                                                </td>
                                                <td className="small">{req.remarks || <span className="text-muted">—</span>}</td>
                                                <td>
                                                    {req.status === "pending" ? (
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-success btn-sm"
                                                                title="Approve"
                                                                onClick={() => openActionModal(req, "approved")}>
                                                                <FaCheckCircle />
                                                            </button>
                                                            <button className="btn btn-danger btn-sm"
                                                                title="Reject"
                                                                onClick={() => openActionModal(req, "rejected")}>
                                                                <FaTimesCircle />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">
                                                            {req.approved_by_name ? `by ${req.approved_by_name}` : "Processed"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered modal-sm">
                            <div className="modal-content border-0 shadow">
                                <div className={`modal-header text-white py-2 ${action === "approved" ? "bg-success" : "bg-danger"}`}>
                                    <h6 className="modal-title">
                                        {action === "approved" ? (
                                            <><FaCheckCircle className="me-2" /> Approve Request</>
                                        ) : (
                                            <><FaTimesCircle className="me-2" /> Reject Request</>
                                        )}
                                    </h6>
                                    <button type="button" className="btn-close btn-close-white"
                                        onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-3">
                                    <div className="mb-3 p-3 bg-light rounded small">
                                        <p className="mb-1"><strong><FaUser className="me-1" /> Student:</strong> {selectedRequest?.fullname}</p>
                                        <p className="mb-1"><strong><FaIdCard className="me-1" /> ID:</strong> {selectedRequest?.student_id}</p>
                                        <p className="mb-0">
                                            <strong>Request:</strong> Going {selectedRequest?.request_type === "out" ? "Out" : "In"}
                                            {selectedRequest?.location_lat && (
                                                <> | <FaMapMarkerAlt className="text-danger ms-1" />{" "}
                                                    {parseFloat(selectedRequest.location_lat).toFixed(4)},{" "}
                                                    {parseFloat(selectedRequest.location_lng).toFixed(4)}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-semibold small">
                                            <FaCommentDots className="me-1" /> Remarks <span className="text-muted fw-normal">(optional)</span>
                                        </label>
                                        <textarea className="form-control form-control-sm" rows="3"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder={`Enter remarks for ${action === "approved" ? "approval" : "rejection"}...`}>
                                        </textarea>
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button className={`btn btn-sm ${action === "approved" ? "btn-success" : "btn-danger"} px-3`}
                                        onClick={handleAction} disabled={processing}>
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

                {showMap && (
                    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-primary text-white py-2">
                                    <h6 className="modal-title"><FaMapMarkerAlt className="me-2" />{showMap.name}'s Location</h6>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowMap(null)}></button>
                                </div>
                                <div className="modal-body p-3 text-center">
                                    <div className="bg-light rounded p-3 mb-3">
                                        <p className="mb-1 small"><strong>Latitude:</strong> {showMap.lat.toFixed(6)}</p>
                                        <p className="mb-0 small"><strong>Longitude:</strong> {showMap.lng.toFixed(6)}</p>
                                    </div>
                                    <a href={`https://www.google.com/maps?q=${showMap.lat},${showMap.lng}`}
                                        target="_blank" rel="noreferrer"
                                        className="btn btn-primary w-100 btn-sm">
                                        <FaExternalLinkAlt className="me-2" />Open in Google Maps
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default GateRequestManagement;
