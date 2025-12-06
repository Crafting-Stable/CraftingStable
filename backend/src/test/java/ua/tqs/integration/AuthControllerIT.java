package ua.tqs.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import ua.tqs.dto.AuthResponseDTO;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIT {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void registerLoginAndMe_shouldReturnUserInfo() {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        String password = "StrongP@ssw0rd";
        String name = "Integration Test User";
        String role = "CUSTOMER";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> registerBody = Map.of(
                "email", email,
                "password", password,
                "passwordConfirm", password,
                "name", name,
                "role", role
        );
        HttpEntity<Map<String, Object>> registerEntity = new HttpEntity<>(registerBody, headers);
        ResponseEntity<String> registerResp = restTemplate.postForEntity("/api/auth/register", registerEntity, String.class);

        // Mensagem de erro detalhada para debugging: inclui status e corpo retornado pelo servidor
        assertTrue(registerResp.getStatusCode().is2xxSuccessful(),
                () -> "Register should succeed. Status: " + registerResp.getStatusCodeValue()
                        + " Body: " + (registerResp.getBody() == null ? "<empty>" : registerResp.getBody()));

        Map<String, Object> loginBody = Map.of(
                "email", email,
                "password", password
        );
        HttpEntity<Map<String, Object>> loginEntity = new HttpEntity<>(loginBody, headers);
        ResponseEntity<AuthResponseDTO> loginResp = restTemplate.postForEntity("/api/auth/login", loginEntity, AuthResponseDTO.class);
        assertTrue(loginResp.getStatusCode().is2xxSuccessful(), "Login should succeed");
        AuthResponseDTO auth = loginResp.getBody();
        assertNotNull(auth);
        assertNotNull(auth.getToken(), "Token should be present");
        assertEquals(email, auth.getEmail(), "Email in response should match");

        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(auth.getToken());
        HttpEntity<Void> meEntity = new HttpEntity<>(authHeaders);
        ResponseEntity<Map> meResp = restTemplate.exchange("/api/auth/me", HttpMethod.GET, meEntity, Map.class);
        assertTrue(meResp.getStatusCode().is2xxSuccessful(), "/me should return 200");
        Map<?, ?> meBody = meResp.getBody();
        assertNotNull(meBody);
        assertEquals(email, meBody.get("email"));
        assertEquals(name, meBody.get("username"));
        assertEquals(role, meBody.get("role"));
        assertNotNull(meBody.get("id"));
    }
}
