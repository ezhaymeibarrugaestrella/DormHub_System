import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaExclamationTriangle,
    FaChartBar,
    FaCalendarAlt,
    FaShieldAlt,
    FaUser,
    FaArrowLeft,
    FaClipboardList
} from "react-icons/fa";

function StudentDemerits() {
    const [user, setUser] = useState(null);
    const [demerits, setDemerits] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [demeritsRes, summaryRes] = await Promise.all([
                API.get("/demerits/my"),
                API.get("/demerits/my/summary")
            ]);
            setDemerits(demeritsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Critical": return "bg-danger";
            case "High Risk": return "bg-warning text-dark";
            case "Warning": return "bg-info";
            default: return "bg-success";
        }
    };

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">

                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate("/student-dashboard")}>
                            <FaArrowLeft className="me-1" /> Back to Dashboard
                        </button>
                        <h4 className="fw-bold mb-1">
                            <FaExclamationTriangle className="me-2 text-danger" />
                            My Demerits
                        </h4>
                        <p className="text-muted mb-0 small">
                            View your recorded violations, demerit points, and history
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <span className="spinner-border spinner-border-sm" />
                        <p className="text-muted mt-2 small">Loading demerits...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-danger bg-opacity-10 text-center p-3 stat-card">
                                    <FaExclamationTriangle size={22} className="text-danger mb-1 mx-auto" />
                                    <h3 className="fw-bold text-danger mb-0">{summary?.total_demerits || 0}</h3>
                                    <small className="text-muted">Total Demerits</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-primary bg-opacity-10 text-center p-3 stat-card">
                                    <FaChartBar size={22} className="text-primary mb-1 mx-auto" />
                                    <h3 className="fw-bold text-primary mb-0">{summary?.total_points || 0}</h3>
                                    <small className="text-muted">Total Points</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-warning bg-opacity-10 text-center p-3 stat-card">
                                    <FaCalendarAlt size={22} className="text-warning mb-1 mx-auto" />
                                    <h3 className="fw-bold text-warning mb-0" style={{ fontSize: summary?.latest_date ? "0.95rem" : "1.5rem" }}>
                                        {summary?.latest_date ? formatDate(summary.latest_date) : "N/A"}
                                    </h3>
                                    <small className="text-muted">Latest Demerit</small>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card border-0 shadow-sm bg-info bg-opacity-10 text-center p-3 stat-card">
                                    <FaShieldAlt size={22} className="text-info mb-1 mx-auto" />
                                    <h3 className="fw-bold text-info mb-0" style={{ fontSize: "0.95rem" }}>
                                        {summary?.status || "Good Standing"}
                                    </h3>
                                    <small className="text-muted">Status</small>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-3 p-md-4">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                                        <FaClipboardList size={20} className="text-danger" />
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-0">Demerit Records</h6>
                                        <small className="text-muted">Your violation history</small>
                                    </div>
                                </div>

                                {demerits.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FaShieldAlt size={48} className="text-success mb-3" />
                                        <h5 className="fw-bold text-success">No Demerits</h5>
                                        <p className="text-muted mb-0">You currently have no recorded demerits.</p>
                                        <small className="text-muted">Keep up the good work!</small>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0 small">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Violation</th>
                                                    <th>Points</th>
                                                    <th>Room</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {demerits.map((d) => (
                                                    <tr key={d.id}>
                                                        <td className="text-nowrap">{formatDate(d.created_at)}</td>
                                                        <td className="text-wrap">{d.violation}</td>
                                                        <td><span className="badge bg-danger">{d.points}</span></td>
                                                        <td>{d.room_number || "N/A"}</td>
                                                        <td>
                                                            <span className={`badge ${getStatusBadgeClass(summary?.status || "Good Standing")}`}>
                                                                {summary?.status || "Good Standing"}
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

export default StudentDemerits;
