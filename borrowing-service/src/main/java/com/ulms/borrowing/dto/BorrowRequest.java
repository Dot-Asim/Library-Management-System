package com.ulms.borrowing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowRequest {
    @NotNull(message = "Member ID is required")
    private Long memberId;
    
    @NotNull(message = "Book Copy ID is required")
    private Long bookCopyId;

    @NotNull(message = "Book ID is required")
    private Long bookId;
}
