package com.ulms.borrowing.controller;

import com.ulms.borrowing.dto.BorrowRequest;
import com.ulms.borrowing.dto.BorrowResponse;
import com.ulms.borrowing.dto.RenewRequest;
import com.ulms.borrowing.dto.ReturnRequest;
import com.ulms.borrowing.service.BorrowingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/borrows")
@RequiredArgsConstructor
public class BorrowingController {

    private final BorrowingService borrowingService;

    @GetMapping
    public ResponseEntity<List<BorrowResponse>> getAllBorrows() {
        return ResponseEntity.ok(borrowingService.getAllBorrows());
    }

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

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<BorrowResponse>> getMemberBorrows(@PathVariable Long memberId) {
        return ResponseEntity.ok(borrowingService.getMemberBorrows(memberId));
    }

    @PostMapping("/{borrowId}/renew")
    public ResponseEntity<?> renewBorrow(@PathVariable Long borrowId, @Valid @RequestBody RenewRequest request) {
        try {
            BorrowResponse response = borrowingService.renewBorrow(borrowId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
