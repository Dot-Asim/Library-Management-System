package com.ulms.auth.controller;

import com.ulms.auth.dto.*;
import com.ulms.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

/**
 * REST controller for authentication operations.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Register, Login, Token Refresh, and Logout")
public class AuthController {

    private final AuthService authService;

    // ─── Register ────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new member account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.register(request);
        // For registration, we also do an implicit login
        AuthService.LoginResult loginResult = authService.login(
                new LoginRequest(request.email(), request.password()));

        addRefreshTokenCookie(response, loginResult.refreshTokenId(), loginResult.refreshTokenExpiryMs());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", loginResult.authResponse()));
    }

    // ─── Login ───────────────────────────────────────────────────────────

    @PostMapping("/login")
    @Operation(summary = "Authenticate and receive JWT + refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthService.LoginResult result = authService.login(request);
        addRefreshTokenCookie(response, result.refreshTokenId(), result.refreshTokenExpiryMs());

        return ResponseEntity.ok(ApiResponse.success("Login successful", result.authResponse()));
    }

    // ─── Refresh Token ───────────────────────────────────────────────────

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        String refreshTokenId = extractRefreshTokenFromCookie(request);
        if (refreshTokenId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("No refresh token found", "AUTH-005"));
        }

        // Extract userId from the X-User-Id header (set by Gateway)
        // or from a separate cookie
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = extractUserIdFromCookie(request);
        }
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("User context not found", "AUTH-005"));
        }

        AuthService.LoginResult result = authService.refreshAccessToken(userId, refreshTokenId);
        addRefreshTokenCookie(response, result.refreshTokenId(), result.refreshTokenExpiryMs());

        return ResponseEntity.ok(ApiResponse.success("Token refreshed", result.authResponse()));
    }

    // ─── Logout ──────────────────────────────────────────────────────────

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        String userId = request.getHeader("X-User-Id");
        String refreshTokenId = extractRefreshTokenFromCookie(request);

        if (userId != null && refreshTokenId != null) {
            authService.logout(userId, refreshTokenId);
        }

        // Clear the cookie
        Cookie cookie = new Cookie("ulms_refresh_token", "");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    // ─── Validate (Internal — called by API Gateway) ─────────────────────

    @GetMapping("/validate")
    @Operation(summary = "Validate JWT token (internal use by API Gateway)")
    public ResponseEntity<ApiResponse<AuthService.TokenValidationResult>> validate(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Missing or invalid Authorization header", "AUTH-005"));
        }

        String token = authHeader.substring(7);
        AuthService.TokenValidationResult result = authService.validateAccessToken(token);

        if (result.valid()) {
            return ResponseEntity.ok(ApiResponse.success(result));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or expired token", "AUTH-005"));
        }
    }

    // ─── Get Current User ────────────────────────────────────────────────

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user info")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> me(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated", "AUTH-005"));
        }

        AuthResponse.UserInfo userInfo = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }

    // ─── Private Helpers ─────────────────────────────────────────────────

    private void addRefreshTokenCookie(HttpServletResponse response, String tokenId, long expiryMs) {
        Cookie cookie = new Cookie("ulms_refresh_token", tokenId);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge((int) (expiryMs / 1000));
        response.addCookie(cookie);

        // Also set userId cookie for refresh endpoint
        Cookie userIdCookie = new Cookie("ulms_user_id", "");
        // userId will be set from the auth response on the client side
        userIdCookie.setHttpOnly(false);
        userIdCookie.setPath("/");
        userIdCookie.setMaxAge((int) (expiryMs / 1000));
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "ulms_refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String extractUserIdFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "ulms_user_id".equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> !v.isEmpty())
                .findFirst()
                .orElse(null);
    }
}
