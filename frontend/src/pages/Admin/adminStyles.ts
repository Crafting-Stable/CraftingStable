import React from "react";

export const adminStyles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "Inter, Arial, sans-serif",
    },
    header: {
        backgroundColor: "#1976d2",
        color: "white",
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    title: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "bold",
    },
    nav: {
        display: "flex",
        gap: "20px",
    },
    navLink: {
        color: "white",
        textDecoration: "none",
        fontSize: "16px",
        padding: "8px 16px",
        borderRadius: "4px",
        transition: "background-color 0.3s",
    },
    navLinkActive: {
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    content: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "40px 20px",
    },
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontSize: "24px",
        color: "#666",
    },
    error: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontSize: "20px",
        color: "#f44336",
    },
    sectionTitle: {
        margin: "0 0 16px 0",
        fontSize: "24px",
        fontWeight: "bold",
        color: "#333",
    },
    statCard: {
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
};