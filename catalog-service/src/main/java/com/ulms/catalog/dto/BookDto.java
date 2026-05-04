package com.ulms.catalog.dto;

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
public class BookDto {
    private Long id;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "ISBN is required")
    private String isbn;
    
    private Integer publicationYear;
    private String publisher;
    private String language;
    private String description;
    
    private com.ulms.catalog.model.BookType bookType;
    private String contentUrl;
    private String coverImageUrl;
    private boolean isFree;
    private String textContent;
    private Integer availableCopies;
    private String authorName;
    private Long authorId;
    
    @NotNull(message = "Category is required")
    private Long categoryId;
    
    private String categoryName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
