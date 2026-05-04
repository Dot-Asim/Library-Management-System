package com.ulms.auth.dto;

public record UserListResponse(
    String id,
    String email,
    String firstName,
    String lastName,
    String role,
    String status
) {}
