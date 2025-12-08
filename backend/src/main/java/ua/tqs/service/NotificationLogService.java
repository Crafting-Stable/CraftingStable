package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.repository.NotificationLogRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationLogService {

    @Autowired
    private NotificationLogRepository repository;

    public List<NotificationLog> findByUserId(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<NotificationLog> findByRentId(Long rentId) {
        return repository.findByRelatedRentIdOrderByCreatedAtDesc(rentId);
    }

    public List<NotificationLog> findByStatus(NotificationStatus status) {
        return repository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<NotificationLog> findFailed() {
        return repository.findByStatusOrderByCreatedAtDesc(NotificationStatus.FAILED);
    }

    public Long countByStatus(NotificationStatus status) {
        return repository.countByStatus(status);
    }

    public Long countByType(NotificationType type) {
        return repository.countByType(type);
    }

    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();

        stats.put("total", repository.count());
        stats.put("sent", repository.countByStatus(NotificationStatus.SENT));
        stats.put("failed", repository.countByStatus(NotificationStatus.FAILED));
        stats.put("pending", repository.countByStatus(NotificationStatus.PENDING));

        return stats;
    }

    public Optional<NotificationLog> findById(Long id) {
        return repository.findById(id);
    }

    public List<NotificationLog> findRecentLogs(int limit) {
        return repository.findTopNOrderByCreatedAtDesc(limit);
    }
}
