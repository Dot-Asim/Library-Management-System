package com.ulms.notification.repository;

import com.ulms.notification.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findByMemberIdOrderBySentAtDesc(Long memberId);
}
