package com.ulms.events.borrowing;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record ReservationCreatedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String reservationId,
    String memberId,
    String bookId,
    int queuePosition
) {}
