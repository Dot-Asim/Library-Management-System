package com.ulms.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        if (args.length > 0) {
            for (String arg : args) {
                System.out.println(arg + ": " + encoder.encode(arg));
            }
        } else {
            System.out.println("Admin@2026: " + encoder.encode("Admin@2026"));
            System.out.println("librarian123: " + encoder.encode("librarian123"));
            System.out.println("student123: " + encoder.encode("student123"));
            System.out.println("faculty123: " + encoder.encode("faculty123"));
        }
    }
}
