package ua.tqs.config;

import java.util.List;

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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import ua.tqs.login.JwtAuthFilter;

@Configuration
public class SecurityConfig {

    private static final String AUTHORIZATION_HEADER = "Authorization";

    private static final String API_ANALYTICS = "/api/analytics/**";
    private static final String API_TOOLS = "/api/tools";
    private static final String API_TOOLS_WILDCARD = "/api/tools/**";
    private static final String API_RENTS_WILDCARD = "/api/rents/**";
    private static final String API_RESERVATIONS_WILDCARD = "/api/reservations/**";
    private static final String API_USERS_WILDCARD = "/api/users/**";

    private static final String ROLE_ADMIN = "ADMIN";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter, Environment env) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/actuator/health", "/actuator/info").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/slots/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/slots/dto").permitAll();

                    if (env.acceptsProfiles(Profiles.of("test"))) {
                        auth.requestMatchers(HttpMethod.POST, "/api/analytics/track").permitAll();
                        auth.requestMatchers(HttpMethod.GET, API_ANALYTICS).permitAll();
                    } else {
                        auth.requestMatchers(HttpMethod.GET, API_ANALYTICS).hasRole(ROLE_ADMIN);
                    }
                    auth.requestMatchers(HttpMethod.POST, API_ANALYTICS).hasRole(ROLE_ADMIN);

                    auth.requestMatchers(HttpMethod.GET, API_TOOLS_WILDCARD).permitAll();
                    auth.requestMatchers(HttpMethod.POST, API_TOOLS, API_TOOLS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.PUT, API_TOOLS, API_TOOLS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.DELETE, API_TOOLS, API_TOOLS_WILDCARD).authenticated();

                    auth.requestMatchers(HttpMethod.POST, API_RENTS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.PUT, API_RENTS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.DELETE, API_RENTS_WILDCARD).hasRole(ROLE_ADMIN);
                    auth.requestMatchers(HttpMethod.GET, API_RENTS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.POST, API_RESERVATIONS_WILDCARD).authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/reservations/all").authenticated();
                    auth.requestMatchers("/api/reservations/admin/**").hasRole(ROLE_ADMIN);

                    auth.requestMatchers("/api/paypal/**").authenticated();

                    auth.requestMatchers("/api/users/stats/admin").hasRole(ROLE_ADMIN);
                    auth.requestMatchers("/api/users/*/stats").authenticated();
                    auth.requestMatchers(HttpMethod.PUT, "/api/users/*/paypal-email").authenticated(); 
                    // Permitir que utilizadores autenticados vejam um único utilizador por id
                    auth.requestMatchers(HttpMethod.GET, "/api/users/*").authenticated();

                    // Manter listagem geral e operações sensíveis apenas para ADMIN
                    auth.requestMatchers(HttpMethod.GET, "/api/users").hasRole(ROLE_ADMIN);
                    auth.requestMatchers(API_USERS_WILDCARD).hasRole(ROLE_ADMIN);

                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

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
        return new BCryptPasswordEncoder();
    }
}
