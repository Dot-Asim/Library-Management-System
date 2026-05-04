package com.ulms.borrowing.scheduler;

import com.ulms.borrowing.messaging.BorrowEventPublisher;
import com.ulms.borrowing.model.BorrowRecord;
import com.ulms.borrowing.model.enums.BorrowStatus;
import com.ulms.borrowing.repository.BorrowRecordRepository;
import com.ulms.events.borrowing.BookDueDateReminderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class BorrowingReminderScheduler {

    private final BorrowRecordRepository borrowRepository;
    private final BorrowEventPublisher eventPublisher;

    /**
     * Run every day at 10 AM to check for books due in 3 days.
     * For testing, we can set it to run more frequently.
     */
    @Scheduled(cron = "0 0 10 * * *")
    public void checkUpcomingDueDates() {
        log.info("Starting scheduled due date reminder check...");
        
        LocalDate reminderThreshold = LocalDate.now().plusDays(3);
        
        List<BorrowRecord> upcoming = borrowRepository.findByStatus(BorrowStatus.BORROWED).stream()
                .filter(r -> r.getDueDate().isEqual(reminderThreshold))
                .toList();
        
        log.info("Found {} records due in 3 days.", upcoming.size());
        
        for (BorrowRecord record : upcoming) {
            BookDueDateReminderEvent event = new BookDueDateReminderEvent(
                    UUID.randomUUID().toString(),
                    Instant.now(),
                    record.getId().toString(),
                    record.getMemberId().toString(),
                    "Your borrowed book", // Future: lookup title
                    record.getDueDate(),
                    3
            );
            eventPublisher.publishDueDateReminder(event);
        }
    }

    /**
     * Mark books as OVERDUE if they passed the due date.
     * Run every day at midnight.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void checkOverdueBooks() {
        log.info("Starting overdue book check...");
        
        List<BorrowRecord> overdue = borrowRepository.findByStatus(BorrowStatus.BORROWED).stream()
                .filter(r -> r.getDueDate().isBefore(LocalDate.now()))
                .toList();
        
        log.info("Found {} overdue records.", overdue.size());
        
        for (BorrowRecord record : overdue) {
            record.setStatus(BorrowStatus.OVERDUE);
            borrowRepository.save(record);
            // Future: Publish BookOverdueEvent
        }
    }
}
