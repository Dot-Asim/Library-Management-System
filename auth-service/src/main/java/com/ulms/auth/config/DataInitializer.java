package com.ulms.auth.config;

import com.ulms.auth.model.Role;
import com.ulms.auth.model.User;
import com.ulms.auth.model.UserStatus;
import com.ulms.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.ulms.auth.event.AuthEventPublisher eventPublisher;

    @Override
    public void run(String... args) {
        seedUsers();
    }

    private void seedUsers() {
        seedUser("admin@ulms.com", "Admin@2026", "System", "Admin", Role.ADMIN);
        seedUser("librarian@ulms.com", "librarian123", "Head", "Librarian", Role.LIBRARIAN);
        seedUser("student@ulms.com", "student123", "John", "Student", Role.STUDENT);
        seedUser("faculty@ulms.com", "faculty123", "Dr.", "Professor", Role.FACULTY);
    }

    private void seedUser(String email, String password, String first, String last, Role role) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.info("Seeding user: {}", email);
            user = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .firstName(first)
                    .lastName(last)
                    .role(role)
                    .status(UserStatus.ACTIVE)
                    .build();
            user = userRepository.save(user);
        }
        
        // Always ensure Member Service has a profile for this user
        eventPublisher.publishMemberRegistered(user, 1L);
    }
}
