package com.ulms.borrowing.controller;

import com.ulms.borrowing.dto.BorrowRequest;
import com.ulms.borrowing.dto.BorrowResponse;
import com.ulms.borrowing.dto.ReturnRequest;
import com.ulms.borrowing.service.BorrowingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/borrows")
@RequiredArgsConstructor
public class BorrowingController {

    private final BorrowingService borrowingService;

    @PostMapping
    public ResponseEntity<?> borrowBook(@Valid @RequestBody BorrowRequest request) {
        try {
            BorrowResponse response = borrowingService.borrowBook(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/return")
    public ResponseEntity<?> returnBook(@Valid @RequestBody ReturnRequest request) {
        try {
            BorrowResponse response = borrowingService.returnBook(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
