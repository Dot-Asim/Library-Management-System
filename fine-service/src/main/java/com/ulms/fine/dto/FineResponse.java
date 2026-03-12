package com.ulms.fine.dto;

import com.ulms.fine.model.enums.FineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineResponse {
    private Long id;
    private Long memberId;
    private Long borrowRecordId;
    private Double amount;
    private FineStatus status;
    private LocalDateTime issueDate;
}
