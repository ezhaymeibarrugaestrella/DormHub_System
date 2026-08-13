import React from "react";
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Demerits from "./pages/Demerits";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import StudentRegistration from "./pages/StudentRegistration";
import StudentDashboard from "./pages/StudentDashboard";
import GateRequestManagement from "./pages/GateRequestManagement";
import StudentApprovals from "./pages/StudentApprovals";

import ProtectedRoute from "./components/ProtectedRoute";
import "./styles.css";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* LOGIN */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* DASHBOARD */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* STUDENT DASHBOARD */}
                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* STUDENT REGISTRATION */}
                <Route
                    path="/student-registration"
                    element={<StudentRegistration />}
                />

                {/* STUDENT APPROVALS (LANDLADY) */}
                <Route
                    path="/student-approvals"
                    element={
                        <ProtectedRoute>
                            <StudentApprovals />
                        </ProtectedRoute>
                    }
                />

                {/* GATE REQUEST MANAGEMENT (LANDLADY) */}
                <Route
                    path="/gate-requests"
                    element={
                        <ProtectedRoute>
                            <GateRequestManagement />
                        </ProtectedRoute>
                    }
                />

                {/* ATTENDANCE */}
                <Route
                    path="/attendance"
                    element={
                        <ProtectedRoute>
                            <Attendance />
                        </ProtectedRoute>
                    }
                />

                {/* USERS */}
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                {/* DEMERITS */}
                <Route
                    path="/demerits"
                    element={
                        <ProtectedRoute>
                            <Demerits />
                        </ProtectedRoute>
                    }
                />

                {/* REPORTS */}
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                {/* SETTINGS */}
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );
}

export default App;
