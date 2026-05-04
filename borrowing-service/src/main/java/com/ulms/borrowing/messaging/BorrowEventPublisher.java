package com.ulms.borrowing.messaging;

import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookDueDateReminderEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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
        try {
            log.info("Publishing BookBorrowedEvent for borrowRecordId: {}", event.borrowRecordId());
            rabbitTemplate.convertAndSend(exchange, borrowCreatedRoutingKey, event);
        } catch (Exception e) {
            log.error("Failed to publish BookBorrowedEvent for borrowRecordId: {}. Error: {}", event.borrowRecordId(), e.getMessage(), e);
        }
    }

    public void publishBookReturnedEvent(BookReturnedEvent event) {
        try {
            log.info("Publishing BookReturnedEvent for borrowRecordId: {}", event.borrowRecordId());
            rabbitTemplate.convertAndSend(exchange, borrowReturnedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookReturnedEvent for borrowRecordId: {}", event.borrowRecordId());
        }
    }

    public void publishDueDateReminder(BookDueDateReminderEvent event) {
        try {
            log.info("Publishing BookDueDateReminderEvent for member: {}", event.memberId());
            rabbitTemplate.convertAndSend(exchange, "borrow.reminder", event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookDueDateReminderEvent");
        }
    }
}
