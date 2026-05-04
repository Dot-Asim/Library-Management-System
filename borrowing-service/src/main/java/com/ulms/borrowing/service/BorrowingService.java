package com.ulms.borrowing.service;

import com.ulms.borrowing.dto.BorrowRequest;
import com.ulms.borrowing.dto.BorrowResponse;
import com.ulms.borrowing.dto.RenewRequest;
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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
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
        if (currentBorrows >= 10) { // Increased limit for dev/testing
            throw new RuntimeException("Borrow limit reached (Max 10 books)");
        }

        BorrowRecord record = BorrowRecord.builder()
                .memberId(request.getMemberId())
                .bookCopyId(request.getBookCopyId())
                .bookId(request.getBookId())
                .bookTitle(request.getBookTitle() != null ? request.getBookTitle() : "Unknown Title")
                .memberEmail(request.getMemberEmail() != null ? request.getMemberEmail() : "unknown@ulms.local")
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
                record.getBookTitle(),
                record.getDueDate(),
                record.getMemberEmail()
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
                record.getBookTitle() != null ? record.getBookTitle() : "A book",
                record.getMemberEmail() != null ? record.getMemberEmail() : "unknown@ulms.local",
                record.getReturnDate(),
                daysOverdue,
                0.0 // Fine service will calculate this eventually
        );
        eventPublisher.publishBookReturnedEvent(event);

        return mapToResponse(record);
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getMemberBorrows(Long memberId) {
        return borrowRepository.findByMemberId(memberId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BorrowResponse> getAllBorrows() {
        return borrowRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public BorrowResponse renewBorrow(Long borrowId, RenewRequest request) {
        BorrowRecord record = borrowRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("Borrow record not found"));

        if (!record.getMemberId().equals(request.getMemberId())) {
            throw new RuntimeException("Borrow record does not belong to this member");
        }

        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new RuntimeException("Cannot renew a returned book");
        }

        record.setDueDate(record.getDueDate().plusDays(14));
        if (record.getStatus() == BorrowStatus.OVERDUE) {
            record.setStatus(BorrowStatus.BORROWED);
        }

        BorrowRecord updatedRecord = borrowRepository.save(record);
        return mapToResponse(updatedRecord);
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
