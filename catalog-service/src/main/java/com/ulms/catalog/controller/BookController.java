package com.ulms.catalog.controller;

import com.ulms.catalog.dto.BookCopyDto;
import com.ulms.catalog.dto.BookDto;
import com.ulms.catalog.model.BookCopyStatus;
import com.ulms.catalog.service.BookService;
import com.ulms.catalog.service.FileStorageService;
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
    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<java.util.Map<String, String>> uploadFile(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String fileName = fileStorageService.store(file);
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("contentUrl", "/api/v1/books/files/" + fileName);
        
        if (fileName.endsWith(".pdf")) {
            response.put("coverUrl", "/api/v1/books/files/" + fileName.replace(".pdf", ".png"));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<byte[]> getFile(@PathVariable String fileName) {
        try {
            java.nio.file.Path[] possiblePaths = {
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("..", "uploads"),
                java.nio.file.Paths.get("catalog-service", "uploads")
            };
            
            java.nio.file.Path filePath = null;
            for (java.nio.file.Path p : possiblePaths) {
                java.nio.file.Path checkPath = p.resolve(fileName).toAbsolutePath().normalize();
                if (java.nio.file.Files.exists(checkPath)) {
                    filePath = checkPath;
                    break;
                }
            }

            if (filePath == null) {
                filePath = java.nio.file.Paths.get("uploads").resolve(fileName).toAbsolutePath().normalize();
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (java.nio.file.Files.exists(filePath)) {
                String contentType = java.nio.file.Files.probeContentType(filePath);
                System.out.println("Serving file: " + fileName + " with content type: " + contentType);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                byte[] data = java.nio.file.Files.readAllBytes(filePath);

                return ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                        .contentLength(data.length)
                        .body(data);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<BookDto>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }
    
    @GetMapping("/{id}/available-copy")
    public ResponseEntity<BookCopyDto> getAvailableCopy(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getAvailableCopy(id));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }
}
