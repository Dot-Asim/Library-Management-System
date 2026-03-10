package com.ulms.events.member;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;

public record MemberRegisteredEvent(
    String eventId,
    @JsonFormat(shape = JsonFormat.Shape.STRING) Instant timestamp,
    String userId,
    String memberId,
    String firstName,
    String lastName,
    String email,
    String membershipType,
    String memberCardBarcode
) {}
