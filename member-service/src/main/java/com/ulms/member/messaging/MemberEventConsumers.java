package com.ulms.member.messaging;

import com.ulms.events.member.MemberRegisteredEvent;
import com.ulms.member.dto.MemberDto;
import com.ulms.member.model.Member;
import com.ulms.member.model.MemberStatus;
import com.ulms.member.model.MembershipPlan;
import com.ulms.member.repository.MemberRepository;
import com.ulms.member.repository.MembershipPlanRepository;
import com.ulms.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberEventConsumers {

    private final MemberRepository memberRepository;
    private final MembershipPlanRepository planRepository;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "member.registration.queue", durable = "true"),
            exchange = @Exchange(value = "library.events", type = "topic", durable = "true"),
            key = "member.registered"
    ))
    public void consumeMemberRegisteredEvent(MemberRegisteredEvent event) {
        log.info("Received MemberRegisteredEvent for user: {}", event.email());
        
        try {
            if (memberRepository.findByUserId(event.userId()).isPresent()) {
                log.warn("Member already exists for user ID: {}", event.userId());
                return;
            }

            // Determine membership plan
            MembershipPlan plan = null;
            if (event.membershipPlanId() != null) {
                plan = planRepository.findById(event.membershipPlanId()).orElse(null);
            }
            
            if (plan == null) {
                // Fallback to name if ID not found or not provided
                String planName = event.membershipType() != null ? event.membershipType() : "Basic";
                // Capitalize first letter if needed
                planName = planName.substring(0, 1).toUpperCase() + planName.substring(1).toLowerCase();
                plan = planRepository.findByName(planName).orElse(null);
            }

            if (plan == null) {
                log.warn("Could not find membership plan for registration. Falling back to first available plan.");
                plan = planRepository.findAll().stream().findFirst().orElse(null);
            }

            Member member = Member.builder()
                    .userId(event.userId())
                    .firstName(event.firstName())
                    .lastName(event.lastName())
                    .email(event.email())
                    .membershipPlan(plan)
                    .status(MemberStatus.ACTIVE)
                    .joinedDate(LocalDate.now())
                    .expirationDate(LocalDate.now().plusYears(1))
                    .build();

            memberRepository.save(member);
            log.info("Member profile created for user: {}", event.email());
            
        } catch (Exception e) {
            log.error("Failed to create member profile: {}", e.getMessage(), e);
        }
    }
}
