package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationTemplate;

import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    /**
     * Find active template by type and channel
     * Used to get the correct template for sending notifications
     */
    Optional<NotificationTemplate> findByTypeAndChannelAndActiveTrue(
        NotificationType type,
        NotificationChannel channel
    );
}
