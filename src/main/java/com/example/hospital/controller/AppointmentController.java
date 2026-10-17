package com.example.hospital.controller;

import com.example.hospital.entity.Appointment;
import com.example.hospital.entity.Patient;
import com.example.hospital.repository.AppointmentRepository;
import com.example.hospital.repository.DoctorRepository;
import com.example.hospital.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private static final DateTimeFormatter INPUT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AppointmentController(AppointmentRepository appointmentRepository,
                                 PatientRepository patientRepository,
                                 DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    @GetMapping
    public List<Appointment> list(Authentication authentication) {
        boolean patient = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_PATIENT".equals(authority.getAuthority()));
        return patient ? appointmentRepository.findByPatientUserUsername(authentication.getName())
                : appointmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Appointment> get(@PathVariable Long id, Authentication authentication) {
        boolean patient = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_PATIENT".equals(authority.getAuthority()));
        return patient ? appointmentRepository.findByIdAndPatientUserUsername(id, authentication.getName())
                : appointmentRepository.findById(id);
    }

    @PostMapping
    public Appointment create(@RequestBody Map<String, Object> payload, Authentication authentication) {
        Appointment appointment = new Appointment();
        boolean patient = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_PATIENT".equals(authority.getAuthority()));

        if (patient) {
            Patient patientProfile = patientRepository.findByUserUsername(authentication.getName())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Patient profile not found for this account."));
            appointment.setPatient(patientProfile);
        }

        Object patientPayload = payload.get("patient");
        if (!patient && patientPayload instanceof Map) {
            Map<?, ?> patientMap = (Map<?, ?>) patientPayload;
            Object patientId = patientMap.get("id");
            if (patientId instanceof Number) {
                Number number = (Number) patientId;
                patientRepository.findById(number.longValue()).ifPresent(appointment::setPatient);
            }
        }

        Object doctorPayload = payload.get("doctor");
        if (doctorPayload instanceof Map) {
            Map<?, ?> doctorMap = (Map<?, ?>) doctorPayload;
            Object doctorId = doctorMap.get("id");
            if (doctorId instanceof Number) {
                Number number = (Number) doctorId;
                if (patient) {
                    appointment.setDoctor(doctorRepository.findById(number.longValue())
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST, "Selected doctor was not found.")));
                } else {
                    doctorRepository.findById(number.longValue()).ifPresent(appointment::setDoctor);
                }
            }
        }

        Object appointmentTimePayload = payload.get("appointmentTime");
        if (appointmentTimePayload instanceof String) {
            String appointmentTimeText = (String) appointmentTimePayload;
            try {
                appointment.setAppointmentTime(LocalDateTime.parse(appointmentTimeText, INPUT_FORMATTER));
            } catch (java.time.format.DateTimeParseException ignored) {
                try {
                    appointment.setAppointmentTime(LocalDateTime.parse(appointmentTimeText));
                } catch (java.time.format.DateTimeParseException ex) {
                    if (patient) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Please provide a valid appointment date and time.", ex);
                    }
                    throw ex;
                }
            }
        }

        if (patient && appointment.getDoctor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a valid doctor.");
        }
        if (patient && appointment.getAppointmentTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide an appointment date and time.");
        }

        Object notesPayload = payload.get("notes");
        if (notesPayload instanceof String) {
            appointment.setNotes((String) notesPayload);
        }

        Object statusPayload = payload.get("status");
        if (statusPayload instanceof String) {
            appointment.setStatus((String) statusPayload);
        }

        return appointmentRepository.save(appointment);
    }

    public Appointment create(Map<String, Object> payload) {
        return create(payload, null);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable Long id, @RequestBody Appointment appointment) {
        appointment.setId(id);
        return appointmentRepository.save(appointment);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        appointmentRepository.deleteById(id);
    }
}
