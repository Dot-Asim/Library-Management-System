package com.ulms.notification.service;

import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import com.ulms.events.fine.FineCreatedEvent;
import com.ulms.events.member.MemberRegisteredEvent;
import com.ulms.notification.dto.NotificationResponse;
import com.ulms.notification.model.NotificationLog;
import com.ulms.notification.model.enums.NotificationStatus;
import com.ulms.notification.model.enums.NotificationType;
import com.ulms.notification.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationLogRepository notificationRepository;

    public void sendBorrowConfirmation(BookBorrowedEvent event) {
        log.info("Sending borrow confirmation to {} for book {}", event.memberEmail(), event.bookTitle());
        
        String subject = "Borrow Confirmation: " + event.bookTitle();
        String message = String.format("Dear Member,\n\nYou have successfully borrowed '%s'. Your due date is %s.\n\nEnjoy reading!", 
                event.bookTitle(), event.dueDate());

        saveNotification(Long.parseLong(event.memberId()), event.memberEmail(), subject, message, NotificationType.EMAIL);
    }

    public void sendReturnConfirmation(BookReturnedEvent event) {
        log.info("Sending return confirmation to member {}", event.memberId());
        
        String subject = "Return Confirmation";
        String message = String.format("Dear Member,\n\nWe have received your returned book. Thank you!");

        // Assume we look up the email via member service, or its carried in the event
        String emailToUse = "member_" + event.memberId() + "@system.local"; 

        saveNotification(Long.parseLong(event.memberId()), emailToUse, subject, message, NotificationType.EMAIL);
    }

    public void sendFineNotice(FineCreatedEvent event) {
        log.info("Sending fine notice to {} for amount {}", event.memberEmail(), event.amount());
        
        String subject = "Library Fine Issued";
        String message = String.format("Dear Member,\n\nA fine of $%.2f has been issued to your account. Reason: %s.\n\nPlease pay it promptly.", 
                event.amount(), event.reason());

        saveNotification(Long.parseLong(event.memberId()), event.memberEmail(), subject, message, NotificationType.EMAIL);
    }

    public void sendWelcomeEmail(MemberRegisteredEvent event) {
        log.info("Sending welcome email to {}", event.email());
        
        String subject = "Welcome to ULMS!";
        String message = String.format("Dear %s %s,\n\nWelcome to the Ultimate Library Management System. Your membership plan is %s.\n\nHappy Readng!", 
                event.firstName(), event.lastName(), event.membershipType());

        saveNotification(Long.parseLong(event.memberId()), event.email(), subject, message, NotificationType.EMAIL);
    }

    private void saveNotification(Long memberId, String email, String subject, String message, NotificationType type) {
        NotificationLog logEntry = NotificationLog.builder()
                .memberId(memberId)
                .recipientEmail(email)
                .subject(subject)
                .message(message)
                .type(type)
                // Simulate "sending" email by setting status to SENT immediately
                .status(NotificationStatus.SENT) 
                .build();
        
        notificationRepository.save(logEntry);
        log.debug("Saved notification log: {}", logEntry.getId());
    }

    public List<NotificationResponse> getMemberNotifications(Long memberId) {
        return notificationRepository.findByMemberIdOrderBySentAtDesc(memberId).stream()
                .map(logEntry -> NotificationResponse.builder()
                        .id(logEntry.getId())
                        .memberId(logEntry.getMemberId())
                        .recipientEmail(logEntry.getRecipientEmail())
                        .subject(logEntry.getSubject())
                        .message(logEntry.getMessage())
                        .type(logEntry.getType())
                        .status(logEntry.getStatus())
                        .sentAt(logEntry.getSentAt())
                        .build())
                .collect(Collectors.toList());
    }
}
