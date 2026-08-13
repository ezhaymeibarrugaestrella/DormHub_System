import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FaTachometerAlt,
    FaUsers,
    FaClipboardCheck,
    FaExclamationTriangle,
    FaFileAlt,
    FaCog,
    FaSignOutAlt,
    FaDoorOpen,
    FaUserGraduate,
    FaUserCheck,
    FaChevronLeft,
    FaSun,
    FaMoon,
    FaBars,
    FaTimes
} from "react-icons/fa";

const EXPANDED = "expanded";
const COLLAPSED_DARK = "collapsed-dark";
const COLLAPSED_LIGHT = "collapsed-light";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

function Sidebar({ mode, theme, onToggle, mobileOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState({ role: "student" });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    }, []);

    const isAdmin = user.role === "superadmin" || user.role === "staff";
    const isExpanded = mode === EXPANDED;
    const isLightMode = theme === "light";
    const isCollapsed = !isExpanded;
    const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const adminMenu = [
        { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
        { name: "Student Approvals", icon: <FaUserCheck />, path: "/student-approvals" },
        { name: "Gate Requests", icon: <FaDoorOpen />, path: "/gate-requests" },
        { name: "Attendance", icon: <FaClipboardCheck />, path: "/attendance" },
        { name: "Users", icon: <FaUsers />, path: "/users" },
        { name: "Demerits", icon: <FaExclamationTriangle />, path: "/demerits" },
        { name: "Reports", icon: <FaFileAlt />, path: "/reports" },
        { name: "Settings", icon: <FaCog />, path: "/settings" }
    ];

    const menu = adminMenu;

    const sidebarBg = isLightMode ? "#f0f2f5" : "#081028";
    const sidebarText = isLightMode ? "#212529" : "#fff";
    const sidebarMuted = isLightMode ? "#6c757d" : "rgba(255,255,255,0.5)";
    const sidebarHover = isLightMode ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)";
    const sidebarBorder = isLightMode ? "#dee2e6" : "rgba(255,255,255,0.1)";

    if (isMobile) {
        return (
            <>
                <button className="btn btn-dark position-fixed d-flex align-items-center justify-content-center"
                    style={{
                        top: "10px", left: "10px", zIndex: 1060,
                        width: "40px", height: "40px", borderRadius: "8px", padding: 0,
                        border: "none"
                    }}
                    onClick={onToggle}>
                    {mobileOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
                </button>

                {mobileOpen && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.5)", zIndex: 1045
                    }} onClick={onToggle} />
                )}

                <div className="sidebar-mobile" style={{
                    position: "fixed", top: 0, left: 0, bottom: 0,
                    width: 260,
                    background: isLightMode ? "#f0f2f5" : "#081028",
                    color: sidebarText,
                    zIndex: 1050,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
                    transition: "transform 0.25s ease"
                }}>
                    <div className="text-center mb-4">
                        <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                            style={{ width: "50px", height: "50px" }}>
                            {isAdmin
                                ? <FaUsers size={24} className="text-primary" />
                                : <FaUserGraduate size={24} className="text-primary" />
                            }
                        </div>
                        <h6 className="fw-bold mb-0" style={{ color: sidebarText }}>DormHub</h6>
                        <small style={{ color: sidebarMuted }}>
                            {isAdmin ? "Administrator" : "Student Portal"}
                        </small>
                    </div>

                    <ul className="list-unstyled flex-grow-1">
                        {menu.map((item, index) => (
                            <li key={index} className="mb-2">
                                <Link to={item.path}
                                    className="d-flex align-items-center gap-3 text-decoration-none p-3 rounded"
                                    style={{
                                        color: location.pathname === item.path ? "#fff" : sidebarText,
                                        background: location.pathname === item.path ? "#0d6efd" : "transparent"
                                    }}>
                                    {item.icon}
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="pt-3" style={{ borderTop: `1px solid ${sidebarBorder}` }}>
                        <div className="d-flex align-items-center gap-2 mb-3 px-2">
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#198754" }} />
                            <small style={{ color: sidebarMuted }}>{user.fullname || "User"}</small>
                        </div>
                        <button onClick={logout}
                            className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2">
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: sidebarWidth,
            background: sidebarBg,
            color: sidebarText,
            zIndex: 1050,
            padding: isExpanded ? "20px" : "12px 8px",
            display: "flex",
            flexDirection: "column",
            transition: "width 0.25s ease, background 0.25s ease, padding 0.25s ease",
            overflow: "hidden"
        }}>
            <div className={`d-flex align-items-center ${isExpanded ? "justify-content-between mb-4" : "justify-content-center mb-3"}`}>
                {isExpanded && (
                    <div className="text-center flex-grow-1">
                        <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1"
                            style={{ width: "42px", height: "42px" }}>
                            {isAdmin ? <FaUsers size={20} className="text-primary" /> : <FaUserGraduate size={20} className="text-primary" />}
                        </div>
                        <h6 className="fw-bold mb-0" style={{ fontSize: "14px", color: sidebarText }}>DormHub</h6>
                        <small style={{ fontSize: "10px", color: sidebarMuted }}>
                            {isAdmin ? "Administrator" : "Student Portal"}
                        </small>
                    </div>
                )}
                {isCollapsed && (
                    <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "36px", height: "36px" }}>
                        {isAdmin ? <FaUsers size={16} className="text-primary" /> : <FaUserGraduate size={16} className="text-primary" />}
                    </div>
                )}
                <button onClick={onToggle}
                    style={{
                        width: isExpanded ? "24px" : "28px",
                        height: "24px",
                        borderRadius: "4px",
                        color: sidebarText,
                        background: "transparent",
                        border: "none",
                        flexShrink: 0,
                        position: isExpanded ? "static" : "absolute",
                        bottom: isCollapsed ? "80px" : "auto",
                        left: isCollapsed ? "50%" : "auto",
                        transform: isCollapsed ? "translateX(-50%)" : "none",
                        opacity: 0.7,
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    title={isExpanded ? "Collapse" : isLightMode ? "Switch to dark collapsed" : "Switch to light collapsed"}>
                    {isExpanded ? <FaChevronLeft size={12} /> : isLightMode ? <FaMoon size={14} /> : <FaSun size={14} />}
                </button>
            </div>

            <ul className="list-unstyled flex-grow-1" style={{ margin: 0, padding: 0 }}>
                {menu.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <li key={index} className="mb-1">
                            <Link to={item.path}
                                title={isCollapsed ? item.name : ""}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: isCollapsed ? "center" : "flex-start",
                                    gap: isExpanded ? "12px" : "0",
                                    textDecoration: "none",
                                    padding: isExpanded ? "10px 12px" : "10px 0",
                                    borderRadius: "8px",
                                    background: isActive ? "#0d6efd" : "transparent",
                                    color: isActive ? "#fff" : sidebarText,
                                    transition: "all 0.15s ease",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = sidebarHover; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                                {isExpanded && <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div style={{ borderTop: `1px solid ${sidebarBorder}`, paddingTop: "12px", marginTop: "auto" }}>
                {isExpanded && (
                    <div className="d-flex align-items-center gap-2 mb-2 px-1">
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#198754", flexShrink: 0 }} />
                        <small style={{ color: sidebarMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user.fullname || "User"}
                        </small>
                    </div>
                )}
                {isCollapsed && (
                    <div className="text-center mb-2">
                        <div style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #198754, #157347)",
                            color: "#fff", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "12px", fontWeight: "bold",
                            margin: "0 auto"
                        }} title={user.fullname || "User"}>
                            {(user.fullname || "U").charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
                <button onClick={logout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isExpanded ? "8px" : "0",
                        width: "100%",
                        padding: isExpanded ? "8px 12px" : "8px 0",
                        borderRadius: "8px",
                        border: "none",
                        background: "#dc3545",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#bb2d3b"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#dc3545"}>
                    <FaSignOutAlt size={14} />
                    {isExpanded && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}

export { EXPANDED, COLLAPSED_DARK, COLLAPSED_LIGHT, EXPANDED_WIDTH, COLLAPSED_WIDTH };
export default Sidebar;
