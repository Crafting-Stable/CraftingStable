package ua.tqs.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.AuthRequest;
import ua.tqs.dto.AuthResponse;
import ua.tqs.login.JwtUtil;
import ua.tqs.service.UserDetailsServiceImpl;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(AuthenticationManager authManager, UserDetailsServiceImpl userDetailsService, JwtUtil jwtUtil) {
        this.authManager = authManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody AuthRequest request) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(
                userDetails.getUsername(),
                userDetails.getAuthorities().iterator().next().getAuthority()
        );

        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        Long userId = userDetailsService.getUserId(userDetails);

        String name = userDetailsService.getUserName(userDetails);
        String email = userDetails.getUsername();

        return ResponseEntity.ok(new AuthResponse(token, role, userId, name, email));

    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequest request) {
        if (request.getPassword() == null || request.getPasswordConfirm() == null ||
                !request.getPassword().equals(request.getPasswordConfirm())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "USER";
        }

        if (userDetailsService.userExists(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        try {
            userDetailsService.registerUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getName(),
                    role
            );
            return ResponseEntity.ok("User registered successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role: must be USER or ADMIN");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            return ResponseEntity.status(401).build();
        }

        UserDetails userDetails = (UserDetails) principal;
        String authority = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_USER");
        String role = authority.replace("ROLE_", "");

        Map<String, Object> body = new HashMap<>();
        body.put("username", userDetailsService.getUserName(userDetails));
        body.put("email", userDetails.getUsername());
        body.put("role", role);
        body.put("id", userDetailsService.getUserId(userDetails));

        return ResponseEntity.ok(body);
    }
}
