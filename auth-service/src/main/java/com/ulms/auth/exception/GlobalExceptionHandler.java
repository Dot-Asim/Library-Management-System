package com.ulms.auth.exception;

import com.ulms.auth.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Global exception handler for the Auth Service.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthException(AuthException ex) {
        log.warn("Auth error: {} [{}]", ex.getMessage(), ex.getErrorCode());

        HttpStatus status = switch (ex.getErrorCode()) {
            case "AUTH-001" -> HttpStatus.CONFLICT;           // Email already exists
            case "AUTH-002" -> HttpStatus.UNAUTHORIZED;       // Invalid credentials
            case "AUTH-003" -> HttpStatus.LOCKED;             // Account locked
            case "AUTH-004" -> HttpStatus.FORBIDDEN;          // Account suspended
            case "AUTH-005" -> HttpStatus.UNAUTHORIZED;       // Invalid refresh token
            case "AUTH-006" -> HttpStatus.NOT_FOUND;          // User not found
            default -> HttpStatus.BAD_REQUEST;
        };

        return ResponseEntity.status(status)
                .body(ApiResponse.error(ex.getMessage(), ex.getErrorCode()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));

        log.warn("Validation error: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(errors, "AUTH-VAL"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred", "AUTH-500"));
    }
}
