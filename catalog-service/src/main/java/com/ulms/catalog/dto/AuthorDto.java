package com.ulms.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDto {
    private Long id;
    
    @NotBlank(message = "Author name is required")
    private String name;
    
    private String biography;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
