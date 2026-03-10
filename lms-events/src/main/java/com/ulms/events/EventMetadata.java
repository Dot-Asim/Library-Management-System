package com.ulms.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;
import java.util.UUID;

/**
 * Base metadata included in every domain event.
 */
public record EventMetadata(
    String eventId,

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    Instant timestamp
) {
    public static EventMetadata now() {
        return new EventMetadata(UUID.randomUUID().toString(), Instant.now());
    }
}
