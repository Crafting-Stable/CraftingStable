package ua.tqs.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.model.Analytics;
import ua.tqs.repository.AnalyticsRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AnalyticsRepository analyticsRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void testTrackEvent() {
        analyticsService.trackEvent("TEST_EVENT", 1L, 1L, 1L, "test metadata", "127.0.0.1", "test-agent");
        verify(analyticsRepository, times(1)).save(any(Analytics.class));
    }
}
