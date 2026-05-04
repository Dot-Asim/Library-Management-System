package com.ulms.notification.controller;

import com.ulms.notification.dto.NotificationResponse;
import com.ulms.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<NotificationResponse>> getMemberNotifications(@PathVariable Long memberId) {
        return ResponseEntity.ok(notificationService.getMemberNotifications(memberId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }
}
