package com.ulms.search.repository;

import com.ulms.search.model.BookDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface BookSearchRepository extends ElasticsearchRepository<BookDocument, String> {
    List<BookDocument> findByTitleContainingIgnoreCase(String title);
    List<BookDocument> findByIsbn(String isbn);

    @org.springframework.data.elasticsearch.annotations.Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"authorName^2\", \"description\", \"isbn\"], \"fuzziness\": \"AUTO\"}}")
    List<BookDocument> findByTitleOrAuthorNameOrDescriptionOrIsbn(String q1, String q2, String q3, String q4);
}
