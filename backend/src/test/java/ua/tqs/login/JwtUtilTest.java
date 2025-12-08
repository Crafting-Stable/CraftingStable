package ua.tqs.login;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

public class JwtUtilTest {

    private JwtUtil jwtUtil;
    private SecretKey secretKey;
    private static final String BASE64_SECRET = "D5TFnXTz7cIF+eGOhmpJJVxbwi3KSIBcC8qF63NCdp4=";

    @BeforeEach
    public void setUp() {
        byte[] keyBytes = Base64.getDecoder().decode(BASE64_SECRET);
        secretKey = Keys.hmacShaKeyFor(keyBytes);
        jwtUtil = new JwtUtil(BASE64_SECRET);
    }

    @Test
    public void generateValidateAndParseToken() {
        String username = "test@example.com";
        String role = "ROLE_USER";

        String token = jwtUtil.generateToken(username, role);

        assertNotNull(token);
        assertTrue(jwtUtil.validateToken(token));
        assertEquals(username, jwtUtil.getUsername(token));

        String parsedRole = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);

        assertEquals(role, parsedRole);
    }

    @Test
    public void invalidTokenIsRejected() {
        String bad = "this.is.not.a.valid.jwt";
        assertFalse(jwtUtil.validateToken(bad));
        assertNull(jwtUtil.getUsername(bad));
    }

    @Test
    public void expiredTokenIsRejected() {
        String username = "expired@example.com";
        String role = "ROLE_EXPIRED";

        String expiredToken = Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis() - 2000))
                .setExpiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

        assertFalse(jwtUtil.validateToken(expiredToken));
        assertNull(jwtUtil.getUsername(expiredToken));
    }
}
