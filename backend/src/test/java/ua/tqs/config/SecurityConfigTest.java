package ua.tqs.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.web.SecurityFilterChain;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ApplicationContext ctx;

    @Test
    void anonymousAccessToAnalyticsTrack_shouldReturn2xx() {
        String eventType = "SEC_TEST-" + UUID.randomUUID();
        ResponseEntity<Void> resp = restTemplate.postForEntity(
                "/api/analytics/track?eventType=" + eventType + "&userId=1&toolId=2",
                null,
                Void.class
        );
        assertTrue(resp.getStatusCode().is2xxSuccessful(), "Endpoint /api/analytics/track deve permitir acesso anônimo em profile test");
    }

    @Test
    void securityFilterChainBean_shouldBePresentInContext() {
        assertDoesNotThrow(() -> ctx.getBean(SecurityFilterChain.class), "SecurityFilterChain bean deve estar presente no contexto");
    }
}
