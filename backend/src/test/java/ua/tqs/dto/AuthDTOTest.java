package ua.tqs.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthDTOTest {

    @Test
    void authRequest_gettersSetters() {
        AuthRequestDTO req = new AuthRequestDTO();
        req.setEmail("alice@example.com");
        req.setPassword("secret");
        req.setPasswordConfirm("secret");
        req.setName("Alice");
        req.setRole("USER");

        assertEquals("alice@example.com", req.getEmail());
        assertEquals("secret", req.getPassword());
        assertEquals("secret", req.getPasswordConfirm());
        assertEquals("Alice", req.getName());
        assertEquals("USER", req.getRole());
    }

    @Test
    void authResponse_constructorAndGetters() {
        AuthResponseDTO res = new AuthResponseDTO("tok", "ADMIN", 7L, "Bob", "bob@example.com");

        assertEquals("tok", res.getToken());
        assertEquals("ADMIN", res.getRole());
        assertEquals(7L, res.getUserId());
        assertEquals("Bob", res.getName());
        assertEquals("bob@example.com", res.getEmail());
    }
}
