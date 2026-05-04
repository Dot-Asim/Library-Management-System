package com.ulms.notification.service;

import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import com.ulms.events.catalog.BookAddedEvent;
import com.ulms.events.catalog.BookDeletedEvent;
import com.ulms.events.fine.FineCreatedEvent;
import com.ulms.events.fine.FineCollectedEvent;
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
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationLogRepository notificationRepository;

    public void sendBorrowConfirmation(BookBorrowedEvent event) {
        log.info("Sending borrow confirmation to {} for book {}", event.memberEmail(), event.bookTitle());
        
        String subject = "Borrow Confirmation: " + event.bookTitle();
        String message = String.format("Dear Member,\n\nYou have successfully borrowed '%s'. Your due date is %s.\n\nEnjoy reading!", 
                event.bookTitle(), event.dueDate());

        saveNotification(safeParseLong(event.memberId()), event.memberEmail(), subject, message, NotificationType.EMAIL);
    }

    public void sendReturnConfirmation(BookReturnedEvent event) {
        log.info("Sending return confirmation for book copy {}", event.bookCopyId());
        
        String subject = "Book Returned & Available!";
        String message = String.format("Great news! '%s' was just returned by %s and is now available for borrowing.", 
                event.bookTitle(), event.memberEmail());

        // Global notification (memberId 0)
        saveNotification(0L, "all@ulms.local", subject, message, NotificationType.SYSTEM);
    }

    public void sendFineNotice(FineCreatedEvent event) {
        log.info("Sending fine notice to {} for amount {}", event.memberEmail(), event.amount());
        
        String subject = "Library Fine Issued";
        String message = String.format("Dear Member,\n\nA fine of $%.2f has been issued to your account. Reason: %s.\n\nPlease pay it promptly.", 
                event.amount(), event.reason());

        saveNotification(safeParseLong(event.memberId()), event.memberEmail(), subject, message, NotificationType.EMAIL);
    }

    public void sendWelcomeEmail(MemberRegisteredEvent event) {
        log.info("Sending welcome email to {}", event.email());
        
        String subject = "Welcome to ULMS!";
        String message = String.format("Dear %s %s,\n\nWelcome to the Ultimate Library Management System. Your membership plan is %s.\n\nHappy Readng!", 
                event.firstName(), event.lastName(), event.membershipType());

        saveNotification(safeParseLong(event.memberId()), event.email(), subject, message, NotificationType.APP);
    }

    public void sendNewBookNotification(BookAddedEvent event) {
        log.info("Creating notification for new book: {}", event.title());
        
        String subject = "New Book Available: " + event.title();
        String message = String.format("Exciting news! '%s' has just been added to our catalog. Check it out now!", 
                event.title());

        // Global notification (memberId 0)
        saveNotification(0L, "all@ulms.local", subject, message, NotificationType.SYSTEM);
    }

    public void sendBookDeletedNotification(BookDeletedEvent event) {
        log.info("Creating notification for deleted book: {}", event.bookId());
        
        String subject = "Book Removed from Catalog";
        String message = String.format("Notice: A book with ID '%s' has been removed from our catalog.", 
                event.bookId());

        // Global notification (memberId 0)
        saveNotification(0L, "all@ulms.local", subject, message, NotificationType.SYSTEM);
    }

    public void sendFinePaidNotice(FineCollectedEvent event) {
        log.info("Sending fine paid notice to member {} for amount {}", event.memberId(), event.amount());
        
        String subject = "Fine Payment Confirmation";
        String message = String.format("Dear Member,\n\nWe have received your payment of $%.2f via %s. Thank you!", 
                event.amount(), event.paymentMethod());

        saveNotification(safeParseLong(event.memberId()), "member_" + event.memberId() + "@system.local", subject, message, NotificationType.EMAIL);
    }

    public void sendDueDateReminder(Long memberId, String email, String bookTitle, int daysLeft) {
        String subject = "Due Date Reminder: " + bookTitle;
        String message = String.format("Heads up! Your borrowed book '%s' is due in %d days. Please return or renew it to avoid fines.", 
                bookTitle, daysLeft);

        saveNotification(memberId, email, subject, message, NotificationType.APP);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    private void saveNotification(Long memberId, String email, String subject, String message, NotificationType type) {
        try {
            NotificationLog logEntry = NotificationLog.builder()
                    .memberId(memberId)
                    .recipientEmail(email)
                    .subject(subject)
                    .message(message)
                    .type(type)
                    .status(NotificationStatus.SENT) 
                    .build();
            
            notificationRepository.save(logEntry);
            log.debug("Saved notification log: {}", logEntry.getId());
        } catch (Exception e) {
            log.error("CRITICAL: Failed to save notification log for member {}: {}", memberId, e.getMessage());
        }
    }

    private Long safeParseLong(String id) {
        if (id == null || id.isEmpty() || "null".equalsIgnoreCase(id)) {
            return 0L;
        }
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            log.warn("Invalid ID format received: {}. Defaulting to 0.", id);
            return 0L;
        }
    }

    public List<NotificationResponse> getMemberNotifications(Long memberId) {
        // Fetch specific member notifications + Global notifications (memberId 0)
        List<NotificationLog> all = notificationRepository.findByMemberIdOrderBySentAtDesc(memberId);
        if (memberId != 0L) {
            all.addAll(notificationRepository.findByMemberIdOrderBySentAtDesc(0L));
            all.sort((a, b) -> b.getSentAt().compareTo(a.getSentAt()));
        }

        return mapToResponses(all);
    }

    public List<NotificationResponse> getAllNotifications() {
        return mapToResponses(notificationRepository.findAll());
    }

    private List<NotificationResponse> mapToResponses(List<NotificationLog> logs) {
        return logs.stream()
                .map(logEntry -> NotificationResponse.builder()
                        .id(logEntry.getId())
                        .memberId(logEntry.getMemberId())
                        .recipientEmail(logEntry.getRecipientEmail())
                        .subject(logEntry.getSubject())
                        .message(logEntry.getMessage())
                        .type(logEntry.getType())
                        .status(logEntry.getStatus())
                        .isRead(logEntry.isRead())
                        .sentAt(logEntry.getSentAt())
                        .build())
                .collect(Collectors.toList());
    }
}
