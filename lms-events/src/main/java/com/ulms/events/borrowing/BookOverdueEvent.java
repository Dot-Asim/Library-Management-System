package com.ulms.events.borrowing;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;
import java.time.LocalDate;

public record BookOverdueEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String borrowRecordId,
    String memberId,
    String bookCopyId,
    String bookId,
    String bookTitle,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate dueDate,
    int daysOverdue,
    String memberEmail
) {}
