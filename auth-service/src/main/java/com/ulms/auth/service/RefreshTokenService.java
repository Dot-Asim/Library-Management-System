package com.ulms.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Manages refresh tokens in Redis.
 * Each refresh token is a UUID stored with key pattern: refresh:{userId}:{tokenId}
 */
@Service
public class RefreshTokenService {

    private final StringRedisTemplate redisTemplate;
    private final long refreshTokenExpiryMs;

    public RefreshTokenService(
            StringRedisTemplate redisTemplate,
            @Value("${jwt.refresh-token-expiry-ms}") long refreshTokenExpiryMs) {
        this.redisTemplate = redisTemplate;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
    }

    /**
     * Create a new refresh token and store in Redis.
     */
    public String createRefreshToken(String userId) {
        String tokenId = UUID.randomUUID().toString();
        String key = buildKey(userId, tokenId);

        redisTemplate.opsForValue().set(
                key,
                "valid",
                Duration.ofMillis(refreshTokenExpiryMs)
        );

        return tokenId;
    }

    /**
     * Validate a refresh token exists in Redis.
     */
    public boolean validateRefreshToken(String userId, String tokenId) {
        String key = buildKey(userId, tokenId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Invalidate (delete) a specific refresh token.
     */
    public void invalidateRefreshToken(String userId, String tokenId) {
        String key = buildKey(userId, tokenId);
        redisTemplate.delete(key);
    }

    /**
     * Invalidate ALL refresh tokens for a user (force logout everywhere).
     */
    public void invalidateAllTokensForUser(String userId) {
        var keys = redisTemplate.keys("refresh:" + userId + ":*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }

    private String buildKey(String userId, String tokenId) {
        return "refresh:" + userId + ":" + tokenId;
    }
}
