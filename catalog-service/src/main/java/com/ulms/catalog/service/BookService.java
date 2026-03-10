package com.ulms.catalog.service;

import com.ulms.catalog.dto.BookCopyDto;
import com.ulms.catalog.dto.BookDto;
import com.ulms.catalog.event.CatalogEventPublisher;
import com.ulms.catalog.model.Author;
import com.ulms.catalog.model.Book;
import com.ulms.catalog.model.BookCopy;
import com.ulms.catalog.model.BookCopyStatus;
import com.ulms.catalog.model.Category;
import com.ulms.catalog.repository.AuthorRepository;
import com.ulms.catalog.repository.BookCopyRepository;
import com.ulms.catalog.repository.BookRepository;
import com.ulms.catalog.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final BookCopyRepository bookCopyRepository;
    private final CatalogEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<BookDto> getAllBooks() {
        return bookRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookDto getBookById(Long id) {
        return bookRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Book not found: " + id));
    }

    @Transactional
    public BookDto createBook(BookDto bookDto) {
        if (bookRepository.findByIsbn(bookDto.getIsbn()).isPresent()) {
            throw new RuntimeException("Book ISBN already exists");
        }

        Author author = authorRepository.findById(bookDto.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found: " + bookDto.getAuthorId()));

        Category category = categoryRepository.findById(bookDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + bookDto.getCategoryId()));

        Book book = Book.builder()
                .title(bookDto.getTitle())
                .isbn(bookDto.getIsbn())
                .publicationYear(bookDto.getPublicationYear())
                .publisher(bookDto.getPublisher())
                .language(bookDto.getLanguage())
                .description(bookDto.getDescription())
                .author(author)
                .category(category)
                .build();

        Book savedBook = bookRepository.save(book);
        
        // Publish event
        eventPublisher.publishBookAddedEvent(savedBook);
        
        return mapToDto(savedBook);
    }

    @Transactional
    public BookDto updateBook(Long id, BookDto bookDto) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found: " + id));

        if (!book.getIsbn().equals(bookDto.getIsbn()) && bookRepository.findByIsbn(bookDto.getIsbn()).isPresent()) {
            throw new RuntimeException("Book ISBN already exists");
        }

        Author author = authorRepository.findById(bookDto.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found: " + bookDto.getAuthorId()));

        Category category = categoryRepository.findById(bookDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + bookDto.getCategoryId()));

        book.setTitle(bookDto.getTitle());
        book.setIsbn(bookDto.getIsbn());
        book.setPublicationYear(bookDto.getPublicationYear());
        book.setPublisher(bookDto.getPublisher());
        book.setLanguage(bookDto.getLanguage());
        book.setDescription(bookDto.getDescription());
        book.setAuthor(author);
        book.setCategory(category);

        Book updatedBook = bookRepository.save(book);

        // Publish event
        eventPublisher.publishBookUpdatedEvent(updatedBook);

        return mapToDto(updatedBook);
    }

    @Transactional
    public BookCopyDto addBookCopy(BookCopyDto copyDto) {
        if (bookCopyRepository.findByBarcode(copyDto.getBarcode()).isPresent()) {
            throw new RuntimeException("Barcode already exists");
        }

        Book book = bookRepository.findById(copyDto.getBookId())
                .orElseThrow(() -> new RuntimeException("Book not found: " + copyDto.getBookId()));

        BookCopy copy = BookCopy.builder()
                .book(book)
                .barcode(copyDto.getBarcode())
                .status(copyDto.getStatus())
                .condition(copyDto.getCondition())
                .build();

        BookCopy savedCopy = bookCopyRepository.save(copy);
        return mapToCopyDto(savedCopy);
    }

    @Transactional
    public BookCopyDto updateBookCopyStatus(Long copyId, BookCopyStatus newStatus) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new RuntimeException("BookCopy not found: " + copyId));

        BookCopyStatus oldStatus = copy.getStatus();
        if (oldStatus != newStatus) {
            copy.setStatus(newStatus);
            BookCopy updatedCopy = bookCopyRepository.save(copy);
            // Publish event
            eventPublisher.publishBookCopyStatusChangedEvent(updatedCopy, oldStatus);
            return mapToCopyDto(updatedCopy);
        }
        
        return mapToCopyDto(copy);
    }

    private BookDto mapToDto(Book book) {
        return BookDto.builder()
                .id(book.getId())
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .publicationYear(book.getPublicationYear())
                .publisher(book.getPublisher())
                .language(book.getLanguage())
                .description(book.getDescription())
                .authorId(book.getAuthor().getId())
                .categoryId(book.getCategory().getId())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }

    private BookCopyDto mapToCopyDto(BookCopy copy) {
        return BookCopyDto.builder()
                .id(copy.getId())
                .bookId(copy.getBook().getId())
                .barcode(copy.getBarcode())
                .status(copy.getStatus())
                .condition(copy.getCondition())
                .createdAt(copy.getCreatedAt())
                .updatedAt(copy.getUpdatedAt())
                .build();
    }
}
