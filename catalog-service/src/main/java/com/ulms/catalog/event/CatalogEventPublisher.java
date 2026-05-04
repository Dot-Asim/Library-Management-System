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
                book.getAuthor() != null ? book.getAuthor().getName() : "Unknown Author",
                book.getDescription(),
                book.getCategory() != null ? book.getCategory().getName() : "General",
                book.getIsbn(),
                book.getLanguage(),
                0, // Default pageCount
                book.getCoverImageUrl()
        );
        try {
            log.info("Publishing BookAddedEvent for book ID: {}", book.getId());
            rabbitTemplate.convertAndSend(catalogExchange, bookAddedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookAddedEvent for book ID: {}", book.getId());
        }
    }

    public void publishBookUpdatedEvent(Book book) {
        BookUpdatedEvent event = new BookUpdatedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                book.getId().toString(),
                book.getTitle(),
                book.getAuthor() != null ? book.getAuthor().getName() : "Unknown Author",
                book.getDescription(),
                book.getCategory() != null ? book.getCategory().getName() : "General",
                book.getIsbn()
        );
        try {
            log.info("Publishing BookUpdatedEvent for book ID: {}", book.getId());
            rabbitTemplate.convertAndSend(catalogExchange, bookUpdatedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookUpdatedEvent for book ID: {}", book.getId());
        }
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
        try {
            log.info("Publishing BookCopyStatusChangedEvent for copy ID: {}", copy.getId());
            rabbitTemplate.convertAndSend(catalogExchange, bookCopyStatusChangedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookCopyStatusChangedEvent for copy ID: {}", copy.getId());
        }
    }

    @Value("${application.rabbitmq.routing-keys.book-deleted:catalog.book.deleted}")
    private String bookDeletedRoutingKey;

    public void publishBookDeletedEvent(Long bookId) {
        log.info("Publishing BookDeletedEvent for book ID: {}", bookId);
        com.ulms.events.catalog.BookDeletedEvent event = new com.ulms.events.catalog.BookDeletedEvent(
                UUID.randomUUID().toString(),
                Instant.now(),
                bookId.toString()
        );
        try {
            rabbitTemplate.convertAndSend(catalogExchange, bookDeletedRoutingKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ disabled/unavailable. Skipping BookDeletedEvent for book ID: {}", bookId);
        }
    }
}
