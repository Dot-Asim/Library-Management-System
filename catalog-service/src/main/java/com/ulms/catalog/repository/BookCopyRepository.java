package com.ulms.catalog.repository;

import com.ulms.catalog.model.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    Optional<BookCopy> findByBarcode(String barcode);
    List<BookCopy> findByBookId(Long bookId);
    Optional<BookCopy> findFirstByBookIdAndStatus(Long bookId, com.ulms.catalog.model.BookCopyStatus status);
    long countByBookIdAndStatus(Long bookId, com.ulms.catalog.model.BookCopyStatus status);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByBookId(Long bookId);
}
