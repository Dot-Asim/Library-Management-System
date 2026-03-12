package com.ulms.borrowing.repository;

import com.ulms.borrowing.model.BorrowRecord;
import com.ulms.borrowing.model.enums.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByMemberId(Long memberId);
    List<BorrowRecord> findByMemberIdAndStatus(Long memberId, BorrowStatus status);
    Optional<BorrowRecord> findByBookCopyIdAndStatus(Long bookCopyId, BorrowStatus status);
    int countByMemberIdAndStatus(Long memberId, BorrowStatus status);
}
