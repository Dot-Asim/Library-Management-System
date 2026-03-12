package com.ulms.notification.dto;

import com.ulms.notification.model.enums.NotificationStatus;
import com.ulms.notification.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long memberId;
    private String recipientEmail;
    private String subject;
    private String message;
    private NotificationType type;
    private NotificationStatus status;
    private LocalDateTime sentAt;
}
