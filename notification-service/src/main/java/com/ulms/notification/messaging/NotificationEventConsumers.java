package com.ulms.notification.messaging;

import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import com.ulms.events.fine.FineCreatedEvent;
import com.ulms.events.member.MemberRegisteredEvent;
import com.ulms.notification.service.NotificationService;
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
public class NotificationEventConsumers {

    private final NotificationService notificationService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.borrow-created}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "borrow.book.created"
    ))
    public void consumeBookBorrowedEvent(BookBorrowedEvent event) {
        try {
            notificationService.sendBorrowConfirmation(event);
        } catch (Exception e) {
            log.error("Failed to process BookBorrowedEvent for notification: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.borrow-returned}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "borrow.book.returned"
    ))
    public void consumeBookReturnedEvent(BookReturnedEvent event) {
         try {
            notificationService.sendReturnConfirmation(event);
        } catch (Exception e) {
            log.error("Failed to process BookReturnedEvent for notification: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.fine-created}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "fine.created"
    ))
    public void consumeFineCreatedEvent(FineCreatedEvent event) {
         try {
            notificationService.sendFineNotice(event);
        } catch (Exception e) {
            log.error("Failed to process FineCreatedEvent for notification: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.member-registered}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "member.registered"
    ))
    public void consumeMemberRegisteredEvent(MemberRegisteredEvent event) {
         try {
            notificationService.sendWelcomeEmail(event);
        } catch (Exception e) {
            log.error("Failed to process MemberRegisteredEvent for notification: {}", e.getMessage(), e);
            throw e;
        }
    }
}
