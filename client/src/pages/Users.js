import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import {
    FaUsers, FaSyncAlt, FaUserShield, FaUserGraduate, FaSearch,
    FaEdit, FaTrash, FaTimes
} from "react-icons/fa";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState({ role: "" });

    const [editModal, setEditModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUser(u);
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get("/users");
            setUsers(res.data || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = users.filter((u) =>
        !search ||
        u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id?.toLowerCase().includes(search.toLowerCase())
    );

    const isSuperadmin = currentUser.role === "superadmin";

    const openEdit = (u) => {
        setEditUser(u);
        setEditForm({
            fullname: u.fullname || "",
            email: u.email || "",
            role: u.role || "student",
            program: u.program || "",
            year_section: u.year_section || "",
            room_number: u.room_number || "",
            status: u.status || "active",
            password: ""
        });
        setEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const submitEdit = async () => {
        try {
            const payload = { ...editForm };
            if (!payload.password) delete payload.password;
            await API.put(`/users/${editUser.id}`, payload);
            setEditModal(false);
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            console.log(err);
        }
    };

    const confirmDelete = (u) => {
        setDeleteUser(u);
        setDeleteModal(true);
    };

    const submitDelete = async () => {
        try {
            await API.delete(`/users/${deleteUser.id}`);
            setDeleteModal(false);
            setDeleteUser(null);
            fetchUsers();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <DashboardLayout>
            <div className="container-fluid px-2 px-sm-3 px-md-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-2">
                    <div>
                        <h4 className="fw-bold mb-1"><FaUsers className="me-2 text-primary" />User Management</h4>
                        <p className="text-muted mb-0 small">View and manage all registered users</p>
                    </div>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchUsers} disabled={loading}>
                        <FaSyncAlt className={`me-1 ${loading ? "fa-spin" : ""}`} /> Refresh
                    </button>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
                            <h6 className="fw-bold mb-0"><FaUsers className="me-2 text-primary" />All Users</h6>
                            <div className="input-group input-group-sm" style={{ maxWidth: "250px", width: "100%" }}>
                                <span className="input-group-text"><FaSearch /></span>
                                <input type="text" className="form-control" placeholder="Search by name or ID..."
                                    value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 small">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th>Room</th>
                                        <th>Program</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        {isSuperadmin && <th className="text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={isSuperadmin ? "7" : "6"} className="text-center py-4"><span className="spinner-border spinner-border-sm" /></td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={isSuperadmin ? "7" : "6"} className="text-center text-muted py-4">No users found</td></tr>
                                    ) : (
                                        filtered.map((u) => (
                                            <tr key={u.id}>
                                                <td className="fw-semibold text-nowrap">{u.fullname}</td>
                                                <td>{u.student_id || <span className="text-muted">---</span>}</td>
                                                <td className="text-wrap">{u.room_number || <span className="text-muted">N/A</span>}</td>
                                                <td>{u.program || <span className="text-muted">N/A</span>}</td>
                                                <td>
                                                    {u.role === "superadmin" ? (
                                                        <span className="badge bg-danger"><FaUserShield className="me-1" />Superadmin</span>
                                                    ) : u.role === "staff" ? (
                                                        <span className="badge bg-primary"><FaUserShield className="me-1" />Staff</span>
                                                    ) : (
                                                        <span className="badge bg-success"><FaUserGraduate className="me-1" />Student</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {u.registration_status === "approved" ? (
                                                        <span className="badge bg-success">Approved</span>
                                                    ) : u.registration_status === "rejected" ? (
                                                        <span className="badge bg-danger">Rejected</span>
                                                    ) : u.registration_status === "pending" ? (
                                                        <span className="badge bg-warning text-dark">Pending</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">{u.status || "Active"}</span>
                                                    )}
                                                </td>
                                                {isSuperadmin && (
                                                    <td className="text-center">
                                                        <button className="btn btn-sm btn-outline-primary me-1" title="Edit"
                                                            onClick={() => openEdit(u)}>
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" title="Delete"
                                                            onClick={() => confirmDelete(u)}
                                                            disabled={u.role === "superadmin"}>
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {editModal && (
                <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title fw-bold"><FaEdit className="me-2" />Edit User</h6>
                                <button className="btn-close" onClick={() => setEditModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold">Full Name</label>
                                    <input className="form-control form-control-sm" name="fullname"
                                        value={editForm.fullname} onChange={handleEditChange} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold">Email</label>
                                    <input className="form-control form-control-sm" name="email" type="email"
                                        value={editForm.email} onChange={handleEditChange} />
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold">Role</label>
                                        <select className="form-select form-select-sm" name="role"
                                            value={editForm.role} onChange={handleEditChange}>
                                            <option value="student">Student</option>
                                            <option value="staff">Staff</option>
                                            <option value="superadmin">Superadmin</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold">Status</label>
                                        <select className="form-select form-select-sm" name="status"
                                            value={editForm.status} onChange={handleEditChange}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold">Program</label>
                                        <input className="form-control form-control-sm" name="program"
                                            value={editForm.program} onChange={handleEditChange} />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold">Year/Section</label>
                                        <input className="form-control form-control-sm" name="year_section"
                                            value={editForm.year_section} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold">Room Number</label>
                                    <input className="form-control form-control-sm" name="room_number"
                                        value={editForm.room_number} onChange={handleEditChange} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold">
                                        New Password <span className="text-muted">(leave blank to keep current)</span>
                                    </label>
                                    <input className="form-control form-control-sm" name="password" type="password"
                                        value={editForm.password} onChange={handleEditChange} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
                                <button className="btn btn-sm btn-primary" onClick={submitEdit}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title fw-bold text-danger"><FaTrash className="me-2" />Delete User</h6>
                                <button className="btn-close" onClick={() => setDeleteModal(false)} />
                            </div>
                            <div className="modal-body text-center py-4">
                                <p className="mb-0">Are you sure you want to delete <strong>{deleteUser?.fullname}</strong>?</p>
                                <small className="text-muted">This action cannot be undone.</small>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-sm btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
                                <button className="btn btn-sm btn-danger" onClick={submitDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Users;
