import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaFileAlt,
    FaClipboardCheck,
    FaExclamationTriangle,
    FaDoorOpen,
    FaCalendarAlt,
    FaUsers,
    FaSyncAlt,
    FaCheckCircle,
    FaHourglassHalf,
    FaSearch,
    FaArrowRight,
    FaArrowLeft,
    FaPrint
} from "react-icons/fa";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#ffc107", "#198754", "#dc3545"];

function Reports() {
    const [reportType, setReportType] = useState("summary");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [summary, setSummary] = useState(null);
    const [data, setData] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    useEffect(() => {
        fetchSummary();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (reportType !== "summary" && reportType !== "students" && reportType !== "monthly") {
            fetchReport();
        }
    }, [reportType]);

    const fetchSummary = async () => {
        try {
            const params = {};
            if (startDate && endDate) { params.start = startDate; params.end = endDate; }
            const res = await API.get("/reports/summary", { params });
            setSummary(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchStudents = async () => {
        try {
            const res = await API.get("/reports/students");
            setStudents(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate && endDate) { params.start = startDate; params.end = endDate; }
            const endpoints = {
                attendance: "/reports/attendance",
                demerits: "/reports/demerits",
                "gate-requests": "/reports/gate-requests",
                monthly: "/reports/monthly"
            };
            if (reportType === "monthly") {
                params.month = month;
            }
            const res = await API.get(endpoints[reportType], { params });
            setData(res.data);
        } catch (err) { console.log(err); }
        finally { setLoading(false); }
    };

    const handleFilter = () => {
        if (reportType === "summary") fetchSummary();
        else fetchReport();
    };

    const handlePrint = () => {
        window.print();
    };

    const pieData = summary ? [
        { name: "Pending", value: summary.pendingRequests },
        { name: "Approved", value: summary.approvedRequests },
        { name: "Total", value: summary.totalGateRequests - summary.pendingRequests - summary.approvedRequests }
    ].filter(d => d.value > 0) : [];

    return (
        <>
        <style>{`
            @media print {
                body * { visibility: hidden; }
                .print-container, .print-container * { visibility: visible; }
                .print-container { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print, .sidebar, .navbar, footer, .btn, .btn * { display: none !important; }
                .card { box-shadow: none !important; border: 1px solid #ddd !important; }
                .badge { border: 1px solid #999 !important; color: #000 !important; background: #f5f5f5 !important; }
                .print-container .card { break-inside: avoid; }
                .print-container table { font-size: 12px; }
                .print-container th, .print-container td { padding: 6px 8px !important; }
            }
            @media screen {
                .print-only { display: none; }
            }
        `}</style>
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1"><FaFileAlt className="me-2" />Reports</h4>
                        <p className="text-muted mb-0">View and export system reports</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary btn-sm" onClick={handleFilter} disabled={loading}>
                            <FaSyncAlt className={`me-1 ${loading ? "fa-spin" : ""}`} /> Generate
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>
                            <FaPrint className="me-1" /> Print / PDF
                        </button>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-3">
                        <div className="row g-2 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label small fw-semibold"><FaCalendarAlt className="me-1" />Report Type</label>
                                    <select className="form-select form-select-sm" value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}>
                                        <option value="summary">Summary Overview</option>
                                        <option value="monthly">Monthly Monitor</option>
                                        <option value="attendance">Attendance Report</option>
                                        <option value="demerits">Demerit Report</option>
                                        <option value="gate-requests">Gate Request Report</option>
                                        <option value="students">Student Report</option>
                                    </select>
                            </div>
                            {reportType === "monthly" ? (
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold"><FaCalendarAlt className="me-1" />Month</label>
                                    <input type="month" className="form-control form-control-sm"
                                        value={month} onChange={(e) => setMonth(e.target.value)} />
                                </div>
                            ) : (
                                <>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">Start Date</label>
                                        <input type="date" className="form-control form-control-sm"
                                            value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">End Date</label>
                                        <input type="date" className="form-control form-control-sm"
                                            value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                </>
                            )}
                            <div className="col-md-3">
                                <button className="btn btn-primary btn-sm w-100" onClick={handleFilter}>
                                    <FaSearch className="me-1" /> Apply Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {reportType === "summary" && summary && (
                    <div className="print-container">
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-primary bg-opacity-10 text-center p-3 stat-card">
                                    <FaClipboardCheck size={24} className="text-primary mb-1 mx-auto" />
                                    <h3 className="fw-bold text-primary mb-0">{summary.totalAttendance}</h3>
                                    <small className="text-muted">Attendance</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-danger bg-opacity-10 text-center p-3 stat-card">
                                    <FaExclamationTriangle size={24} className="text-danger mb-1 mx-auto" />
                                    <h3 className="fw-bold text-danger mb-0">{summary.totalDemerits}</h3>
                                    <small className="text-muted">Demerits</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-warning bg-opacity-10 text-center p-3 stat-card">
                                    <FaHourglassHalf size={24} className="text-warning mb-1 mx-auto" />
                                    <h3 className="fw-bold text-warning mb-0">{summary.pendingRequests}</h3>
                                    <small className="text-muted">Pending Requests</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-success bg-opacity-10 text-center p-3 stat-card">
                                    <FaCheckCircle size={24} className="text-success mb-1 mx-auto" />
                                    <h3 className="fw-bold text-success mb-0">{summary.approvedRequests}</h3>
                                    <small className="text-muted">Approved Requests</small>
                                </div>
                            </div>
                        </div>
                        <div className="row g-4">
                            <div className="col-md-8">
                                <div className="card border-0 shadow-sm p-3">
                                    <h6 className="fw-bold mb-3"><FaDoorOpen className="me-2" />Gate Request Overview</h6>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={[
                                            { name: "Pending", count: summary.pendingRequests },
                                            { name: "Approved", count: summary.approvedRequests },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="card border-0 shadow-sm p-3">
                                    <h6 className="fw-bold mb-3">Distribution</h6>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                                dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === "students" && (
                    <div className="card border-0 shadow-sm print-container">
                        <div className="card-body p-3 p-md-4">
                            <h6 className="fw-bold mb-3"><FaUsers className="me-2" />Student Performance Report</h6>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student</th>
                                            <th>ID</th>
                                            <th>Program</th>
                                            <th>Attendance</th>
                                            <th>Demerits</th>
                                            <th>Points</th>
                                            <th>Gate Requests</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center text-muted py-4">No data</td></tr>
                                        ) : students.map((s) => (
                                            <tr key={s.id}>
                                                <td className="fw-semibold">{s.fullname}</td>
                                                <td>{s.student_id}</td>
                                                <td>{s.program || "N/A"}</td>
                                                <td><span className="badge bg-info">{s.total_attendance}</span></td>
                                                <td><span className={`badge ${s.total_demerits > 0 ? "bg-danger" : "bg-success"}`}>{s.total_demerits}</span></td>
                                                <td><span className="badge bg-warning text-dark">{s.total_points}</span></td>
                                                <td><span className="badge bg-secondary">{s.total_gate_requests}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === "monthly" && (
                    <div className="card border-0 shadow-sm print-container">
                        <div className="card-body p-3 p-md-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">
                                    <FaExclamationTriangle className="me-2" />Monthly Monitor — {month}
                                </h6>
                            </div>
                            <p className="text-muted small mb-3">
                                Demerit points and approved gate pass counts per student
                            </p>
                            {loading ? (
                                <div className="text-center py-4"><span className="spinner-border" /></div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>ID</th>
                                                <th>Program</th>
                                                <th><FaExclamationTriangle className="text-danger me-1" />Demerit Points</th>
                                                <th><FaArrowRight className="text-danger me-1" />Going Out</th>
                                                <th><FaArrowLeft className="text-success me-1" />Coming In</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center text-muted py-4">No records for this month</td></tr>
                                            ) : data.map((s) => (
                                                <tr key={s.id}>
                                                    <td className="fw-semibold">{s.fullname}</td>
                                                    <td>{s.student_id}</td>
                                                    <td>{s.program || "N/A"}</td>
                                                    <td>
                                                        <span className={`badge ${s.total_demerit_points > 5 ? "bg-danger" : s.total_demerit_points > 0 ? "bg-warning text-dark" : "bg-success"}`}>
                                                            {s.total_demerit_points}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${s.total_going_out > 0 ? "bg-danger" : "bg-secondary"}`}>
                                                            {s.total_going_out}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${s.total_coming_in > 0 ? "bg-success" : "bg-secondary"}`}>
                                                            {s.total_coming_in}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(reportType === "attendance" || reportType === "demerits" || reportType === "gate-requests") && (
                    <div className="card border-0 shadow-sm print-container">
                        <div className="card-body p-3 p-md-4">
                            <h6 className="fw-bold mb-3 text-capitalize">
                                {reportType === "gate-requests" ? "Gate Request" : reportType} Report
                            </h6>
                            {loading ? (
                                <div className="text-center py-4"><span className="spinner-border" /></div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Student</th>
                                                <th>ID</th>
                                                {reportType === "gate-requests" && <th>Type</th>}
                                                <th>{reportType === "attendance" ? "Status" : reportType === "demerits" ? "Violation" : "Status"}</th>
                                                {reportType === "demerits" && <th>Points</th>}
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center text-muted py-4">No records found</td></tr>
                                            ) : data.map((row, i) => (
                                                <tr key={row.id || i}>
                                                    <td className="fw-semibold">{row.fullname}</td>
                                                    <td>{row.student_id}</td>
                                                    {reportType === "gate-requests" && (
                                                        <td><span className={`badge ${row.request_type === "out" ? "bg-danger" : "bg-success"}`}>{row.request_type === "out" ? "Going Out" : "Coming In"}</span></td>
                                                    )}
                                                    <td>
                                                        {reportType === "attendance" && <span className={`badge ${row.status === "present" ? "bg-success" : row.status === "late" ? "bg-warning" : "bg-danger"}`}>{row.status || "N/A"}</span>}
                                                        {reportType === "demerits" && row.violation}
                                                        {reportType === "gate-requests" && (
                                                            <span className={`badge ${row.status === "approved" ? "bg-success" : row.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}`}>{row.status}</span>
                                                        )}
                                                    </td>
                                                    {reportType === "demerits" && <td>{row.points || 1}</td>}
                                                    <td className="small">{new Date(row.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
        </>
    );
}

export default Reports;
