package ua.tqs.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import ua.tqs.enums.UserRole;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserDetailsServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.info("🔍 Loading user by username: {}", username);

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    logger.error("User not found: {}", username);
                    return new UsernameNotFoundException("User not found: " + username);
                });

        String role = "ROLE_" + user.getType().name();
        logger.info("User loaded: {} with role: {}", username, role);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(role))
        );
    }

    public boolean userExists(String username) {
        boolean exists = userRepository.findByEmail(username).isPresent();
        logger.info("User exists check for {}: {}", username, exists);
        return exists;
    }

    public void registerUser(String username, String password, String name, String role) {
        logger.info("Registering user: {} with role: {}", username, role);

        if (userExists(username)) {
            logger.warn("User already exists: {}", username);
            throw new IllegalArgumentException("User already exists");
        }

        User user = new User();
        user.setEmail(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);

        try {
            user.setType(UserRole.valueOf(role.toUpperCase()));
            userRepository.save(user);
            logger.info("User registered successfully: {} with type: {}", username, user.getType());
        } catch (IllegalArgumentException e) {
            logger.error("Invalid role: {}", role);
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }

    public Long getUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        logger.info("Retrieved user ID: {} for {}", user.getId(), userDetails.getUsername());
        return user.getId();
    }

    public String getUserName(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        String name = user != null ? user.getName() : "Guest";
        logger.info("Retrieved user name: {} for {}", name, userDetails.getUsername());
        return name;
    }
}