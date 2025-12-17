package ua.tqs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import ua.tqs.model.Analytics;
import ua.tqs.service.AnalyticsService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AnalyticsController analyticsController;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        // Regista suporte para java.time\ (LocalDateTime) e usa ISO strings
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders.standaloneSetup(analyticsController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private Analytics sampleEvent(Long id, String eventType, LocalDateTime ts) {
        return Analytics.builder()
                .id(id)
                .eventType(eventType)
                .userId(10L)
                .toolId(20L)
                .metadata("meta")
                .ipAddress("127.0.0.1")
                .userAgent("JUnit")
                .timestamp(ts)
                .build();
    }

    @Test
    void trackEvent_callsServiceAndReturnsOk() throws Exception {
        // arrange
        doNothing().when(analyticsService).trackEvent(anyString(), any(), any(), any(), any(), anyString(), anyString());

        // act & assert
        mockMvc.perform(post("/api/analytics/track")
                        .param("eventType", "CLICK")
                        .param("userId", "10")
                        .param("toolId", "20")
                        .param("metadata", "foo")
                        .header("User-Agent", "JUnit-Agent"))
                .andExpect(status().isOk());

        // verify parameters captured (user-agent passed from header)
        verify(analyticsService, times(1)).trackEvent(eq("CLICK"), eq(10L), eq(20L), isNull(), eq("foo"), anyString(), eq("JUnit-Agent"));
    }

    @Test
    void getSummary_returnsMap() throws Exception {
        LocalDateTime since = LocalDateTime.of(2025, 1, 1, 0, 0);
        Map<String, Object> summary = new HashMap<>();
        summary.put("period", since.toString());
        summary.put("eventCounts", Map.of("CLICK", 5L));
        when(analyticsService.getAnalyticsSummary(since)).thenReturn(summary);

        mockMvc.perform(get("/api/analytics/summary")
                        .param("since", since.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period", is(since.toString())))
                .andExpect(jsonPath("$.eventCounts.CLICK", is(5)));

        verify(analyticsService, times(1)).getAnalyticsSummary(since);
    }

    @Test
    void getEventsByType_returnsList() throws Exception {
        LocalDateTime start = LocalDateTime.of(2025, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2025, 1, 2, 0, 0);
        Analytics a1 = sampleEvent(1L, "VIEW", start.plusHours(1));
        Analytics a2 = sampleEvent(2L, "VIEW", start.plusHours(2));
        when(analyticsService.getEventsByType("VIEW", start, end)).thenReturn(List.of(a1, a2));

        mockMvc.perform(get("/api/analytics/events/VIEW")
                        .param("start", start.toString())
                        .param("end", end.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].eventType", is("VIEW")))
                .andExpect(jsonPath("$[1].id", is(2)));

        verify(analyticsService, times(1)).getEventsByType("VIEW", start, end);
    }

    @Test
    void getUserActivity_returnsList() throws Exception {
        Analytics a = sampleEvent(3L, "LOGIN", LocalDateTime.now());
        when(analyticsService.getUserActivity(10L)).thenReturn(List.of(a));

        mockMvc.perform(get("/api/analytics/user/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId", is(10)));

        verify(analyticsService, times(1)).getUserActivity(10L);
    }

    @Test
    void getToolAnalytics_returnsList() throws Exception {
        Analytics a = sampleEvent(4L, "TOOL_VIEW", LocalDateTime.now());
        when(analyticsService.getToolAnalytics(20L)).thenReturn(List.of(a));

        mockMvc.perform(get("/api/analytics/tool/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].toolId", is(20)));

        verify(analyticsService, times(1)).getToolAnalytics(20L);
    }
}
