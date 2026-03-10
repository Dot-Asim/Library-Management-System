package com.ulms.catalog.event;

import com.ulms.catalog.model.Book;
import com.ulms.catalog.model.BookCopy;
import com.ulms.catalog.model.BookCopyStatus;
import com.ulms.events.catalog.BookAddedEvent;
import com.ulms.events.catalog.BookCopyStatusChangedEvent;
import com.ulms.events.catalog.BookUpdatedEvent;
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
public class CatalogEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${application.rabbitmq.exchanges.catalog}")
    private String catalogExchange;

    @Value("${application.rabbitmq.routing-keys.book-added}")
    private String bookAddedRoutingKey;

    @Value("${application.rabbitmq.routing-keys.book-updated}")
    private String bookUpdatedRoutingKey;

    @Value("${application.rabbitmq.routing-keys.book-copy-status-changed}")
    private String bookCopyStatusChangedRoutingKey;

    public void publishBookAddedEvent(Book book) {
        BookAddedEvent event = new BookAddedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                book.getId().toString(),
                book.getTitle(),
                book.getIsbn(),
                book.getLanguage(),
                0, // Default pageCount
                null // Default coverImageUrl
        );
        log.info("Publishing BookAddedEvent for book ID: {}", book.getId());
        rabbitTemplate.convertAndSend(catalogExchange, bookAddedRoutingKey, event);
    }

    public void publishBookUpdatedEvent(Book book) {
        BookUpdatedEvent event = new BookUpdatedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                book.getId().toString(),
                book.getTitle(),
                book.getIsbn()
        );
        log.info("Publishing BookUpdatedEvent for book ID: {}", book.getId());
        rabbitTemplate.convertAndSend(catalogExchange, bookUpdatedRoutingKey, event);
    }

    public void publishBookCopyStatusChangedEvent(BookCopy copy, BookCopyStatus previousStatus) {
        BookCopyStatusChangedEvent event = new BookCopyStatusChangedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                copy.getId().toString(),
                copy.getBook().getId().toString(),
                previousStatus != null ? previousStatus.name() : null,
                copy.getStatus().name()
        );
        log.info("Publishing BookCopyStatusChangedEvent for copy ID: {}", copy.getId());
        rabbitTemplate.convertAndSend(catalogExchange, bookCopyStatusChangedRoutingKey, event);
    }
}
