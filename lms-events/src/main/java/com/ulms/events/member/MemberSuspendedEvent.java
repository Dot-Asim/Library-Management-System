package com.ulms.events.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record MemberSuspendedEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String memberId,
    String reason
) {}
