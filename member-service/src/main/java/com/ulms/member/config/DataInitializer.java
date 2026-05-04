package com.ulms.member.config;

import com.ulms.member.model.MembershipPlan;
import com.ulms.member.repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final MembershipPlanRepository planRepository;

    @Override
    public void run(String... args) {
        seedMembershipPlans();
    }

    private void seedMembershipPlans() {
        log.info("Checking membership plans...");
        
        upsertPlan("Basic", 3, 14, BigDecimal.ZERO);
        upsertPlan("Student", 5, 21, BigDecimal.ZERO);
        upsertPlan("Premium", 10, 30, new BigDecimal("10.00"));
        upsertPlan("Faculty", 9999, 90, BigDecimal.ZERO);
        
        log.info("Membership plans synchronized.");
    }

    private void upsertPlan(String name, int maxBooks, int maxDays, BigDecimal fee) {
        planRepository.findByName(name).ifPresentOrElse(
            plan -> {
                plan.setMaxBooks(maxBooks);
                plan.setMaxDays(maxDays);
                plan.setFee(fee);
                planRepository.save(plan);
            },
            () -> {
                MembershipPlan plan = MembershipPlan.builder()
                        .name(name)
                        .maxBooks(maxBooks)
                        .maxDays(maxDays)
                        .fee(fee)
                        .build();
                planRepository.save(plan);
            }
        );
    }
}
