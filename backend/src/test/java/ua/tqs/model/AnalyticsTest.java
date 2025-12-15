package ua.tqs.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class AnalyticsTest {

    @Test
    void testAnalyticsModelWithBuilder() {
        LocalDateTime now = LocalDateTime.now();
        Analytics analytics = Analytics.builder()
                .id(1L)
                .eventType("tool_rented")
                .userId(1L)
                .toolId(1L)
                .rentId(1L)
                .timestamp(now)
                .metadata("{\"key\":\"value\"}")
                .ipAddress("127.0.0.1")
                .userAgent("Test Agent")
                .build();

        assertEquals(1L, analytics.getId());
        assertEquals("tool_rented", analytics.getEventType());
        assertEquals(1L, analytics.getUserId());
        assertEquals(1L, analytics.getToolId());
        assertEquals(1L, analytics.getRentId());
        assertEquals(now, analytics.getTimestamp());
        assertEquals("{\"key\":\"value\"}", analytics.getMetadata());
        assertEquals("127.0.0.1", analytics.getIpAddress());
        assertEquals("Test Agent", analytics.getUserAgent());
    }

    @Test
    void testAnalyticsDefaultConstructorAndPrePersist() {
        Analytics analytics = new Analytics();
        analytics.setEventType("user_login");
        analytics.onCreate();

        assertNotNull(analytics.getTimestamp());
        assertEquals("user_login", analytics.getEventType());
    }
}
