package com.ulms.events.fine;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record FineCreatedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String fineId,
    String memberId,
    double amount,
    String borrowRecordId,
    String reason,
    String memberEmail
) {}
