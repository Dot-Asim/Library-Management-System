package com.ulms.search.messaging;

import com.ulms.events.catalog.BookAddedEvent;
import com.ulms.events.catalog.BookUpdatedEvent;
import com.ulms.search.service.SearchService;
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
public class CatalogEventConsumer {

    private final SearchService searchService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.catalog-events}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "catalog.book.added"
    ))
    public void consumeBookAddedEvent(BookAddedEvent event) {
        try {
            searchService.indexNewBook(event);
        } catch (Exception e) {
            log.error("Failed to index BookAddedEvent: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "${application.rabbitmq.queues.catalog-events}", durable = "true"),
            exchange = @Exchange(value = "${application.rabbitmq.exchange}", type = "topic", durable = "true"),
            key = "catalog.book.updated"
    ))
    public void consumeBookUpdatedEvent(BookUpdatedEvent event) {
         try {
            searchService.updateBookIndex(event);
        } catch (Exception e) {
            log.error("Failed to update BookUpdatedEvent index: {}", e.getMessage(), e);
            throw e;
        }
    }
}
