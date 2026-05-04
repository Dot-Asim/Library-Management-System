package com.ulms.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void generateHashes() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        System.out.println("HASH_START");
        System.out.println("Admin@2026: " + encoder.encode("Admin@2026"));
        System.out.println("librarian123: " + encoder.encode("librarian123"));
        System.out.println("HASH_END");
    }
}
