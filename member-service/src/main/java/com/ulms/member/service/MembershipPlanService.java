package com.ulms.member.service;

import com.ulms.member.dto.MembershipPlanDto;
import com.ulms.member.model.MembershipPlan;
import com.ulms.member.repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MembershipPlanService {

    private final MembershipPlanRepository planRepository;

    @Transactional(readOnly = true)
    public List<MembershipPlanDto> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MembershipPlanDto getPlanById(Long id) {
        return planRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Plan not found: " + id));
    }

    @Transactional
    public MembershipPlanDto createPlan(MembershipPlanDto planDto) {
        if (planRepository.findByName(planDto.getName()).isPresent()) {
            throw new RuntimeException("Plan name already exists");
        }

        MembershipPlan plan = MembershipPlan.builder()
                .name(planDto.getName())
                .maxBooks(planDto.getMaxBooks())
                .maxDays(planDto.getMaxDays())
                .fee(planDto.getFee())
                .build();

        MembershipPlan savedPlan = planRepository.save(plan);
        return mapToDto(savedPlan);
    }

    private MembershipPlanDto mapToDto(MembershipPlan plan) {
        return MembershipPlanDto.builder()
                .id(plan.getId())
                .name(plan.getName())
                .maxBooks(plan.getMaxBooks())
                .maxDays(plan.getMaxDays())
                .fee(plan.getFee())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }
}
