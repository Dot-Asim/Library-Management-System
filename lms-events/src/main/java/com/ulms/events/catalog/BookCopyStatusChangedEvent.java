package com.ulms.events.catalog;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record BookCopyStatusChangedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String bookCopyId,
    String bookId,
    String previousStatus,
    String newStatus
) {}
