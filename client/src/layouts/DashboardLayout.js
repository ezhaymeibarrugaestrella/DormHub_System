import React, { useState, useEffect } from "react";
import Sidebar, { EXPANDED, COLLAPSED_DARK, COLLAPSED_LIGHT, EXPANDED_WIDTH, COLLAPSED_WIDTH } from "../components/Sidebar";
import {
    FaUserShield,
    FaUserGraduate,
    FaDoorOpen,
    FaSun,
    FaMoon
} from "react-icons/fa";

function DashboardLayout({ children }) {
    const [user, setUser] = useState({ role: "student", fullname: "User" });
    const [sidebarMode, setSidebarMode] = useState(() => {
        return localStorage.getItem("sidebarMode") || EXPANDED;
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("dashboardTheme") || "dark";
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        setUser(userData);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebarMode", sidebarMode);
    }, [sidebarMode]);

    useEffect(() => {
        localStorage.setItem("dashboardTheme", theme);
    }, [theme]);

    const isAdmin = user.role === "superadmin" || user.role === "staff";
    const isExpanded = sidebarMode === EXPANDED;
    const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
    const isDark = theme === "dark";

    const handleToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarMode((prev) => {
                if (prev === EXPANDED) return COLLAPSED_DARK;
                if (prev === COLLAPSED_DARK) return COLLAPSED_LIGHT;
                return EXPANDED;
            });
        }
    };

    const contentBg = isDark ? "#1a1d21" : "#f4f6f9";
    const cardBg = isDark ? "#2c2f33" : "#ffffff";
    const textColor = isDark ? "#e9ecef" : "#212529";
    const mutedColor = isDark ? "#adb5bd" : "#6c757d";

    return (
        <div className="d-flex" data-bs-theme={isDark ? "dark" : "light"}>
            <Sidebar
                mode={sidebarMode}
                theme={theme}
                onToggle={handleToggle}
                mobileOpen={mobileOpen}
            />

            <div style={{
                marginLeft: isMobile ? 0 : sidebarWidth,
                width: "100%",
                background: contentBg,
                color: textColor,
                minHeight: "100vh",
                padding: isMobile ? "60px 12px 12px" : "20px",
                transition: "margin-left 0.25s ease, background 0.25s ease"
            }}>
                <div className="card border-0 shadow-sm mb-4" style={{ background: cardBg }}>
                    <div className="card-body d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className={`p-2 rounded-3 ${isAdmin ? "bg-primary bg-opacity-10" : "bg-success bg-opacity-10"}`}>
                                {isAdmin
                                    ? <FaUserShield size={20} className="text-primary" />
                                    : <FaUserGraduate size={20} className="text-success" />
                                }
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold" style={{ fontSize: isExpanded && !isMobile ? "1.25rem" : "1rem", color: textColor }}>
                                    {isAdmin ? "DormHub Management System" : "Student Portal"}
                                </h5>
                                <small style={{ color: mutedColor }}>
                                    {isAdmin ? "Administrator Panel" : "Welcome, Student"}
                                </small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button onClick={() => setTheme(isDark ? "light" : "dark")}
                                style={{
                                    width: "36px", height: "36px", borderRadius: "8px",
                                    border: "none", background: "transparent",
                                    color: mutedColor, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "16px"
                                }}
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                                {isDark ? <FaSun /> : <FaMoon />}
                            </button>

                            {user.fingerprint_registered && (
                                <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1 px-3 py-2">
                                    <FaDoorOpen />
                                    Biometric Active
                                </span>
                            )}
                            <div className="text-end d-none d-sm-block">
                                <div className="fw-semibold small" style={{ color: textColor }}>
                                    {user.fullname || (isAdmin ? "Super Admin" : "Student")}
                                </div>
                                <small style={{ color: mutedColor }} className="text-capitalize">
                                    {user.role || "user"}
                                </small>
                            </div>
                            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold`}
                                style={{
                                    width: "40px", height: "40px",
                                    background: isAdmin
                                        ? "linear-gradient(135deg, #0d6efd, #0a58ca)"
                                        : "linear-gradient(135deg, #198754, #157347)"
                                }}>
                                {(user.fullname || "U").charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

export default DashboardLayout;
