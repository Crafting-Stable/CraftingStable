package ua.tqs.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.model.Analytics;
import ua.tqs.service.AnalyticsService;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private static final String UNKNOWN = "unknown";

    private final AnalyticsService analyticsService;

    /**
     * Track an analytics event
     */
    @PostMapping("/track")
    public ResponseEntity<Void> trackEvent(
            @RequestParam String eventType,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long toolId,
            @RequestParam(required = false) Long rentId,
            @RequestParam(required = false) String metadata,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        analyticsService.trackEvent(eventType, userId, toolId, rentId, metadata, ipAddress, userAgent);

        return ResponseEntity.ok().build();
    }

    /**
     * Get analytics summary (for admin dashboard)
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {

        if (since == null) {
            // Default to last 30 days
            since = LocalDateTime.now().minusDays(30);
        }

        Map<String, Object> summary = analyticsService.getAnalyticsSummary(since);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get events by type within a time range
     */
    @GetMapping("/events/{eventType}")
    public ResponseEntity<List<Analytics>> getEventsByType(
            @PathVariable String eventType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<Analytics> events = analyticsService.getEventsByType(eventType, start, end);
        return ResponseEntity.ok(events);
    }

    /**
     * Get user activity
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Analytics>> getUserActivity(@PathVariable Long userId) {
        List<Analytics> activity = analyticsService.getUserActivity(userId);
        return ResponseEntity.ok(activity);
    }

    /**
     * Get tool analytics
     */
    @GetMapping("/tool/{toolId}")
    public ResponseEntity<List<Analytics>> getToolAnalytics(@PathVariable Long toolId) {
        List<Analytics> analytics = analyticsService.getToolAnalytics(toolId);
        return ResponseEntity.ok(analytics);
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || UNKNOWN.equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || UNKNOWN.equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || UNKNOWN.equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Take first IP if multiple are present (X-Forwarded-For can be a list)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
