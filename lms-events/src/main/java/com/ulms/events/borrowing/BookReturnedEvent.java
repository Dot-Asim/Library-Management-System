package com.ulms.events.borrowing;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;
import java.time.LocalDate;

public record BookReturnedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String borrowRecordId,
    String memberId,
    String bookCopyId,
    String bookId,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate returnDate,
    int daysOverdue,
    double fineAmount
) {}
