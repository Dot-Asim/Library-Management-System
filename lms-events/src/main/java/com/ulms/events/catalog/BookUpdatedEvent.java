package com.ulms.events.catalog;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record BookUpdatedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String bookId,
    String title,
    String isbn
) {}
