package ua.tqs.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.model.NotificationLog;
import ua.tqs.service.NotificationLogService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationLogService notificationLogService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationLog>> getUserNotifications(@PathVariable Long userId) {
        List<NotificationLog> notifications = notificationLogService.findByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NotificationLog>> getRecentNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        List<NotificationLog> notifications = notificationLogService.findRecentLogs(limit);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/rent/{rentId}")
    public ResponseEntity<List<NotificationLog>> getRentNotifications(@PathVariable Long rentId) {
        List<NotificationLog> notifications = notificationLogService.findByRentId(rentId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Long>> getStatistics() {
        Map<String, Long> stats = notificationLogService.getStatistics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/failed")
    public ResponseEntity<List<NotificationLog>> getFailedNotifications() {
        List<NotificationLog> notifications = notificationLogService.findFailed();
        return ResponseEntity.ok(notifications);
    }
}
