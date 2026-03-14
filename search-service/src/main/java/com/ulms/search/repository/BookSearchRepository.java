package com.ulms.search.repository;

import com.ulms.search.model.BookDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface BookSearchRepository extends ElasticsearchRepository<BookDocument, String> {
    List<BookDocument> findByTitleContainingIgnoreCase(String title);
    List<BookDocument> findByIsbn(String isbn);
}
