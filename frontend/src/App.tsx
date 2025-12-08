import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import  LoginPage from "./pages/LoginPage";
import { AdminDashboard, AdminUsers, AdminTools, AdminAnalytics } from "./pages/Admin";

export default function App(): React.ReactElement {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/loginPage" element={<LoginPage />} />
                <Route path="/about" element={<About />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/tools" element={<AdminTools />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}