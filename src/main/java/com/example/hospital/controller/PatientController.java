package com.example.hospital.controller;

import com.example.hospital.entity.Patient;
import com.example.hospital.repository.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import org.springframework.security.core.Authentication;

/**
 * CRUD endpoints for Patient records.
 * Authorization is handled via the SecurityConfig; further role checks can be applied at method-level.
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientRepository patientRepository;
    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        return patientRepository.findByUserUsername(authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<Patient> p = patientRepository.findById(id);
        return p.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Patient create(@RequestBody Patient patient) {
        return patientRepository.save(patient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Patient patient) {
        return patientRepository.findById(id).map(existing -> {
            existing.setFullName(patient.getFullName());
            existing.setAddress(patient.getAddress());
            existing.setDateOfBirth(patient.getDateOfBirth());
            existing.setGender(patient.getGender());
            existing.setPhone(patient.getPhone());
            existing.setMedicalHistory(patient.getMedicalHistory());
            patientRepository.save(existing);
            return ResponseEntity.ok(existing);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return patientRepository.findById(id).map(p -> {
            patientRepository.delete(p);
            return ResponseEntity.ok().build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
