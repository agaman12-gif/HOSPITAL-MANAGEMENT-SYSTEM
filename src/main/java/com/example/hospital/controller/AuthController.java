package com.example.hospital.controller;

import com.example.hospital.dto.AuthRequest;
import com.example.hospital.dto.AuthResponse;
import com.example.hospital.entity.Role;
import com.example.hospital.entity.User;
import com.example.hospital.repository.UserRepository;
import com.example.hospital.entity.Patient;
import com.example.hospital.repository.PatientRepository;
import com.example.hospital.config.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Authentication endpoints: register and login.
 * Register is simplistic; in production you might add email verification and stronger validation.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PatientRepository patientRepository;

    public AuthController(AuthenticationManager authManager, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                          PatientRepository patientRepository) {
        this.authManager = authManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.patientRepository = patientRepository;
    }

    // Simple registration endpoint
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        // Default role: PATIENT for self-registration
        u.setRoles(Set.of(Role.ROLE_PATIENT));
        Patient patient = new Patient();
        patient.setFullName(req.getUsername());
        patient.setUser(u);
        userRepository.save(u);
        patientRepository.save(patient);
        return ResponseEntity.ok("User registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
            );
            User u = userRepository.findByUsername(req.getUsername()).orElseThrow();
            List<String> roles = u.getRoles().stream().map(Enum::name).toList();
            String token = jwtUtil.generateToken(u.getUsername(), roles);
            return ResponseEntity.ok(new AuthResponse(token, u.getUsername(), roles));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }
}
