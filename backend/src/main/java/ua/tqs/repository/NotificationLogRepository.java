package ua.tqs.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByUserIdOrderBySentAtDesc(Long userId, Pageable pageable);

    List<NotificationLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<NotificationLog> findByRelatedRentIdOrderByCreatedAtDesc(Long relatedRentId);

    List<NotificationLog> findByStatus(NotificationStatus status);

    List<NotificationLog> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    Long countByStatus(NotificationStatus status);

    Long countByType(NotificationType type);

    @Query("SELECT n FROM NotificationLog n ORDER BY n.createdAt DESC LIMIT :limit")
    List<NotificationLog> findTopNOrderByCreatedAtDesc(@Param("limit") int limit);

    @Query("SELECT COUNT(n) FROM NotificationLog n WHERE n.status = :status AND n.sentAt BETWEEN :from AND :to")
    Long countByStatusAndSentAtBetween(@Param("status") NotificationStatus status,
                                       @Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);
}
