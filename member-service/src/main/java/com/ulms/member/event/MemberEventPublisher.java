package com.ulms.member.event;

import com.ulms.events.member.MemberRegisteredEvent;
import com.ulms.events.member.MemberSuspendedEvent;
import com.ulms.member.model.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MemberEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${application.rabbitmq.exchanges.member}")
    private String memberExchange;

    @Value("${application.rabbitmq.routing-keys.member-registered}")
    private String memberRegisteredRoutingKey;

    @Value("${application.rabbitmq.routing-keys.member-suspended}")
    private String memberSuspendedRoutingKey;

    public void publishMemberRegisteredEvent(Member member) {
        String planName = member.getMembershipPlan() != null ? member.getMembershipPlan().getName() : "NONE";
        
        MemberRegisteredEvent event = new MemberRegisteredEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                member.getUserId().toString(),
                member.getId().toString(),
                member.getFirstName(),
                member.getLastName(),
                member.getEmail(),
                planName,
                member.getMembershipPlan() != null ? member.getMembershipPlan().getId() : null,
                "MC-" + member.getId() // Default dummy barcode as member cards are phase 2 or omitted
        );
        try {
            log.info("Publishing MemberRegisteredEvent for member ID: {}", member.getId());
            rabbitTemplate.convertAndSend(memberExchange, memberRegisteredRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping MemberRegisteredEvent for member ID: {}", member.getId());
        }
    }

    public void publishMemberSuspendedEvent(Member member, String reason) {
        MemberSuspendedEvent event = new MemberSuspendedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                member.getId().toString(),
                reason
        );
        try {
            log.info("Publishing MemberSuspendedEvent for member ID: {}", member.getId());
            rabbitTemplate.convertAndSend(memberExchange, memberSuspendedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping MemberSuspendedEvent for member ID: {}", member.getId());
        }
    }
}
