package ua.tqs.enums;

public enum NotificationStatus {
    PENDING,    // Waiting to be sent
    SENT,       // Successfully sent
    DELIVERED,  // Confirmed delivery (future - requires webhooks)
    FAILED,     // Failed to send
    CANCELLED   // Cancelled before sending
}
