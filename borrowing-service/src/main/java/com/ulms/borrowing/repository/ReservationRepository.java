package com.ulms.borrowing.repository;

import com.ulms.borrowing.model.Reservation;
import com.ulms.borrowing.model.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByBookIdAndStatusOrderByReservationDateAsc(Long bookId, ReservationStatus status);
    List<Reservation> findByMemberId(Long memberId);
    int countByMemberIdAndStatus(Long memberId, ReservationStatus status);
}
