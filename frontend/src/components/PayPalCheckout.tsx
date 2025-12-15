import React, { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalCheckoutWithRentProps {
    rentId: number;
    amount: string;
    currency?: string;
    description?: string;
    onSuccess: (captureData: CaptureData) => void;
    onError: (error: string) => void;
    onCancel?: () => void;
}

interface PayPalCheckoutNewRentProps {
    toolId: number;
    amount: string;
    startDate: string;
    endDate: string;
    currency?: string;
    description?: string;
    onSuccess: (rentData: RentCreatedData) => void;
    onError: (error: string) => void;
    onCancel?: () => void;
    disabled?: boolean;
}

export type PayPalCheckoutProps = PayPalCheckoutWithRentProps | PayPalCheckoutNewRentProps;

export interface CaptureData {
    orderId: string;
    status: string;
    payerId: string;
    payerEmail: string;
    amount: number;
    currency: string;
    captureId: string;
    rentId: number;
}

export interface RentCreatedData {
    rentId: number;
    toolId: number;
    status: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    paypalOrderId: string;
    paypalCaptureId: string;
}

interface PayPalOrderResponse {
    rentId?: number;
    amount: number;
    currency: string;
    description: string;
    orderId: string;
    status: string;
    approvalUrl: string;
}

const API_PORT = '8081';

function apiUrl(path: string): string {
    const protocol = globalThis.location?.protocol ?? 'http:';
    const hostname = globalThis.location?.hostname ?? 'localhost';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

function getJwt(): string | null {
    return globalThis.localStorage?.getItem('jwt') ?? null;
}

function isNewRentFlow(props: PayPalCheckoutProps): props is PayPalCheckoutNewRentProps {
    return 'toolId' in props && 'startDate' in props && 'endDate' in props;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = (props) => {
    const {
        amount,
        currency = "EUR",
        description,
        onError,
        onCancel
    } = props;

    const [clientId, setClientId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "YOUR_SANDBOX_CLIENT_ID";
        setClientId(paypalClientId);
        setLoading(false);
    }, []);

    const createOrder = async (): Promise<string> => {
        const jwt = getJwt();
        if (!jwt) {
            onError("Sessão expirada. Por favor faça login novamente.");
            throw new Error("No authentication token");
        }

        try {
            let rentIdValue: number;
            if (isNewRentFlow(props)) {
                rentIdValue = 0;
            } else {
                rentIdValue = props.rentId;
            }

            const params = new URLSearchParams({
                rentId: rentIdValue.toString(),
                amount: amount,
                currency: currency,
            });

            if (description) {
                params.append("description", description);
            }

            const response = await fetch(apiUrl(`/api/paypal/orders?${params.toString()}`), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Falha ao criar ordem PayPal");
            }

            const data: PayPalOrderResponse = await response.json();
            return data.orderId;
        } catch (error: any) {
            console.error("Error creating PayPal order:", error);
            onError(error.message || "Falha ao criar ordem PayPal");
            throw error;
        }
    };

    const onApprove = async (data: { orderID: string }): Promise<void> => {
        const jwt = getJwt();
        if (!jwt) {
            onError("Sessão expirada. Por favor faça login novamente.");
            return;
        }

        try {
            if (isNewRentFlow(props)) {
                const newRentProps = props;

                const captureResponse = await fetch(
                    apiUrl(`/api/paypal/orders/${data.orderID}/capture?rentId=0`),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${jwt}`
                        }
                    }
                );

                if (!captureResponse.ok) {
                    const errorText = await captureResponse.text();
                    throw new Error(errorText || "Falha ao processar pagamento PayPal");
                }

                const captureData: CaptureData = await captureResponse.json();

                if (captureData.status !== "COMPLETED") {
                    newRentProps.onError(`Pagamento não concluído. Estado: ${captureData.status}`);
                    return;
                }

                console.log("✅ PayPal payment captured:", captureData);

                const startDateTime = `${newRentProps.startDate}T10:00:00`;
                const endDateTime = `${newRentProps.endDate}T18:00:00`;

                const rentRequestBody = {
                    toolId: newRentProps.toolId,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    paypalOrderId: captureData.orderId,
                    paypalCaptureId: captureData.captureId
                };

                console.log("📤 Creating rent after payment:", rentRequestBody);

                const rentResponse = await fetch(apiUrl('/api/rents'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${jwt}`
                    },
                    body: JSON.stringify(rentRequestBody)
                });

                if (!rentResponse.ok) {
                    const errorText = await rentResponse.text();
                    console.error("❌ Rent creation failed after payment:", errorText);
                    newRentProps.onError(`Pagamento processado mas erro ao criar reserva: ${errorText}. Contacte o suporte com o ID: ${captureData.orderId}`);
                    return;
                }

                const rentData = await rentResponse.json();
                console.log("✅ Rent created successfully:", rentData);

                const successData: RentCreatedData = {
                    rentId: rentData.id,
                    toolId: newRentProps.toolId,
                    status: rentData.status || 'PENDING',
                    startDate: newRentProps.startDate,
                    endDate: newRentProps.endDate,
                    totalPrice: Number.parseFloat(amount),
                    paypalOrderId: captureData.orderId,
                    paypalCaptureId: captureData.captureId
                };

                newRentProps.onSuccess(successData);
            } else {
                const existingRentProps = props;

                const response = await fetch(
                    apiUrl(`/api/paypal/orders/${data.orderID}/capture?rentId=${existingRentProps.rentId}`),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${jwt}`
                        }
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Falha ao processar pagamento PayPal");
                }

                const captureData: CaptureData = await response.json();

                if (captureData.status === "COMPLETED") {
                    existingRentProps.onSuccess(captureData);
                } else {
                    existingRentProps.onError(`Pagamento não concluído. Estado: ${captureData.status}`);
                }
            }
        } catch (error: any) {
            console.error("Error in PayPal flow:", error);
            onError(error.message || "Falha ao processar pagamento PayPal");
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const handleError = (error: any) => {
        console.error("PayPal error:", error);
        onError("Erro no PayPal. Por favor tente novamente.");
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
                <div style={{
                    width: 32,
                    height: 32,
                    border: "3px solid #0070ba",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!clientId || clientId === "YOUR_SANDBOX_CLIENT_ID") {
        return (
            <div style={{
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                color: "#92400e",
                padding: "12px 16px",
                borderRadius: 8
            }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Configuração PayPal Necessária</p>
                <p style={{ fontSize: 13 }}>
                    Configure o VITE_PAYPAL_CLIENT_ID nas variáveis de ambiente.
                </p>
            </div>
        );
    }

    const disabled = isNewRentFlow(props) ? (props.disabled ?? false) : false;

    return (
        <PayPalScriptProvider
            options={{
                clientId: clientId,
                currency: currency,
                intent: "capture",
                disableFunding: "credit,card",
            }}
        >
            <div style={{ minHeight: 150 }}>
                <PayPalButtons
                    style={{
                        layout: "vertical",
                        color: "gold",
                        shape: "rect",
                        label: "paypal",
                        height: 45
                    }}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onCancel={handleCancel}
                    onError={handleError}
                    disabled={disabled}
                    forceReRender={[amount, currency]}
                />
            </div>
        </PayPalScriptProvider>
    );
};

export default PayPalCheckout;