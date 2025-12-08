package ua.tqs.enums;

public enum NotificationChannel {
    EMAIL,      // Email via SMTP (IMPLEMENTED)
    SMS,        // SMS via Twilio/AWS SNS (FUTURE)
    PUSH        // Push notifications via FCM (FUTURE)
}
