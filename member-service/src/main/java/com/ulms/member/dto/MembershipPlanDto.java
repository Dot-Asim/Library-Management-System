package com.ulms.member.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MembershipPlanDto {
    private Long id;
    
    @NotBlank(message = "Plan name is required")
    private String name;
    
    @NotNull(message = "Max books is required")
    @Min(1)
    private Integer maxBooks;
    
    @NotNull(message = "Max days is required")
    @Min(1)
    private Integer maxDays;
    
    @NotNull(message = "Fee is required")
    @Min(0)
    private BigDecimal fee;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
