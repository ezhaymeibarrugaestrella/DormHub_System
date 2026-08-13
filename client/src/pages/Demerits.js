import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaExclamationTriangle,
    FaPlus,
    FaTrash,
    FaUsers,
    FaUser,
    FaGavel,
    FaChartBar,
    FaTimes,
    FaSyncAlt,
    FaSearch
} from "react-icons/fa";

function Demerits() {
    const [demerits, setDemerits] = useState([]);
    const [summary, setSummary] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ user_id: "", violation: "", points: 1 });
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchDemerits();
        fetchSummary();
        fetchUsers();
    }, []);

    const fetchDemerits = async () => {
        try {
            const res = await API.get("/demerits");
            setDemerits(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchSummary = async () => {
        try {
            const res = await API.get("/demerits/summary");
            setSummary(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchUsers = async () => {
        try {
            const res = await API.get("/student-registration");
            const allUsers = res.data || [];
            setUsers(allUsers);
        } catch (err) {
            try {
                const res = await API.get("/reports/students");
                setUsers(res.data || []);
            } catch (e) { console.log(e); }
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post("/demerits", form);
            setShowAdd(false);
            setForm({ user_id: "", violation: "", points: 1 });
            setMessage({ type: "success", text: "Demerit added" });
            fetchDemerits();
            fetchSummary();
        } catch (err) {
            setMessage({ type: "danger", text: err.response?.data?.message || "Failed" });
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this demerit?")) return;
        try {
            await API.delete(`/demerits/${id}`);
            fetchDemerits();
            fetchSummary();
        } catch (err) { console.log(err); }
    };

    const filtered = demerits.filter(d =>
        !search || d.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        d.violation?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1"><FaExclamationTriangle className="me-2 text-danger" />Demerits Management</h4>
                        <p className="text-muted mb-0">Track student violations and demerit points</p>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowAdd(true)}>
                        <FaPlus className="me-1" /> Add Demerit
                    </button>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible py-2`}>
                        {message.text}
                        <button type="button" className="btn-close py-2" onClick={() => setMessage({ type: "", text: "" })} />
                    </div>
                )}

                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-danger bg-opacity-10 text-center p-3 stat-card">
                            <FaExclamationTriangle size={22} className="text-danger mb-1 mx-auto" />
                            <h3 className="fw-bold text-danger mb-0">{demerits.length}</h3>
                            <small className="text-muted">Total Demerits</small>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-warning bg-opacity-10 text-center p-3 stat-card">
                            <FaUsers size={22} className="text-warning mb-1 mx-auto" />
                            <h3 className="fw-bold text-warning mb-0">{summary.filter(s => s.total_demerits > 0).length}</h3>
                            <small className="text-muted">Students w/ Demerits</small>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-primary bg-opacity-10 text-center p-3 stat-card">
                            <FaChartBar size={22} className="text-primary mb-1 mx-auto" />
                            <h3 className="fw-bold text-primary mb-0">{summary.reduce((sum, s) => sum + s.total_points, 0)}</h3>
                            <small className="text-muted">Total Points</small>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="card border-0 shadow-sm bg-info bg-opacity-10 text-center p-3 stat-card">
                            <FaGavel size={22} className="text-info mb-1 mx-auto" />
                            <h3 className="fw-bold text-info mb-0">{summary.filter(s => s.total_demerits > 3).length}</h3>
                            <small className="text-muted">High Risk (3+)</small>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                                    <h6 className="fw-bold mb-0"><FaExclamationTriangle className="me-2 text-danger" />Demerit Records</h6>
                                    <input type="text" className="form-control form-control-sm" style={{ maxWidth: "220px" }}
                                        placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0 small">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>ID</th>
                                                <th>Room</th>
                                                <th>Violation</th>
                                                <th>Points</th>
                                                <th>Date</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr><td colSpan="7" className="text-center text-muted py-4">No demerits found</td></tr>
                                            ) : filtered.map((d) => (
                                                <tr key={d.id}>
                                                    <td className="fw-semibold text-nowrap">{d.fullname}</td>
                                                    <td>{d.student_id}</td>
                                                    <td>{d.room_number || "N/A"}</td>
                                                    <td className="text-wrap">{d.violation}</td>
                                                    <td><span className="badge bg-danger">{d.points}</span></td>
                                                    <td className="small text-nowrap">{new Date(d.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-danger" title="Remove"
                                                            onClick={() => handleDelete(d.id)}>
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-3 p-md-4">
                                <h6 className="fw-bold mb-3"><FaChartBar className="me-2" />Student Summary</h6>
                                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                                    <table className="table table-sm align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>Count</th>
                                                <th>Points</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.filter(s => s.total_demerits > 0).slice(0, 20).map((s) => (
                                                <tr key={s.id}>
                                                    <td className="small">{s.fullname}</td>
                                                    <td><span className="badge bg-secondary">{s.total_demerits}</span></td>
                                                    <td><span className={`badge ${s.total_points > 5 ? "bg-danger" : s.total_points > 2 ? "bg-warning text-dark" : "bg-info"}`}>{s.total_points}</span></td>
                                                </tr>
                                            ))}
                                            {summary.filter(s => s.total_demerits > 0).length === 0 && (
                                                <tr><td colSpan="3" className="text-center text-muted py-3 small">No demerits recorded</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showAdd && (
                    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title"><FaGavel className="me-2" />Add Demerit</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowAdd(false)} />
                                </div>
                                <form onSubmit={handleAdd}>
                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold"><FaUser className="me-1" /> Student</label>
                                            <select className="form-select" value={form.user_id}
                                                onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
                                                <option value="">Select student</option>
                                                {users.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.fullname} ({u.student_id || u.email})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Violation</label>
                                            <textarea className="form-control" rows="2" placeholder="Describe the violation"
                                                value={form.violation}
                                                onChange={(e) => setForm({ ...form, violation: e.target.value })} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Points</label>
                                            <input type="number" className="form-control" min="1" max="10"
                                                value={form.points}
                                                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })} />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                                            <FaTimes className="me-1" /> Cancel
                                        </button>
                                        <button type="submit" className="btn btn-danger" disabled={loading}>
                                            {loading ? <span className="spinner-border spinner-border-sm me-1" /> : <FaPlus className="me-1" />}
                                            Add Demerit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default Demerits;
