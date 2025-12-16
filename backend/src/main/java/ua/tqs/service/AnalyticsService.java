package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Analytics;
import ua.tqs.repository.AnalyticsRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    /**
     * Track an event asynchronously for better performance
     */
    @Async
    @Transactional
    public void trackEvent(String eventType, Long userId, Long toolId, Long rentId, String metadata, String ipAddress, String userAgent) {
        try {
            Analytics analytics = Analytics.builder()
                    .eventType(eventType)
                    .userId(userId)
                    .toolId(toolId)
                    .rentId(rentId)
                    .metadata(metadata)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .timestamp(LocalDateTime.now())
                    .build();
            
            analyticsRepository.save(analytics);
            log.debug("Tracked event: {} for user: {}", eventType, userId);
        } catch (Exception e) {
            log.error("Failed to track analytics event: {}", eventType, e);
            // Don't throw exception - analytics failures shouldn't break the main flow
        }
    }

    /**
     * Get analytics summary for dashboard
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsSummary(LocalDateTime since) {
        Map<String, Object> summary = new HashMap<>();

        // Event counts by type
        List<Object[]> eventCounts = analyticsRepository.countEventTypesSince(since);
        Map<String, Long> eventMap = new HashMap<>();
        long totalEvents = 0;
        for (Object[] row : eventCounts) {
            Long count = (Long) row[1];
            eventMap.put((String) row[0], count);
            totalEvents += count;
        }
        summary.put("eventsByType", eventMap);
        summary.put("totalEvents", totalEvents);

        // Unique users
        Long uniqueUsers = analyticsRepository.countUniqueUsersSince(since);
        summary.put("uniqueUsers", uniqueUsers);

        // Most viewed tools - convert to format expected by frontend
        List<Object[]> mostViewed = analyticsRepository.findMostViewedToolsSince(since);
        List<Map<String, Object>> topTools = new java.util.ArrayList<>();
        for (Object[] row : mostViewed) {
            Map<String, Object> tool = new HashMap<>();
            tool.put("toolId", row[0]);
            tool.put("views", row[1]);
            topTools.add(tool);
        }
        summary.put("topTools", topTools);

        summary.put("period", since.toString());

        return summary;
    }

    /**
     * Get events by type within a time range
     */
    @Transactional(readOnly = true)
    public List<Analytics> getEventsByType(String eventType, LocalDateTime start, LocalDateTime end) {
        return analyticsRepository.findByEventTypeAndTimestampBetween(eventType, start, end);
    }

    /**
     * Get user activity
     */
    @Transactional(readOnly = true)
    public List<Analytics> getUserActivity(Long userId) {
        return analyticsRepository.findByUserId(userId);
    }

    /**
     * Get tool analytics
     */
    @Transactional(readOnly = true)
    public List<Analytics> getToolAnalytics(Long toolId) {
        return analyticsRepository.findByToolId(toolId);
    }
}
