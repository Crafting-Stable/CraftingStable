package ua.tqs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import ua.tqs.controller.AuthController;
import ua.tqs.login.JwtUtil;
import ua.tqs.service.UserDetailsServiceImpl;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void quandoLoginValido_retornaTokenE200() throws Exception {
        String token = "token-abc-123";

        UserDetails user = new org.springframework.security.core.userdetails.User(
                "test@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        when(authManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword(), user.getAuthorities()));

        when(userDetailsService.loadUserByUsername(eq("test@example.com"))).thenReturn(user);
        when(jwtUtil.generateToken(eq("test@example.com"), anyString())).thenReturn(token);
        when(userDetailsService.getUserId(any(UserDetails.class))).thenReturn(1L);
        when(userDetailsService.getUserName(any(UserDetails.class))).thenReturn("Test User");

        Map<String, String> payload = Map.of(
                "email", "test@example.com",
                "password", "password"
        );

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").value(token));
    }

    @Test
    void quandoCredenciaisInvalidas_retorna401() throws Exception {
        when(authManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid"));

        Map<String, String> payload = Map.of(
                "email", "bad@example.com",
                "password", "wrong"
        );

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void quandoRequestMalFormado_retorna400ou401() throws Exception {
        // dependendo da validação no controller pode ser 400 ou 401;
        // aqui simulamos que a autenticação falha e esperamos 401
        when(authManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public AuthenticationManager authManager() {
            return Mockito.mock(AuthenticationManager.class);
        }

        @Bean
        public UserDetailsServiceImpl userDetailsService() {
            return Mockito.mock(UserDetailsServiceImpl.class);
        }

        @Bean
        public JwtUtil jwtUtil() {
            return Mockito.mock(JwtUtil.class);
        }
    }
}
