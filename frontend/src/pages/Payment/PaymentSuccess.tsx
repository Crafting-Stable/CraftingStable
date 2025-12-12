import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../components/Header";

const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: 20,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#fff",
    background: "linear-gradient(180deg, rgba(10,10,10,0.6), rgba(0,0,0,0.8))"
};

const cardStyle: React.CSSProperties = {
    maxWidth: 600,
    margin: "40px auto",
    padding: 40,
    borderRadius: 12,
    background: "linear-gradient(145deg, #1a1a1a, #2d2d2d)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    textAlign: "center"
};

const successIconStyle: React.CSSProperties = {
    width: 80,
    height: 80,
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 40
};

const buttonStyle: React.CSSProperties = {
    marginTop: 30,
    padding: "14px 32px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    transition: "transform 0.2s, box-shadow 0.2s"
};

export default function PaymentSuccess(): React.ReactElement {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Extract payment details from URL params (PayPal returns these after approval)
    const paymentDetails = useMemo(() => ({
        orderId: searchParams.get("token") || undefined,
        rentId: searchParams.get("rentId") || undefined,
        amount: searchParams.get("amount") || undefined
    }), [searchParams]);

    const handleViewRentals = () => {
        navigate("/user");
    };

    const handleBackHome = () => {
        navigate("/");
    };

    return (
        <div style={pageStyle}>
            <Header />
            <div style={cardStyle}>
                <div style={successIconStyle}>
                    ✓
                </div>
                
                <h1 style={{ 
                    fontSize: 28, 
                    fontWeight: 700, 
                    marginBottom: 16,
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    Payment Successful!
                </h1>
                
                <p style={{ 
                    fontSize: 16, 
                    color: "#9ca3af", 
                    marginBottom: 24,
                    lineHeight: 1.6
                }}>
                    Thank you for your payment. Your rental has been confirmed and is now active.
                    You will receive a confirmation email shortly.
                </p>

                {paymentDetails.orderId && (
                    <div style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 20
                    }}>
                        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>
                            <strong>Transaction ID:</strong>
                        </p>
                        <p style={{ 
                            fontSize: 12, 
                            color: "#22c55e",
                            fontFamily: "monospace",
                            wordBreak: "break-all"
                        }}>
                            {paymentDetails.orderId}
                        </p>
                    </div>
                )}

                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        style={buttonStyle}
                        onClick={handleViewRentals}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        View My Rentals
                    </button>
                    
                    <button
                        style={{
                            ...buttonStyle,
                            background: "transparent",
                            border: "2px solid #4b5563"
                        }}
                        onClick={handleBackHome}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#6b7280";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#4b5563";
                        }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
