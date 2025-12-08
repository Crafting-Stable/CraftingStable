package ua.tqs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notification_templates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"type", "channel"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    @NotNull
    @Column(length = 200)
    private String subject;

    @NotNull
    @Column(columnDefinition = "TEXT")
    private String content;

    @NotNull
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Renders template by replacing placeholders {{variableName}} with values
     * This method will be implemented to make tests pass (TDD)
     */
    public String render(Map<String, Object> variables) {
        if (variables == null || variables.isEmpty()) {
            return content;
        }

        String result = content;
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }
}
