package com.ulms.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    UserInfo user
) {
    public record UserInfo(
        String id,
        String email,
        String firstName,
        String lastName,
        String role
    ) {}
}
