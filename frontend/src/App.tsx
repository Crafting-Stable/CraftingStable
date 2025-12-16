import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import About from "./pages/About";
import Catalog from "./pages/Catalog";
import  LoginPage from "./pages/LoginPage";
import  User from "./pages/UserDetailsPage";
import ToolDetails from "./pages/User/ToolDetails";
import AddRent from "./pages/User/AddRent";
import  AdminDashboard from "./pages/Admin/AdminDashboard";
import  AdminUsers from "./pages/Admin/AdminUsers";
import  AdminTools from "./pages/Admin/AdminTools";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PaymentCancel from "./pages/Payment/PaymentCancel";

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
                <Route path="/user/add-rent" element={<AddRent />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/tools" element={<AdminTools />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}