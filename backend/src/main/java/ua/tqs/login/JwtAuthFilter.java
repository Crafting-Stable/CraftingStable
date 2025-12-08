package ua.tqs.login;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ua.tqs.service.UserDetailsServiceImpl;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Autowired
    public JwtAuthFilter(JwtUtil jwtUtil, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        logger.info("========================================");
        logger.info("🔍 [JWT Filter] Processing request: {} {}", method, path);
        logger.info("========================================");

        String token = null;
        String authHeader = request.getHeader("Authorization");

        logger.info("📨 [JWT Filter] Authorization header: {}",
                authHeader != null ? authHeader.substring(0, Math.min(50, authHeader.length())) + "..." : "❌ NOT PRESENT");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            logger.info("🔑 [JWT Filter] Token extracted (length: {}): {}...",
                    token.length(),
                    token.substring(0, Math.min(30, token.length())));
        } else {
            logger.warn("⚠️ [JWT Filter] No Bearer token found in Authorization header");
            logger.warn("⚠️ [JWT Filter] Request will proceed WITHOUT authentication");
        }

        if (token != null) {
            logger.info("🔍 [JWT Filter] Starting token validation...");
            boolean isValid = jwtUtil.validateToken(token);
            logger.info("✅ [JWT Filter] Token validation result: {}", isValid);

            if (isValid) {
                String username = jwtUtil.getUsername(token);
                logger.info("👤 [JWT Filter] Username from token: {}", username);

                if (username != null) {
                    if (SecurityContextHolder.getContext().getAuthentication() != null) {
                        logger.info("ℹ️ [JWT Filter] Authentication already exists in SecurityContext");
                    } else {
                        logger.info("🔄 [JWT Filter] Loading user details for: {}", username);

                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            logger.info("👥 [JWT Filter] UserDetails loaded successfully");
                            logger.info("   Email: {}", userDetails.getUsername());
                            logger.info("   Authorities: {}", userDetails.getAuthorities());
                            logger.info("   Is enabled: {}", userDetails.isEnabled());
                            logger.info("   Is account non-locked: {}", userDetails.isAccountNonLocked());

                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                            SecurityContextHolder.getContext().setAuthentication(auth);
                            logger.info("🔓 [JWT Filter] Authentication SET in SecurityContext");
                            logger.info("   Principal: {}", auth.getPrincipal());
                            logger.info("   Authorities: {}", auth.getAuthorities());
                            logger.info("   Is authenticated: {}", auth.isAuthenticated());

                        } catch (Exception e) {
                            logger.error("❌ [JWT Filter] Error loading user details: {}", e.getMessage(), e);
                        }
                    }
                } else {
                    logger.warn("⚠️ [JWT Filter] Username is NULL from token");
                }
            } else {
                logger.error("🔒 [JWT Filter] Token validation FAILED - token is invalid or expired");
            }
        } else {
            logger.info("ℹ️ [JWT Filter] No token to validate - proceeding without authentication");
        }

        logger.info("➡️ [JWT Filter] Current Authentication in SecurityContext: {}",
                SecurityContextHolder.getContext().getAuthentication());
        logger.info("➡️ [JWT Filter] Passing request to next filter in chain");
        logger.info("========================================");

        filterChain.doFilter(request, response);
    }
}