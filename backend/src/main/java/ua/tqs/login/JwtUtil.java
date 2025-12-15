package ua.tqs.login;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private final SecretKey secretKey;
    private static final long JWT_EXPIRATION_MS = 86400000; // 1 dia

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        byte[] decodedKey = Base64.getDecoder().decode(secret);
        this.secretKey = Keys.hmacShaKeyFor(decodedKey);
        logger.info("🔐 JwtUtil initialized with secret key");
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiration = new Date(System.currentTimeMillis() + JWT_EXPIRATION_MS);

        logger.info("🎫 Generating JWT for user: {} with role: {}", username, role);
        logger.info("📅 Token issued at: {} | Expires at: {}", now, expiration);

        String token = Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiration)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

        logger.info("✅ Token generated successfully: {}...", token.substring(0, Math.min(30, token.length())));
        return token;
    }

    public String getUsername(String token) {
        try {
            String username = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();

            logger.info("👤 Extracted username from token: {}", username);
            return username;
        } catch (Exception e) {
            logger.error("❌ Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Date expiration = claims.getExpiration();
            Date now = new Date();
            boolean isExpired = expiration.before(now);

            logger.info("🔍 Token validation - Expires: {} | Now: {} | Expired: {}",
                    expiration, now, isExpired);

            if (isExpired) {
                logger.warn("⏰ Token has EXPIRED");
                return false;
            }

            logger.info(" Token is VALID");
            return true;

        } catch (ExpiredJwtException e) {
            logger.error(" Token validation FAILED - Token expired: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            logger.error(" Token validation FAILED - Malformed token: {}", e.getMessage());
            return false;
        } catch (SignatureException e) {
            logger.error(" Token validation FAILED - Invalid signature: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            logger.error(" Token validation FAILED - JWT exception: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            logger.error(" Token validation FAILED - Unexpected error: {}", e.getMessage(), e);
            return false;
        }
    }
}