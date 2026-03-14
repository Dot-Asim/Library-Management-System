package com.ulms.search.controller;

import com.ulms.search.model.BookDocument;
import com.ulms.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<List<BookDocument>> searchBooks(@RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(searchService.searchBooks(q));
    }
}
