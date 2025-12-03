import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import  LoginPage from "./pages/LoginPage";
import  User from "./pages/UserDetailsPage";
import ToolDetails from "./pages/User/ToolDetails";
export default function App(): React.ReactElement {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/loginPage" element={<LoginPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/user" element={<User />} />
                <Route path="/tools/:id" element={<ToolDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}