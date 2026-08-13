import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaClipboardCheck,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaUserGraduate,
    FaCalendarAlt,
    FaClock,
    FaSearch,
    FaPlus,
    FaEdit,
    FaExclamationTriangle,
    FaIdCard,
    FaCommentDots,
    FaMapMarkedAlt,
    FaMapMarkerAlt,
    FaExternalLinkAlt,
    FaMoon
} from "react-icons/fa";

function Attendance() {
    const [records, setRecords] = useState([]);
    const [todayRecords, setTodayRecords] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState("");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showAttendMap, setShowAttendMap] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [form, setForm] = useState({
        user_id: "",
        date: new Date().toISOString().split("T")[0],
        time_in: "",
        time_out: "",
        status: "present",
        remarks: ""
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [recordsRes, todayRes, studentsRes] = await Promise.all([
                API.get("/attendance"),
                API.get("/attendance/today"),
                API.get("/attendance/students")
            ]);
            setRecords(recordsRes.data);
            setTodayRecords(todayRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await API.post("/attendance", form);
            setShowModal(false);
            setForm({
                user_id: "",
                date: new Date().toISOString().split("T")[0],
                time_in: "",
                time_out: "",
                status: "present",
                remarks: ""
            });
            showMsg("success", "Attendance marked successfully");
            fetchAll();
        } catch (err) {
            showMsg("danger", err.response?.data?.message || "Failed to mark attendance");
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await API.put(`/attendance/${selected.id}`, {
                time_in: selected.time_in,
                time_out: selected.time_out,
                status: selected.status,
                remarks: selected.remarks
            });
            setEditModal(false);
            setSelected(null);
            showMsg("success", "Attendance updated successfully");
            fetchAll();
        } catch (err) {
            showMsg("danger", err.response?.data?.message || "Failed to update attendance");
        } finally {
            setProcessing(false);
        }
    };

    const openEdit = (record) => {
        setSelected({ ...record });
        setEditModal(true);
    };

    const formatTime = (t) => {
        if (!t) return "";
        const [h, m] = t.split(":");
        const hr = parseInt(h);
        const ampm = hr >= 12 ? "PM" : "AM";
        const hour12 = hr % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    const formatDate = (d) => {
        return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "present":
                return <span className="badge bg-success"><FaCheckCircle className="me-1" /> Present</span>;
            case "late":
                return <span className="badge bg-warning text-dark"><FaExclamationTriangle className="me-1" /> Late</span>;
            case "absent":
                return <span className="badge bg-danger"><FaTimesCircle className="me-1" /> Absent</span>;
            case "excused":
                return <span className="badge bg-info"><FaHourglassHalf className="me-1" /> Excused</span>;
            default:
                return <span className="badge bg-secondary">{status}</span>;
        }
    };

    const todayStats = {
        present: todayRecords.filter((r) => r.status === "present").length,
        late: todayRecords.filter((r) => r.status === "late").length,
        absent: todayRecords.filter((r) => r.status === "absent").length,
        total: todayRecords.length
    };

    const filteredRecords = records.filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (search) {
            const term = search.toLowerCase();
            return (
                r.fullname?.toLowerCase().includes(term) ||
                r.student_id?.toLowerCase().includes(term)
            );
        }
        return true;
    });

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1">
                            <FaClipboardCheck className="me-2 text-primary" />
                            Attendance Management
                        </h4>
                        <p className="text-muted mb-0 small">Track and manage student attendance</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <FaPlus className="me-1" /> Mark Attendance
                    </button>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type} py-2 small mb-3`}>{message.text}</div>
                )}

                <div className="row g-2 g-md-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-success bg-opacity-10 h-100 stat-card">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-success mb-0">{todayStats.present}</h5>
                                <small className="text-muted">Present Today</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100 stat-card">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-warning mb-0">{todayStats.late}</h5>
                                <small className="text-muted">Late Today</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-danger bg-opacity-10 h-100 stat-card">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-danger mb-0">{todayStats.absent}</h5>
                                <small className="text-muted">Absent Today</small>
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100 stat-card">
                            <div className="card-body text-center py-2 py-md-3">
                                <h5 className="fw-bold text-primary mb-0">{todayStats.total}</h5>
                                <small className="text-muted">Total Today</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-column flex-sm-row flex-wrap gap-3 mb-3">
                            <div className="d-flex gap-2 flex-wrap">
                                <div className="input-group input-group-sm" style={{ maxWidth: "200px" }}>
                                    <span className="input-group-text"><FaCalendarAlt /></span>
                                    <input type="date" className="form-control"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)} />
                                </div>
                                <div className="btn-group btn-group-sm">
                                    {["all", "present", "late", "absent", "excused"].map((f) => (
                                        <button key={f}
                                            className={`btn ${filterStatus === f ? "btn-primary" : "btn-outline-primary"}`}
                                            onClick={() => setFilterStatus(f)}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="ms-sm-auto">
                                <div className="input-group input-group-sm" style={{ minWidth: "200px" }}>
                                    <span className="input-group-text"><FaSearch /></span>
                                    <input type="text" className="form-control" placeholder="Search student..."
                                        value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <span className="spinner-border text-primary" />
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaClipboardCheck size={40} className="mb-2" />
                                <p className="mb-0">No attendance records found</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th><FaUserGraduate className="me-1" /> Student</th>
                                            <th><FaIdCard className="me-1" /> ID</th>
                                            <th><FaCalendarAlt className="me-1" /> Date</th>
                                            <th><FaClock className="me-1" /> Time In</th>
                                            <th><FaClock className="me-1" /> Time Out</th>
                                            <th><FaMapMarkedAlt className="me-1" /> Location</th>
                                            <th>Status</th>
                                            <th><FaCommentDots className="me-1" /> Remarks</th>
                                            <th>Marked By</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((r) => (
                                            <tr key={r.id}>
                                                <td className="fw-semibold text-nowrap">{r.fullname}</td>
                                                <td>{r.student_id}</td>
                                                <td className="text-nowrap">{formatDate(r.date)}</td>
                                                <td>{r.time_in ? formatTime(r.time_in) : <span className="text-muted">—</span>}</td>
                                                <td>{r.time_out ? formatTime(r.time_out) : <span className="text-muted">—</span>}</td>
                                                <td>
                                                    {r.location_lat && r.location_lng ? (
                                                        <button className="btn btn-sm btn-outline-info py-0 px-1"
                                                            title="View on Map"
                                                            onClick={() => setShowAttendMap({ lat: parseFloat(r.location_lat), lng: parseFloat(r.location_lng), name: r.fullname })}>
                                                            <FaMapMarkedAlt size={12} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                                <td>{getStatusBadge(r.status)}</td>
                                                <td className="small">{r.remarks || <span className="text-muted">—</span>}</td>
                                                <td className="small">{r.marked_by_name || <span className="text-muted">System</span>}</td>
                                                <td>
                                                    <button className="btn btn-outline-primary btn-sm py-0 px-2"
                                                        onClick={() => openEdit(r)}>
                                                        <FaEdit /> Edit
                                                    </button>
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

            {showModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title"><FaPlus className="me-2" />Mark Attendance</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleMarkAttendance}>
                                <div className="modal-body p-3">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Student</label>
                                        <select className="form-select form-select-sm"
                                            value={form.user_id} required
                                            onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                                            <option value="">Select Student</option>
                                            {students.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.fullname} ({s.student_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-semibold small">Date</label>
                                            <input type="date" className="form-control form-control-sm"
                                                value={form.date} required
                                                onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label fw-semibold small">Time In</label>
                                            <input type="time" className="form-control form-control-sm"
                                                value={form.time_in}
                                                onChange={(e) => setForm({ ...form, time_in: e.target.value })} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label fw-semibold small">Time Out</label>
                                            <input type="time" className="form-control form-control-sm"
                                                value={form.time_out}
                                                onChange={(e) => setForm({ ...form, time_out: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Status</label>
                                        <div className="d-flex gap-2">
                                            {["present", "late", "absent", "excused"].map((s) => (
                                                <div key={s} className="form-check form-check-inline">
                                                    <input className="form-check-input" type="radio"
                                                        id={`status-${s}`} value={s}
                                                        checked={form.status === s}
                                                        onChange={(e) => setForm({ ...form, status: e.target.value })} />
                                                    <label className="form-check-label small" htmlFor={`status-${s}`}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label fw-semibold small">Remarks <span className="text-muted fw-normal">(optional)</span></label>
                                        <textarea className="form-control form-control-sm" rows="2"
                                            value={form.remarks}
                                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                            placeholder="Optional remarks..." />
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-sm btn-secondary"
                                        onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-primary px-3"
                                        disabled={processing}>
                                        {processing ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheckCircle className="me-1" />}
                                        Mark Attendance
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {editModal && selected && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-info text-white py-2">
                                <h6 className="modal-title"><FaEdit className="me-2" />Edit Attendance</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => { setEditModal(false); setSelected(null); }}></button>
                            </div>
                            <form onSubmit={handleUpdate}>
                                <div className="modal-body p-3">
                                    <div className="p-2 bg-light rounded small mb-3">
                                        <strong>{selected.fullname}</strong> — {formatDate(selected.date)}
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-semibold small">Time In</label>
                                            <input type="time" className="form-control form-control-sm"
                                                value={selected.time_in || ""}
                                                onChange={(e) => setSelected({ ...selected, time_in: e.target.value })} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold small">Time Out</label>
                                            <input type="time" className="form-control form-control-sm"
                                                value={selected.time_out || ""}
                                                onChange={(e) => setSelected({ ...selected, time_out: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Status</label>
                                        <select className="form-select form-select-sm"
                                            value={selected.status}
                                            onChange={(e) => setSelected({ ...selected, status: e.target.value })}>
                                            <option value="present">Present</option>
                                            <option value="late">Late</option>
                                            <option value="absent">Absent</option>
                                            <option value="excused">Excused</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label fw-semibold small">Remarks</label>
                                        <textarea className="form-control form-control-sm" rows="2"
                                            value={selected.remarks || ""}
                                            onChange={(e) => setSelected({ ...selected, remarks: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-sm btn-secondary"
                                        onClick={() => { setEditModal(false); setSelected(null); }}>Cancel</button>
                                    <button type="submit" className="btn btn-sm btn-info text-white px-3"
                                        disabled={processing}>
                                        {processing ? <span className="spinner-border spinner-border-sm me-1" /> : <FaCheckCircle className="me-1" />}
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showAttendMap && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-primary text-white py-2">
                                <h6 className="modal-title"><FaMapMarkedAlt className="me-2" />{showAttendMap.name}'s Location</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAttendMap(null)}></button>
                            </div>
                            <div className="modal-body p-0">
                                <div className="map-modal-container">
                                    <iframe
                                        title="Attend Location Map"
                                        src={`https://maps.google.com/maps?q=${showAttendMap.lat},${showAttendMap.lng}&z=16&output=embed`}
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
                                    {showAttendMap.lat.toFixed(6)}, {showAttendMap.lng.toFixed(6)}
                                </span>
                                <a href={`https://www.google.com/maps?q=${showAttendMap.lat},${showAttendMap.lng}`}
                                    target="_blank" rel="noreferrer"
                                    className="btn btn-primary btn-sm">
                                    <FaExternalLinkAlt className="me-2" />Open in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Attendance;
