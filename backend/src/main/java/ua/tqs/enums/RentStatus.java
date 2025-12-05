package ua.tqs.enums;

public enum RentStatus {
    PENDING,    // Waiting for owner approval
    APPROVED,   // Approved by owner
    REJECTED,   // Rejected by owner
    ACTIVE,     // Currently in use
    CANCELED,   // Canceled by user
    FINISHED    // Completed
}
