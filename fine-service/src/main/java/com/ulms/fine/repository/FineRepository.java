package com.ulms.fine.repository;

import com.ulms.fine.model.Fine;
import com.ulms.fine.model.enums.FineStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByMemberId(Long memberId);
    List<Fine> findByMemberIdAndStatus(Long memberId, FineStatus status);
}
