package com.ulms.member.controller;

import com.ulms.member.dto.MemberDto;
import com.ulms.member.model.MemberStatus;
import com.ulms.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<List<MemberDto>> getAllMembers() {
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberDto> getMemberById(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMemberById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMemberByUserId(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(memberService.getMemberByUserId(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<MemberDto> createMember(@Valid @RequestBody MemberDto memberDto) {
        return new ResponseEntity<>(memberService.createMember(memberDto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MemberDto> updateMemberStatus(
            @PathVariable Long id,
            @RequestParam MemberStatus status,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(memberService.updateMemberStatus(id, status, reason));
    }

    @PatchMapping("/{id}/plan")
    public ResponseEntity<MemberDto> updateMemberPlan(
            @PathVariable Long id,
            @RequestParam Long planId) {
        return ResponseEntity.ok(memberService.updateMemberPlan(id, planId));
    }
}
