import React, { useEffect, useState } from "react";
import API from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Link } from "react-router-dom";
import {
    FaUsers,
    FaClipboardCheck,
    FaExclamationTriangle,
    FaUserCheck,
    FaDoorOpen,
    FaHourglassHalf,
    FaCheckCircle,
    FaTimesCircle,
    FaSignOutAlt,
    FaSignInAlt,
    FaMapMarkerAlt,
    FaSyncAlt,
    FaExternalLinkAlt,
    FaMapMarkedAlt,
    FaMoon
} from "react-icons/fa";

function Dashboard() {
    const [stats, setStats] = useState({});
    const [recentRequests, setRecentRequests] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(null);
    const [nightlyStudents, setNightlyStudents] = useState([]);
    const [nightlyDate, setNightlyDate] = useState("");
    const [nightlyCheckedCount, setNightlyCheckedCount] = useState(0);
    const [nightlyTotalCount, setNightlyTotalCount] = useState(0);
    const [nightlyLoading, setNightlyLoading] = useState(false);
    const [showNightModal, setShowNightModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchNightlyData = async () => {
        try {
            const res = await API.get("/attendance/nightly");
            setNightlyStudents(res.data.students || []);
            setNightlyDate(res.data.date || "");
            setNightlyCheckedCount(res.data.checkedIn || 0);
            setNightlyTotalCount(res.data.total || 0);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, recentRes, pendingRes] = await Promise.all([
                API.get("/dashboard/stats"),
                API.get("/gate-requests/recent"),
                API.get("/gate-requests/pending/count")
            ]);

            setStats(statsRes.data);
            setRecentRequests(recentRes.data);
            setPendingCount(pendingRes.data.count);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        fetchNightlyData();
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
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">Admin Dashboard</h4>
                        <p className="text-muted mb-0 small">
                            Welcome back, <strong>{user.fullname || "Admin"}</strong>
                        </p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchData} disabled={loading}>
                        <FaSyncAlt className={`me-1 ${loading ? "fa-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                <div className="row g-2 g-md-3 mb-4">
                    <div className="col-6 col-md-3">
                        <Link to="/users" className="text-decoration-none">
                            <div className="card border-0 shadow-sm h-100 stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1 small">Total Users</p>
                                            <h4 className="fw-bold text-primary mb-0">
                                                {loading ? <span className="spinner-border spinner-border-sm" /> : stats.totalUsers || 0}
                                            </h4>
                                        </div>
                                        <div className="bg-primary bg-opacity-10 p-2 p-md-3 rounded-3">
                                            <FaUsers size={20} className="text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-6 col-md-3">
                        <Link to="/attendance" className="text-decoration-none">
                            <div className="card border-0 shadow-sm h-100 stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1 small">Attendance Today</p>
                                            <h4 className="fw-bold text-success mb-0">
                                                {loading ? <span className="spinner-border spinner-border-sm" /> : stats.totalAttendance || 0}
                                            </h4>
                                        </div>
                                        <div className="bg-success bg-opacity-10 p-2 p-md-3 rounded-3">
                                            <FaClipboardCheck size={20} className="text-success" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-6 col-md-3">
                        <Link to="/demerits" className="text-decoration-none">
                            <div className="card border-0 shadow-sm h-100 stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1 small">Total Demerits</p>
                                            <h4 className="fw-bold text-danger mb-0">
                                                {loading ? <span className="spinner-border spinner-border-sm" /> : stats.totalDemerits || 0}
                                            </h4>
                                        </div>
                                        <div className="bg-danger bg-opacity-10 p-2 p-md-3 rounded-3">
                                            <FaExclamationTriangle size={20} className="text-danger" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-6 col-md-3">
                        <Link to="/gate-requests" className="text-decoration-none">
                            <div className="card border-0 shadow-sm h-100 stat-card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <p className="text-muted mb-1 small">Pending Gate Requests</p>
                                            <h4 className="fw-bold text-warning mb-0">
                                                {loading ? <span className="spinner-border spinner-border-sm" /> : pendingCount}
                                            </h4>
                                        </div>
                                        <div className="bg-warning bg-opacity-10 p-2 p-md-3 rounded-3">
                                            <FaDoorOpen size={20} className="text-warning" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    {stats.activeUsers !== undefined && (
                        <div className="col-12 col-md-4">
                            <div className="card border-0 shadow-sm bg-primary bg-opacity-10 text-center py-3 h-100 stat-card">
                                <div className="card-body">
                                    <FaUserCheck size={28} className="text-primary mb-2" />
                                    <h5 className="fw-bold text-primary mb-0">{stats.activeUsers}</h5>
                                    <small className="text-muted">Active Users</small>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col-12 col-md-8">
                        <div className="card border-0 shadow-sm h-100 stat-card">
                            <div className="card-body d-flex align-items-center justify-content-between p-3 p-md-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                                        <FaDoorOpen size={24} className="text-warning" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Gate Pass Management</h6>
                                        <small className="text-muted">
                                            {pendingCount > 0
                                                ? `${pendingCount} pending request${pendingCount > 1 ? "s" : ""} to review`
                                                : "No pending requests"}
                                        </small>
                                    </div>
                                </div>
                                <Link to="/gate-requests" className="btn btn-warning btn-sm px-3 text-dark fw-semibold">
                                    Review Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm stat-card">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-dark bg-opacity-10 p-3 rounded-circle">
                                            <FaMoon size={20} className="text-warning" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-0">Nightly Attendance Monitoring</h6>
                                            <small className="text-muted">
                                                {nightlyCheckedCount} of {nightlyTotalCount} students checked in
                                            </small>
                                        </div>
                                    </div>
                                    <button className="btn btn-dark btn-sm px-3 fw-semibold"
                                        onClick={() => setShowNightModal(true)}>
                                        Monitor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                                    <FaDoorOpen size={20} className="text-info" />
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Recent Gate Requests</h6>
                                    <small className="text-muted">Latest going out / coming in requests</small>
                                </div>
                            </div>
                            <Link to="/gate-requests" className="btn btn-outline-primary btn-sm">
                                View All
                            </Link>
                        </div>

                        {recentRequests.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaDoorOpen size={40} className="mb-2" />
                                <p className="mb-0">No recent gate requests</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Approved By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentRequests.map((req) => (
                                            <tr key={req.id}>
                                                <td className="fw-semibold text-nowrap">{req.fullname}</td>
                                                <td>
                                                    {req.request_type === "out" ? (
                                                        <span className="badge bg-danger">
                                                            <FaSignOutAlt className="me-1" /> Going Out
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-success">
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
                                                                className="text-decoration-none small">
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
                                                        <span className="text-muted small">N/A</span>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showMap && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title"><FaMapMarkerAlt className="me-2" />{showMap.name}'s Location</h6>
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
                                    <FaMapMarkerAlt className="me-1" />
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

            {showNightModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-dark text-white py-2">
                                <h6 className="modal-title"><FaMoon className="me-2" />Nightly Attendance - {nightlyDate}</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNightModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0 small">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>ID</th>
                                                <th>Program</th>
                                                <th>Status</th>
                                                <th>Checked At</th>
                                                <th>Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nightlyStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center text-muted py-4">No students found</td>
                                                </tr>
                                            ) : (
                                                nightlyStudents.map((s) => (
                                                    <tr key={s.id}>
                                                        <td className="fw-semibold text-nowrap">{s.fullname}</td>
                                                        <td>{s.student_id}</td>
                                                        <td>{s.program} {s.year_section ? `- ${s.year_section}` : ""}</td>
                                                        <td>
                                                            {s.status === "checked_in" ? (
                                                                <span className="badge bg-success"><FaCheckCircle className="me-1" />Checked In</span>
                                                            ) : (
                                                                <span className="badge bg-secondary"><FaHourglassHalf className="me-1" />Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="text-nowrap">
                                                            {s.checked_at ? formatDate(s.checked_at) : <span className="text-muted">---</span>}
                                                        </td>
                                                        <td>
                                                            {s.location_lat && s.location_lng ? (
                                                                <a href={`https://www.google.com/maps?q=${s.location_lat},${s.location_lng}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    className="text-decoration-none small">
                                                                    <FaMapMarkerAlt className="text-danger me-1" />
                                                                    {parseFloat(s.location_lat).toFixed(4)}, {parseFloat(s.location_lng).toFixed(4)}
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted small">---</span>
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
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Dashboard;
