package ua.tqs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean emailEnabled = true;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean rentApprovedEnabled = true;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean rentRejectedEnabled = true;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean rentCanceledEnabled = true;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean rentReminderEnabled = true;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean rentFinishedEnabled = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
