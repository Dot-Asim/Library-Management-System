package com.ulms.borrowing.service;

import com.ulms.borrowing.dto.BorrowRequest;
import com.ulms.borrowing.dto.BorrowResponse;
import com.ulms.borrowing.dto.ReturnRequest;
import com.ulms.borrowing.messaging.BorrowEventPublisher;
import com.ulms.borrowing.model.BorrowRecord;
import com.ulms.borrowing.model.enums.BorrowStatus;
import com.ulms.borrowing.repository.BorrowRecordRepository;
import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BorrowingService {

    private final BorrowRecordRepository borrowRepository;
    private final BorrowEventPublisher eventPublisher;

    @Transactional
    public BorrowResponse borrowBook(BorrowRequest request) {
        log.info("Processing borrow request for member: {} and bookCopy: {}", request.getMemberId(), request.getBookCopyId());

        // Check if copy is already borrowed (simplified check here, real check would involve catalog-service sync via events)
        if (borrowRepository.findByBookCopyIdAndStatus(request.getBookCopyId(), BorrowStatus.BORROWED).isPresent()) {
            throw new RuntimeException("Book copy is currently borrowed.");
        }

        // Limit check
        int currentBorrows = borrowRepository.countByMemberIdAndStatus(request.getMemberId(), BorrowStatus.BORROWED);
        if (currentBorrows >= 3) { // Hardcoded to BASIC plan for now; in a real scenario we'd query member-service
            throw new RuntimeException("Borrow limit reached");
        }

        BorrowRecord record = BorrowRecord.builder()
                .memberId(request.getMemberId())
                .bookCopyId(request.getBookCopyId())
                .bookId(request.getBookId())
                .borrowDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(14))
                .status(BorrowStatus.BORROWED)
                .build();

        record = borrowRepository.save(record);

        BookBorrowedEvent event = new BookBorrowedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                String.valueOf(record.getId()),
                String.valueOf(record.getMemberId()),
                String.valueOf(record.getBookCopyId()),
                String.valueOf(record.getBookId()),
                "Unknown Title", // Future enhancement: capture title
                record.getDueDate(),
                "unknown@ulms.com" // Future enhancement: member info sync
        );
        eventPublisher.publishBookBorrowedEvent(event);

        return mapToResponse(record);
    }

    @Transactional
    public BorrowResponse returnBook(ReturnRequest request) {
        log.info("Processing return request for member: {} and bookCopy: {}", request.getMemberId(), request.getBookCopyId());

        BorrowRecord record = borrowRepository.findByBookCopyIdAndStatus(request.getBookCopyId(), BorrowStatus.BORROWED)
                .orElseThrow(() -> new RuntimeException("Active borrow record not found for this book copy"));
        
        if (!record.getMemberId().equals(request.getMemberId())) {
            throw new RuntimeException("Book was not borrowed by this member");
        }

        record.setReturnDate(LocalDate.now());
        record.setStatus(BorrowStatus.RETURNED);
        record = borrowRepository.save(record);

        int daysOverdue = 0;
        if (LocalDate.now().isAfter(record.getDueDate())) {
            daysOverdue = (int) java.time.temporal.ChronoUnit.DAYS.between(record.getDueDate(), LocalDate.now());
        }

        BookReturnedEvent event = new BookReturnedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                String.valueOf(record.getId()),
                String.valueOf(record.getMemberId()),
                String.valueOf(record.getBookCopyId()),
                String.valueOf(record.getBookId()),
                record.getReturnDate(),
                daysOverdue,
                0.0 // Fine service will calculate this eventually
        );
        eventPublisher.publishBookReturnedEvent(event);

        return mapToResponse(record);
    }

    private BorrowResponse mapToResponse(BorrowRecord record) {
        return BorrowResponse.builder()
                .id(record.getId())
                .memberId(record.getMemberId())
                .bookCopyId(record.getBookCopyId())
                .bookId(record.getBookId())
                .borrowDate(record.getBorrowDate())
                .dueDate(record.getDueDate())
                .returnDate(record.getReturnDate())
                .status(record.getStatus())
                .build();
    }
}
