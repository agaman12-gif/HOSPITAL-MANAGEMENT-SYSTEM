package com.example.hospital;

import com.example.hospital.entity.Role;
import com.example.hospital.entity.User;
import com.example.hospital.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Set;

/**
 * Main Spring Boot application entrypoint.
 */
@SpringBootApplication
public class HospitalApplication {
    public static void main(String[] args) {
        SpringApplication.run(HospitalApplication.class, args);
    }

    @Bean
    CommandLineRunner seedAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                    JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE user_roles MODIFY roles VARCHAR(30) NOT NULL");
            seedUser(userRepository, passwordEncoder, "admin", "admin123", Role.ROLE_ADMIN);
            seedUser(userRepository, passwordEncoder, "host", "host123", Role.ROLE_HOST);
        };
    }

    private void seedUser(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          String username, String password, Role role) {
        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    user.setPassword(passwordEncoder.encode(password));
                    user.setRoles(Set.of(role));
                    userRepository.save(user);
                },
                () -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setPassword(passwordEncoder.encode(password));
                    user.setRoles(Set.of(role));
                    userRepository.save(user);
                }
        );
    }
}
