package com.ulms.auth.exception;

import lombok.Getter;

/**
 * Custom authentication/authorization exception with error code.
 */
@Getter
public class AuthException extends RuntimeException {

    private final String errorCode;

    public AuthException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
