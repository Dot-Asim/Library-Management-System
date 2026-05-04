package com.ulms.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
    @NotBlank(message = "First name is required")
    String firstName,
    
    @NotBlank(message = "Last name is required")
    String lastName
) {}
