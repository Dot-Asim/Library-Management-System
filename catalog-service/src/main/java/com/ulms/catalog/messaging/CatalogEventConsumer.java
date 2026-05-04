package com.ulms.catalog.messaging;

import com.ulms.catalog.model.BookCopy;
import com.ulms.catalog.model.BookCopyStatus;
import com.ulms.catalog.repository.BookCopyRepository;
import com.ulms.events.borrowing.BookBorrowedEvent;
import com.ulms.events.borrowing.BookReturnedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CatalogEventConsumer {

    private final BookCopyRepository bookCopyRepository;

    @Transactional
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "catalog.book.borrowed.queue", durable = "true"),
            exchange = @Exchange(value = "library.events", type = "topic", durable = "true"),
            key = "borrow.book.created"
    ))
    public void consumeBookBorrowedEvent(BookBorrowedEvent event) {
        log.info("Catalog received BookBorrowedEvent for copy ID: {}", event.bookCopyId());
        try {
            Long copyId = Long.parseLong(event.bookCopyId());
            bookCopyRepository.findById(copyId).ifPresent(copy -> {
                copy.setStatus(BookCopyStatus.BORROWED);
                bookCopyRepository.save(copy);
                log.info("Updated copy {} status to BORROWED", copyId);
            });
        } catch (Exception e) {
            log.error("Failed to update book copy status on borrow: {}", e.getMessage());
        }
    }

    @Transactional
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "catalog.book.returned.queue", durable = "true"),
            exchange = @Exchange(value = "library.events", type = "topic", durable = "true"),
            key = "borrow.book.returned"
    ))
    public void consumeBookReturnedEvent(BookReturnedEvent event) {
        log.info("Catalog received BookReturnedEvent for copy ID: {}", event.bookCopyId());
        try {
            Long copyId = Long.parseLong(event.bookCopyId());
            bookCopyRepository.findById(copyId).ifPresent(copy -> {
                copy.setStatus(BookCopyStatus.AVAILABLE);
                bookCopyRepository.save(copy);
                log.info("Updated copy {} status to AVAILABLE", copyId);
            });
        } catch (Exception e) {
            log.error("Failed to update book copy status on return: {}", e.getMessage());
        }
    }
}
