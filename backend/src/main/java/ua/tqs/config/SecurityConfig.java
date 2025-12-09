package ua.tqs.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import ua.tqs.login.JwtAuthFilter;

import java.util.List;

@Configuration
public class SecurityConfig {

    private static final String AUTHORIZATION_HEADER = "Authorization";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter, Environment env) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/actuator/health", "/actuator/info").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/slots/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/slots/dto").permitAll();

                    auth.requestMatchers(HttpMethod.POST, "/api/tools", "/api/tools/**").authenticated();
                    auth.requestMatchers(HttpMethod.PUT, "/api/tools", "/api/tools/**").authenticated();
                    auth.requestMatchers(HttpMethod.DELETE, "/api/tools", "/api/tools/**").authenticated();

                    auth.requestMatchers(HttpMethod.POST, "/api/reservations/**").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/reservations/all").authenticated();
                    auth.requestMatchers("/api/reservations/admin/**").hasRole("ADMIN"); // <- alterado
                    auth.requestMatchers("/api/users/**").hasRole("ADMIN"); // <- alterado
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

                    if (env.acceptsProfiles(Profiles.of("test"))) {
                        auth.requestMatchers("/api/analytics/track").permitAll();
                    }

                    auth.anyRequest().authenticated();
                })
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                AUTHORIZATION_HEADER,
                "Content-Type",
                "Origin",
                "Accept",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(List.of(AUTHORIZATION_HEADER));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
