package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.service.NotificationLogService;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationLogService notificationLogService;

    @InjectMocks
    private NotificationController controller;

    private NotificationLog log1;
    private NotificationLog log2;

    @BeforeEach
    void setUp() {
        log1 = NotificationLog.builder()
            .id(1L)
            .userId(100L)
            .type(NotificationType.RENT_APPROVED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.SENT)
            .recipient("user@example.com")
            .subject("Rent Approved")
            .sentAt(LocalDateTime.of(2025, 12, 7, 10, 0))
            .relatedRentId(1L)
            .build();

        log2 = NotificationLog.builder()
            .id(2L)
            .userId(100L)
            .type(NotificationType.RENT_REJECTED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.SENT)
            .recipient("user@example.com")
            .subject("Rent Rejected")
            .sentAt(LocalDateTime.of(2025, 12, 7, 9, 0))
            .relatedRentId(2L)
            .build();
    }

    /**
     * GET /api/notifications/user/{userId}
     */
    @Test
    void whenGetUserNotifications_thenReturnList() {
        List<NotificationLog> logs = Arrays.asList(log1, log2);
        when(notificationLogService.findByUserId(100L)).thenReturn(logs);

        ResponseEntity<List<NotificationLog>> response = controller.getUserNotifications(100L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getId()).isEqualTo(1L);
        assertThat(response.getBody().get(0).getType()).isEqualTo(NotificationType.RENT_APPROVED);
        assertThat(response.getBody().get(1).getId()).isEqualTo(2L);

        verify(notificationLogService, times(1)).findByUserId(100L);
    }

    @Test
    void whenGetUserNotifications_andEmpty_thenReturnEmptyList() {
        when(notificationLogService.findByUserId(999L)).thenReturn(Arrays.asList());

        ResponseEntity<List<NotificationLog>> response = controller.getUserNotifications(999L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    /**
     * GET /api/notifications/recent
     */
    @Test
    void whenGetRecentNotifications_thenReturnList() {
        List<NotificationLog> logs = Arrays.asList(log1, log2);
        when(notificationLogService.findRecentLogs(10)).thenReturn(logs);

        ResponseEntity<List<NotificationLog>> response = controller.getRecentNotifications(10);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        verify(notificationLogService, times(1)).findRecentLogs(10);
    }

    @Test
    void whenGetRecentNotifications_withDefaultLimit_thenUseDefault() {
        List<NotificationLog> logs = Arrays.asList(log1);
        when(notificationLogService.findRecentLogs(20)).thenReturn(logs);

        ResponseEntity<List<NotificationLog>> response = controller.getRecentNotifications(20);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(notificationLogService, times(1)).findRecentLogs(20);
    }

    /**
     * GET /api/notifications/rent/{rentId}
     */
    @Test
    void whenGetRentNotifications_thenReturnList() {
        List<NotificationLog> logs = Arrays.asList(log1);
        when(notificationLogService.findByRentId(1L)).thenReturn(logs);

        ResponseEntity<List<NotificationLog>> response = controller.getRentNotifications(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getRelatedRentId()).isEqualTo(1L);
        verify(notificationLogService, times(1)).findByRentId(1L);
    }

    /**
     * GET /api/notifications/statistics
     */
    @Test
    void whenGetStatistics_thenReturnStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", 100L);
        stats.put("sent", 85L);
        stats.put("failed", 10L);
        stats.put("pending", 5L);

        when(notificationLogService.getStatistics()).thenReturn(stats);

        ResponseEntity<Map<String, Long>> response = controller.getStatistics();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("total", 100L);
        assertThat(response.getBody()).containsEntry("sent", 85L);
        assertThat(response.getBody()).containsEntry("failed", 10L);
        assertThat(response.getBody()).containsEntry("pending", 5L);
        verify(notificationLogService, times(1)).getStatistics();
    }

    /**
     * GET /api/notifications/failed
     */
    @Test
    void whenGetFailedNotifications_thenReturnList() {
        NotificationLog failedLog = NotificationLog.builder()
            .id(3L)
            .userId(100L)
            .type(NotificationType.RENT_APPROVED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.FAILED)
            .recipient("user@example.com")
            .subject("Rent Approved")
            .errorMessage("SMTP connection failed")
            .relatedRentId(3L)
            .build();

        List<NotificationLog> logs = Arrays.asList(failedLog);
        when(notificationLogService.findFailed()).thenReturn(logs);

        ResponseEntity<List<NotificationLog>> response = controller.getFailedNotifications();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(response.getBody().get(0).getErrorMessage()).isEqualTo("SMTP connection failed");
        verify(notificationLogService, times(1)).findFailed();
    }
}
