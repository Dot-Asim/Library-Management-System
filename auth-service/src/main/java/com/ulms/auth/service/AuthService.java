package com.ulms.auth.service;

import com.ulms.auth.dto.*;
import com.ulms.auth.event.AuthEventPublisher;
import com.ulms.auth.exception.AuthException;
import com.ulms.auth.model.*;
import com.ulms.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Core authentication service — registration, login, token refresh, lockout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthEventPublisher eventPublisher;

    @Value("${auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${auth.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    // ─── Registration ────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            throw new AuthException("Email already registered", "AUTH-001");
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(Role.MEMBER)
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {} (id={})", user.getEmail(), user.getId());

        // Publish registration event for Member Service
        eventPublisher.publishMemberRegistered(user);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId().toString());

        return buildAuthResponse(user, accessToken);
    }

    // ─── Login ───────────────────────────────────────────────────────────

    @Transactional
    public LoginResult login(LoginRequest request) {
        log.info("Login attempt for: {}", request.email());

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthException("Invalid email or password", "AUTH-002"));

        // Check account lockout
        if (user.isAccountLocked()) {
            throw new AuthException("Account is locked. Try again after " + lockoutDurationMinutes + " minutes", "AUTH-003");
        }

        // If lock has expired, reset it
        if (user.getStatus() == UserStatus.LOCKED && !user.isAccountLocked()) {
            user.setStatus(UserStatus.ACTIVE);
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }

        // Check suspended
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AuthException("Account is suspended. Contact administrator", "AUTH-004");
        }

        // Validate password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new AuthException("Invalid email or password", "AUTH-002");
        }

        // Successful login — reset failed attempts
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());
        String refreshTokenId = refreshTokenService.createRefreshToken(user.getId().toString());

        AuthResponse authResponse = buildAuthResponse(user, accessToken);
        return new LoginResult(authResponse, refreshTokenId, refreshTokenService.getRefreshTokenExpiryMs());
    }

    // ─── Token Refresh ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LoginResult refreshAccessToken(String userId, String refreshTokenId) {
        if (!refreshTokenService.validateRefreshToken(userId, refreshTokenId)) {
            throw new AuthException("Invalid or expired refresh token", "AUTH-005");
        }

        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found", "AUTH-006"));

        // Invalidate old refresh token and create new one (rotation)
        refreshTokenService.invalidateRefreshToken(userId, refreshTokenId);
        String newRefreshTokenId = refreshTokenService.createRefreshToken(userId);

        String accessToken = jwtService.generateAccessToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());

        AuthResponse authResponse = buildAuthResponse(user, accessToken);
        return new LoginResult(authResponse, newRefreshTokenId, refreshTokenService.getRefreshTokenExpiryMs());
    }

    // ─── Logout ──────────────────────────────────────────────────────────

    public void logout(String userId, String refreshTokenId) {
        refreshTokenService.invalidateRefreshToken(userId, refreshTokenId);
        log.info("User logged out: {}", userId);
    }

    // ─── Token Validation (for API Gateway) ──────────────────────────────

    public TokenValidationResult validateAccessToken(String token) {
        try {
            var claims = jwtService.validateToken(token);
            return new TokenValidationResult(
                    true,
                    claims.getSubject(),
                    claims.get("email", String.class),
                    claims.get("role", String.class)
            );
        } catch (Exception e) {
            return new TokenValidationResult(false, null, null, null);
        }
    }

    // ─── Get Current User ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(String userId) {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found", "AUTH-006"));

        return new AuthResponse.UserInfo(
                user.getId().toString(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name()
        );
    }

    // ─── Private Helpers ─────────────────────────────────────────────────

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= maxFailedAttempts) {
            user.setStatus(UserStatus.LOCKED);
            user.setLockedUntil(Instant.now().plus(lockoutDurationMinutes, ChronoUnit.MINUTES));
            log.warn("Account locked for user {} after {} failed attempts", user.getEmail(), attempts);
        }

        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken) {
        return new AuthResponse(
                accessToken,
                "Bearer",
                jwtService.getAccessTokenExpiryMs() / 1000,
                new AuthResponse.UserInfo(
                        user.getId().toString(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getRole().name()
                )
        );
    }

    // ─── Result Records ──────────────────────────────────────────────────

    public record LoginResult(AuthResponse authResponse, String refreshTokenId, long refreshTokenExpiryMs) {}
    public record TokenValidationResult(boolean valid, String userId, String email, String role) {}
}
