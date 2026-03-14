package com.ulms.search.service;

import com.ulms.events.catalog.BookAddedEvent;
import com.ulms.events.catalog.BookUpdatedEvent;
import com.ulms.search.model.BookDocument;
import com.ulms.search.repository.BookSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final BookSearchRepository bookSearchRepository;

    public void indexNewBook(BookAddedEvent event) {
        log.info("Indexing new book: {} ({})", event.title(), event.isbn());
        
        BookDocument document = BookDocument.builder()
                .id(event.bookId())
                .title(event.title())
                .isbn(event.isbn())
                .language(event.language())
                .pageCount(event.pageCount())
                .coverImageUrl(event.coverImageUrl())
                .build();
                
        bookSearchRepository.save(document);
        log.debug("Successfully indexed book into Elasticsearch: {}", document.getId());
    }

    public void updateBookIndex(BookUpdatedEvent event) {
        log.info("Updating book index for: {} ({})", event.title(), event.isbn());
        
        Optional<BookDocument> existingDocOpt = bookSearchRepository.findById(event.bookId());
        
        if (existingDocOpt.isPresent()) {
            BookDocument doc = existingDocOpt.get();
            doc.setTitle(event.title());
            doc.setIsbn(event.isbn());
            bookSearchRepository.save(doc);
            log.debug("Successfully updated book index: {}", doc.getId());
        } else {
            // If we missed the create event, create it now with available missing data
            log.warn("Book index not found for update, creating partial document: {}", event.bookId());
            BookDocument document = BookDocument.builder()
                    .id(event.bookId())
                    .title(event.title())
                    .isbn(event.isbn())
                    .build();
            bookSearchRepository.save(document);
        }
    }

    public List<BookDocument> searchBooks(String query) {
        log.info("Searching books with query: {}", query);
        // Fallback to find all if query is empty
        if (query == null || query.trim().isEmpty()) {
            return (List<BookDocument>) bookSearchRepository.findAll();
        }
        return bookSearchRepository.findByTitleContainingIgnoreCase(query);
    }
}
