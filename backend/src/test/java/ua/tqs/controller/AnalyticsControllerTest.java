package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.model.Analytics;
import ua.tqs.service.AnalyticsService;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsControllerTest {

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AnalyticsController controller;

    private Analytics analytics1;
    private Analytics analytics2;

    @BeforeEach
    void setUp() {
        LocalDateTime now = LocalDateTime.now();

        analytics1 = Analytics.builder()
            .id(1L)
            .eventType("TOOL_VIEW")
            .userId(1L)
            .toolId(10L)
            .timestamp(now)
            .ipAddress("127.0.0.1")
            .userAgent("Mozilla/5.0")
            .build();

        analytics2 = Analytics.builder()
            .id(2L)
            .eventType("RENT_CREATED")
            .userId(2L)
            .toolId(20L)
            .rentId(5L)
            .timestamp(now.minusHours(1))
            .ipAddress("192.168.1.1")
            .userAgent("Chrome/120.0")
            .build();
    }

    /**
     * GET /api/admin/analytics/summary
     */
    @Test
    void whenGetAnalyticsSummary_thenReturnSummary() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);

        Map<String, Object> summary = new HashMap<>();
        Map<String, Long> eventCounts = new HashMap<>();
        eventCounts.put("TOOL_VIEW", 150L);
        eventCounts.put("RENT_CREATED", 45L);
        summary.put("eventCounts", eventCounts);
        summary.put("uniqueUsers", 25L);
        summary.put("period", since.toString());

        when(analyticsService.getAnalyticsSummary(any(LocalDateTime.class))).thenReturn(summary);

        ResponseEntity<Map<String, Object>> response = controller.getSummary(since);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("uniqueUsers")).isEqualTo(25L);
        assertThat(response.getBody().get("eventCounts")).isInstanceOf(Map.class);

        verify(analyticsService, times(1)).getAnalyticsSummary(any(LocalDateTime.class));
    }

    @Test
    void whenGetAnalyticsSummary_withDefaultSince_thenUseLast7Days() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("eventCounts", new HashMap<>());
        summary.put("uniqueUsers", 10L);

        when(analyticsService.getAnalyticsSummary(any(LocalDateTime.class))).thenReturn(summary);

        ResponseEntity<Map<String, Object>> response = controller.getSummary(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(analyticsService, times(1)).getAnalyticsSummary(any(LocalDateTime.class));
    }

    /**
     * GET /api/analytics/events/{eventType}
     */
    @Test
    void whenGetEventsByType_thenReturnFilteredEvents() {
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now();
        List<Analytics> events = Arrays.asList(analytics1, analytics2);

        when(analyticsService.getEventsByType("TOOL_VIEW", start, end)).thenReturn(events);

        ResponseEntity<List<Analytics>> response = controller.getEventsByType("TOOL_VIEW", start, end);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getEventType()).isEqualTo("TOOL_VIEW");

        verify(analyticsService, times(1)).getEventsByType("TOOL_VIEW", start, end);
    }

    /**
     * GET /api/analytics/user/{userId}
     */
    @Test
    void whenGetUserActivity_thenReturnUserEvents() {
        List<Analytics> userEvents = Arrays.asList(analytics1);

        when(analyticsService.getUserActivity(1L)).thenReturn(userEvents);

        ResponseEntity<List<Analytics>> response = controller.getUserActivity(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getUserId()).isEqualTo(1L);

        verify(analyticsService, times(1)).getUserActivity(1L);
    }

    @Test
    void whenGetUserActivity_withNonExistentUser_thenReturnEmptyList() {
        when(analyticsService.getUserActivity(999L)).thenReturn(Collections.emptyList());

        ResponseEntity<List<Analytics>> response = controller.getUserActivity(999L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    /**
     * GET /api/analytics/tool/{toolId}
     */
    @Test
    void whenGetToolAnalytics_thenReturnToolEvents() {
        List<Analytics> toolEvents = Arrays.asList(analytics1);

        when(analyticsService.getToolAnalytics(10L)).thenReturn(toolEvents);

        ResponseEntity<List<Analytics>> response = controller.getToolAnalytics(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getToolId()).isEqualTo(10L);

        verify(analyticsService, times(1)).getToolAnalytics(10L);
    }

    @Test
    void whenGetToolAnalytics_withNonExistentTool_thenReturnEmptyList() {
        when(analyticsService.getToolAnalytics(999L)).thenReturn(Collections.emptyList());

        ResponseEntity<List<Analytics>> response = controller.getToolAnalytics(999L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }
}
