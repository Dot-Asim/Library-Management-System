package com.ulms.auth.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT token creation and validation service.
 * Access tokens are short-lived (15 min), refresh tokens are handled separately via Redis.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiryMs;

    public JwtService(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.access-token-expiry-ms}") long accessTokenExpiryMs) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Secret);
        // Ensure the key is at least 256 bits for HS256
        if (keyBytes.length < 32) {
            // Pad with the original bytes repeated
            byte[] paddedKey = new byte[32];
            for (int i = 0; i < 32; i++) {
                paddedKey[i] = keyBytes[i % keyBytes.length];
            }
            keyBytes = paddedKey;
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiryMs = accessTokenExpiryMs;
    }

    /**
     * Generate an access JWT token.
     */
    public String generateAccessToken(String userId, String email, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiryMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId)
                .claims(Map.of(
                        "email", email,
                        "role", role
                ))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validate and parse a JWT token. Returns claims if valid.
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract the subject (userId) from a token without full validation.
     */
    public String extractUserId(String token) {
        return validateToken(token).getSubject();
    }

    public String extractEmail(String token) {
        return validateToken(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return validateToken(token).get("role", String.class);
    }

    public long getAccessTokenExpiryMs() {
        return accessTokenExpiryMs;
    }
}
