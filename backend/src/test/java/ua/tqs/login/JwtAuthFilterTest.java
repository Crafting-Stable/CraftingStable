package ua.tqs.login;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import ua.tqs.service.UserDetailsServiceImpl;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthFilter filter;

    @BeforeEach
    public void setUp() {
        filter = new JwtAuthFilter(jwtUtil, userDetailsService);
    }

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void whenNoAuthorizationHeader_thenChainProceedAndNoAuth() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtUtil);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    public void whenInvalidToken_thenChainProceedAndNoAuth() throws Exception {
        String token = "bad-token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateToken(token)).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        verify(jwtUtil).validateToken(token);
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    public void whenValidToken_thenAuthenticateAndChainProceed() throws Exception {
        String token = "valid-token";
        String username = "user@example.com";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateToken(token)).thenReturn(true);
        when(jwtUtil.getUsername(token)).thenReturn(username);

        UserDetails userDetails = new User(
                username,
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        filter.doFilter(request, response, filterChain);

        verify(jwtUtil).validateToken(token);
        verify(jwtUtil).getUsername(token);
        verify(userDetailsService).loadUserByUsername(username);
        verify(filterChain).doFilter(request, response);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(username, auth.getName());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER")));
    }
}
