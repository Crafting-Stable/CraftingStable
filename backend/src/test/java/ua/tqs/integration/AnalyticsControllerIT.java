package ua.tqs.integration;

import java.util.Map;
import java.util.UUID;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.awaitility.Awaitility.await;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AnalyticsControllerIT {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void trackEvent_shouldReturn200() {
        String eventType = "TOOL_VIEW-" + UUID.randomUUID();
        ResponseEntity<Void> resp = restTemplate.postForEntity(
                "/api/analytics/track?eventType=" + eventType + "&userId=1&toolId=2",
                null,
                Void.class
        );
        assertTrue(resp.getStatusCode().is2xxSuccessful(), "Track should return 200");
    }

    @Test
    void summaryAndEvents_shouldReturnData() {
        String eventType = "TOOL_VIEW-" + UUID.randomUUID();

        // send two events
        restTemplate.postForEntity("/api/analytics/track?eventType=" + eventType + "&userId=42&toolId=99", null, Void.class);
        restTemplate.postForEntity("/api/analytics/track?eventType=" + eventType + "&userId=42&toolId=99", null, Void.class);

        // aguarda de forma reativa até que o resumo contenha ao menos 2 eventos do tipo
        await().atMost(Duration.ofSeconds(5)).pollInterval(Duration.ofMillis(100)).until(() -> {
            ResponseEntity<Map> summaryResp = restTemplate.getForEntity("/api/analytics/summary", Map.class);
            if (!summaryResp.getStatusCode().is2xxSuccessful()) return false;
            Map<?, ?> body = summaryResp.getBody();
            if (body == null) return false;
            Object eventCountsObj = body.get("eventCounts");
            if (!(eventCountsObj instanceof Map)) return false;
            @SuppressWarnings("unchecked")
            Map<String, Number> eventCounts = (Map<String, Number>) eventCountsObj;
            Number count = eventCounts.get(eventType);
            return count != null && count.longValue() >= 2;
        });

        // get summary
        ResponseEntity<Map> summaryResp = restTemplate.getForEntity("/api/analytics/summary", Map.class);
        assertTrue(summaryResp.getStatusCode().is2xxSuccessful(), "Summary should return 200");
        Map<?, ?> body = summaryResp.getBody();
        assertNotNull(body);
        Object eventCountsObj = body.get("eventCounts");
        assertNotNull(eventCountsObj, "eventCounts should be present in summary");
        @SuppressWarnings("unchecked")
        Map<String, Number> eventCounts = (Map<String, Number>) eventCountsObj;
        Number count = eventCounts.get(eventType);
        assertNotNull(count, "eventCounts should include the tracked event type");
        assertTrue(count.longValue() >= 2, "Should have at least 2 events for the type");

        // get events by type in a wide date range
        String start = "2000-01-01T00:00:00";
        String end = "3000-01-01T00:00:00";
        String url = "/api/analytics/events/" + eventType + "?start=" + start + "&end=" + end;
        ResponseEntity<Analytics[]> eventsResp = restTemplate.getForEntity(url, Analytics[].class);
        assertTrue(eventsResp.getStatusCode().is2xxSuccessful(), "Events endpoint should return 200");
        Analytics[] events = eventsResp.getBody();
        assertNotNull(events);
        assertTrue(events.length >= 2, "Should return at least 2 events");
    }

    // small local shadow of expected Analytics DTO used only for deserialization in test
    public static class Analytics {
        public Long id;
        public String eventType;
        public Long userId;
        public Long toolId;
        public Long rentId;
        public String metadata;
        public String ipAddress;
        public String userAgent;
        public String timestamp;
    }
}
