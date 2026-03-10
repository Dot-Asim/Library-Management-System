package com.ulms.member.service;

import com.ulms.member.dto.MemberDto;
import com.ulms.member.event.MemberEventPublisher;
import com.ulms.member.model.Member;
import com.ulms.member.model.MemberStatus;
import com.ulms.member.model.MembershipPlan;
import com.ulms.member.repository.MemberRepository;
import com.ulms.member.repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final MembershipPlanRepository planRepository;
    private final MemberEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<MemberDto> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MemberDto getMemberById(Long id) {
        return memberRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Member not found: " + id));
    }

    @Transactional
    public MemberDto createMember(MemberDto memberDto) {
        if (memberRepository.findByUserId(memberDto.getUserId()).isPresent()) {
            throw new RuntimeException("User ID is already linked to a member");
        }
        if (memberRepository.findByEmail(memberDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        MembershipPlan plan = null;
        if (memberDto.getMembershipPlanId() != null) {
            plan = planRepository.findById(memberDto.getMembershipPlanId())
                    .orElseThrow(() -> new RuntimeException("Membership Plan not found"));
        }

        Member member = Member.builder()
                .userId(memberDto.getUserId())
                .firstName(memberDto.getFirstName())
                .lastName(memberDto.getLastName())
                .email(memberDto.getEmail())
                .phone(memberDto.getPhone())
                .address(memberDto.getAddress())
                .membershipPlan(plan)
                .status(MemberStatus.ACTIVE)
                .joinedDate(LocalDate.now())
                .build();

        if (memberDto.getExpirationDate() != null) {
            member.setExpirationDate(memberDto.getExpirationDate());
        } else {
            // Default 1-year validity for standard plans if not specified
            member.setExpirationDate(LocalDate.now().plusYears(1));
        }

        Member savedMember = memberRepository.save(member);
        
        eventPublisher.publishMemberRegisteredEvent(savedMember);

        return mapToDto(savedMember);
    }

    @Transactional
    public MemberDto updateMemberStatus(Long id, MemberStatus status, String reason) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        member.setStatus(status);
        Member updatedMember = memberRepository.save(member);

        if (status == MemberStatus.SUSPENDED) {
            eventPublisher.publishMemberSuspendedEvent(updatedMember, reason != null ? reason : "No reason provided");
        }

        return mapToDto(updatedMember);
    }

    private MemberDto mapToDto(Member member) {
        return MemberDto.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .address(member.getAddress())
                .status(member.getStatus())
                .membershipPlanId(member.getMembershipPlan() != null ? member.getMembershipPlan().getId() : null)
                .joinedDate(member.getJoinedDate())
                .expirationDate(member.getExpirationDate())
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();
    }
}
