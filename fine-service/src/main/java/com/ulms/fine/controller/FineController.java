package com.ulms.fine.controller;

import com.ulms.fine.dto.FineResponse;
import com.ulms.fine.dto.PayFineRequest;
import com.ulms.fine.service.FineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<FineResponse>> getMemberFines(@PathVariable Long memberId) {
        return ResponseEntity.ok(fineService.getMemberFines(memberId));
    }

    @PostMapping("/{fineId}/pay")
    public ResponseEntity<?> payFine(@PathVariable Long fineId, @Valid @RequestBody PayFineRequest request) {
        try {
            FineResponse response = fineService.payFine(fineId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
