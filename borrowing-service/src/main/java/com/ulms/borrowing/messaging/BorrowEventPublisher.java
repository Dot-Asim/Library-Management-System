package com.ulms.borrowing.messaging;

import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class BorrowEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${application.rabbitmq.exchange}")
    private String exchange;

    @Value("${application.rabbitmq.routing-keys.borrow-created}")
    private String borrowCreatedRoutingKey;

    @Value("${application.rabbitmq.routing-keys.borrow-returned}")
    private String borrowReturnedRoutingKey;

    public void publishBookBorrowedEvent(BookBorrowedEvent event) {
        log.info("Publishing BookBorrowedEvent for borrowRecordId: {}", event.borrowRecordId());
        rabbitTemplate.convertAndSend(exchange, borrowCreatedRoutingKey, event);
    }

    public void publishBookReturnedEvent(BookReturnedEvent event) {
        log.info("Publishing BookReturnedEvent for borrowRecordId: {}", event.borrowRecordId());
        rabbitTemplate.convertAndSend(exchange, borrowReturnedRoutingKey, event);
    }
}
