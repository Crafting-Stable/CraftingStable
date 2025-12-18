package ua.tqs.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ua.tqs.dto.AuthRequestDTO;
import ua.tqs.dto.AuthResponseDTO;
import ua.tqs.login.JwtUtil;
import ua.tqs.service.UserDetailsServiceImpl;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "http://deti-tqs-21.ua.pt" })
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(AuthenticationManager authManager,
                          UserDetailsServiceImpl userDetailsService,
                          JwtUtil jwtUtil) {
        this.authManager = authManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody AuthRequestDTO request) {
        logger.info("🔐 Login attempt for email: {}", request.getEmail());

        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.getEmail(), request.getPassword()));
            logger.info("✅ Authentication successful for: {}", request.getEmail());
        } catch (BadCredentialsException e) {
            logger.error("❌ Bad credentials for: {}", request.getEmail());

            boolean exists = userDetailsService.userExists(request.getEmail());
            Map<String, String> body = new HashMap<>();

            if (!exists) {
                body.put("message", "Este utilizador não existe.");
            } else {
                body.put("message", "Email ou password incorretos.");
            }

            // Continua a devolver 401 (correto para API), mas com mensagem amigável em JSON
            return ResponseEntity.status(401).body(body);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        logger.info("👤 UserDetails loaded for: {}", userDetails.getUsername());
        logger.info("🔐 UserDetails authorities: {}", userDetails.getAuthorities());

        String authority = userDetails.getAuthorities().iterator().next().getAuthority();
        logger.info("🎭 Full authority: {}", authority);

        String token = jwtUtil.generateToken(userDetails.getUsername(), authority);
        logger.info("🎫 JWT token generated: {}...", token.substring(0, Math.min(30, token.length())));

        String role = authority.replace("ROLE_", "");
        logger.info("🎭 Role without prefix (for response): {}", role);

        Long userId = userDetailsService.getUserId(userDetails);
        String name = userDetailsService.getUserName(userDetails);
        String email = userDetails.getUsername();

        logger.info("📦 Preparing response - userId: {}, role: {}, name: {}, email: {}",
                userId, role, name, email);

        AuthResponseDTO response = new AuthResponseDTO(token, role, userId, name, email);
        logger.info("📤 Sending response with token and user data");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequestDTO request) {
        logger.info("📝 Registration attempt for email: {}", request.getEmail());

        if (request.getPassword() == null || request.getPasswordConfirm() == null ||
                !request.getPassword().equals(request.getPasswordConfirm())) {
            logger.warn("⚠️ Password mismatch for: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "CUSTOMER";
            logger.info("🎭 No role provided, using default: CUSTOMER");
        }
        logger.info("👥 Registering user with role: {}", role);

        if (userDetailsService.userExists(request.getEmail())) {
            logger.warn("⚠️ Email already exists: {}", request.getEmail());
            return ResponseEntity.badRequest().body("Email already exists");
        }

        try {
            userDetailsService.registerUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName(),
                    role
            );
            logger.info("✅ User registered successfully: {}", request.getEmail());
            return ResponseEntity.status(201).body("User registered successfully");
        } catch (IllegalArgumentException e) {
            logger.error("❌ Invalid role for registration: {}", role);
            return ResponseEntity.badRequest().body("Invalid role: must be CUSTOMER or ADMIN");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        logger.info("🔍 /me endpoint called");

        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            logger.warn("⚠️ Unauthenticated request to /me");
            return ResponseEntity.status(401).build();
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            logger.warn("⚠️ Invalid principal type in /me");
            return ResponseEntity.status(401).build();
        }

        UserDetails userDetails = (UserDetails) principal;
        String authority = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_CUSTOMER");
        String role = authority.replace("ROLE_", "");

        Map<String, Object> body = new HashMap<>();
        body.put("username", userDetailsService.getUserName(userDetails));
        body.put("email", userDetails.getUsername());
        body.put("role", role);
        body.put("id", userDetailsService.getUserId(userDetails));

        logger.info("✅ /me response for user: {}", userDetails.getUsername());
        return ResponseEntity.ok(body);
    }
}
