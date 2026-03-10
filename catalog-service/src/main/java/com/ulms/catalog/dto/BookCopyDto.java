package com.ulms.catalog.dto;

import com.ulms.catalog.model.BookCopyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookCopyDto {
    private Long id;
    
    @NotNull(message = "Book ID is required")
    private Long bookId;
    
    @NotBlank(message = "Barcode is required")
    private String barcode;
    
    @NotNull(message = "Status is required")
    private BookCopyStatus status;
    
    private String condition;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
