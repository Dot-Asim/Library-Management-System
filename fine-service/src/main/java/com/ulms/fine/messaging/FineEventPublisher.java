package com.ulms.fine.messaging;

import com.ulms.events.fine.FineCollectedEvent;
import com.ulms.events.fine.FineCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FineEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${application.rabbitmq.exchange}")
    private String exchange;

    @Value("${application.rabbitmq.routing-keys.fine-created}")
    private String fineCreatedRoutingKey;

    @Value("${application.rabbitmq.routing-keys.fine-collected}")
    private String fineCollectedRoutingKey;

    public void publishFineCreatedEvent(FineCreatedEvent event) {
        log.info("Publishing FineCreatedEvent for memberId: {} and fineId: {}", event.memberId(), event.fineId());
        rabbitTemplate.convertAndSend(exchange, fineCreatedRoutingKey, event);
    }

    public void publishFineCollectedEvent(FineCollectedEvent event) {
        log.info("Publishing FineCollectedEvent for memberId: {} and fineId: {}", event.memberId(), event.fineId());
        rabbitTemplate.convertAndSend(exchange, fineCollectedRoutingKey, event);
    }
}
