package com.ulms.catalog.controller;

import com.ulms.catalog.dto.BookCopyDto;
import com.ulms.catalog.dto.BookDto;
import com.ulms.catalog.model.BookCopyStatus;
import com.ulms.catalog.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookDto>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @PostMapping
    public ResponseEntity<BookDto> createBook(@Valid @RequestBody BookDto bookDto) {
        return new ResponseEntity<>(bookService.createBook(bookDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookDto> updateBook(@PathVariable Long id, @Valid @RequestBody BookDto bookDto) {
        return ResponseEntity.ok(bookService.updateBook(id, bookDto));
    }

    @PostMapping("/copies")
    public ResponseEntity<BookCopyDto> addBookCopy(@Valid @RequestBody BookCopyDto copyDto) {
        return new ResponseEntity<>(bookService.addBookCopy(copyDto), HttpStatus.CREATED);
    }

    @PatchMapping("/copies/{copyId}/status")
    public ResponseEntity<BookCopyDto> updateBookCopyStatus(
            @PathVariable Long copyId,
            @RequestParam BookCopyStatus status) {
        return ResponseEntity.ok(bookService.updateBookCopyStatus(copyId, status));
    }
}
