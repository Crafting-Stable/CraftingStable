package ua.tqs.enums;

public enum NotificationType {
    // Rent/Booking notifications (IMPLEMENTED - Rent system is ready)
    RENT_APPROVED,          // Owner approves the rent
    RENT_REJECTED,          // Owner rejects the rent
    RENT_CANCELED,          // User cancels the rent
    RENT_REMINDER,          // Reminder 24h before startDate
    RENT_FINISHED,          // Rent completed

    // Payment notifications (FUTURE - Payment system not ready yet)
    PAYMENT_CONFIRMATION,   // Payment processed successfully
    PAYMENT_FAILED,         // Payment failed
    DEPOSIT_REFUNDED,       // Deposit returned to user

    // Insurance notifications (FUTURE)
    INSURANCE_ACTIVATED,    // Insurance policy activated
    TOOL_DAMAGE_REPORTED,   // Damage reported on tool

    // Account notifications
    ACCOUNT_CREATED,        // New user account
    PASSWORD_RESET          // Password reset request
}
