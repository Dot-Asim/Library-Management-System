package com.ulms.fine.messaging;

import com.ulms.events.borrowing.BookReturnedEvent;
import com.ulms.fine.service.FineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BorrowReturnedConsumer {

    private final FineService fineService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.borrow-returned}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "borrow.book.returned"
    ))
    public void consumeBookReturnedEvent(BookReturnedEvent event) {
        log.info("Received BookReturnedEvent for borrowRecordId: {}", event.borrowRecordId());
        try {
            fineService.processBookReturned(event);
        } catch (Exception e) {
            log.error("Failed to process BookReturnedEvent: {}", e.getMessage(), e);
            throw e; // Rely on RabbitMQ retry / DLQ logic
        }
    }
}
