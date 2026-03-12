package com.ulms.fine.service;

import com.ulms.events.borrowing.BookReturnedEvent;
import com.ulms.events.fine.FineCollectedEvent;
import com.ulms.events.fine.FineCreatedEvent;
import com.ulms.fine.dto.FineResponse;
import com.ulms.fine.dto.PayFineRequest;
import com.ulms.fine.messaging.FineEventPublisher;
import com.ulms.fine.model.Fine;
import com.ulms.fine.model.enums.FineStatus;
import com.ulms.fine.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final FineEventPublisher eventPublisher;

    private static final double DAILY_FINE_RATE = 1.0; // $1.00 per day

    @Transactional
    public void processBookReturned(BookReturnedEvent event) {
        log.info("Processing BookReturnedEvent for borrowRecordId: {}", event.borrowRecordId());

        if (event.daysOverdue() > 0) {
            double fineAmount = event.daysOverdue() * DAILY_FINE_RATE;
            log.info("Book is overdue by {} days. Calculating fine: ${}", event.daysOverdue(), fineAmount);

            Fine fine = Fine.builder()
                    .memberId(Long.parseLong(event.memberId()))
                    .borrowRecordId(Long.parseLong(event.borrowRecordId()))
                    .amount(fineAmount)
                    .status(FineStatus.UNPAID)
                    .build();

            fine = fineRepository.save(fine);

            FineCreatedEvent fineEvent = new FineCreatedEvent(
                    UUID.randomUUID().toString(),
                    Instant.now(),
                    String.valueOf(fine.getId()),
                    String.valueOf(fine.getMemberId()),
                    fine.getAmount(),
                    String.valueOf(fine.getBorrowRecordId()),
                    "Overdue return by " + event.daysOverdue() + " days",
                    "unknown@ulms.com" // Member service could enrich this
            );

            eventPublisher.publishFineCreatedEvent(fineEvent);
        } else {
            log.info("Book returned on time. No fine issued.");
        }
    }

    public List<FineResponse> getMemberFines(Long memberId) {
        return fineRepository.findByMemberId(memberId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FineResponse payFine(Long fineId, PayFineRequest request) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found"));

        if (!fine.getMemberId().equals(request.getMemberId())) {
            throw new RuntimeException("Fine does not belong to this member");
        }

        if (fine.getStatus() == FineStatus.PAID) {
            throw new RuntimeException("Fine is already paid");
        }

        if (request.getAmount() < fine.getAmount()) {
            throw new RuntimeException("Payment amount is less than the fine amount");
        }

        fine.setStatus(FineStatus.PAID);
        fine = fineRepository.save(fine);

        FineCollectedEvent event = new FineCollectedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                String.valueOf(fine.getId()),
                String.valueOf(fine.getMemberId()),
                fine.getAmount(),
                "CREDIT_CARD" // Simulated
        );
        eventPublisher.publishFineCollectedEvent(event);

        return mapToResponse(fine);
    }

    private FineResponse mapToResponse(Fine fine) {
        return FineResponse.builder()
                .id(fine.getId())
                .memberId(fine.getMemberId())
                .borrowRecordId(fine.getBorrowRecordId())
                .amount(fine.getAmount())
                .status(fine.getStatus())
                .issueDate(fine.getIssueDate())
                .build();
    }
}
