package com.ulms.events.borrowing;

import java.time.Instant;
import java.time.LocalDate;

public record BookDueDateReminderEvent(
    String eventId,
    Instant timestamp,
    String borrowRecordId,
    String memberId,
    String bookTitle,
    LocalDate dueDate,
    int daysRemaining
) {}
