package com.example.hospital.controller;

import com.example.hospital.entity.Appointment;
import com.example.hospital.entity.Doctor;
import com.example.hospital.entity.Patient;
import com.example.hospital.repository.AppointmentRepository;
import com.example.hospital.repository.DoctorRepository;
import com.example.hospital.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppointmentControllerTest {

    @Test
    void createShouldAcceptFrontendAppointmentPayloadAndSaveAppointment() {
        AppointmentRepository appointmentRepository = mock(AppointmentRepository.class);
        PatientRepository patientRepository = mock(PatientRepository.class);
        DoctorRepository doctorRepository = mock(DoctorRepository.class);

        when(patientRepository.findById(7L)).thenReturn(Optional.of(new Patient()));
        when(doctorRepository.findById(3L)).thenReturn(Optional.of(new Doctor()));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment appointment = invocation.getArgument(0);
            appointment.setId(88L);
            return appointment;
        });

        AppointmentController controller = new AppointmentController(
                appointmentRepository,
                patientRepository,
                doctorRepository
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("patient", Map.of("id", 7L));
        payload.put("doctor", Map.of("id", 3L));
        payload.put("appointmentTime", "2026-08-01T10:30:00");
        payload.put("notes", "Regression test");
        payload.put("status", "SCHEDULED");

        Appointment result = controller.create(payload);

        assertNotNull(result);
        assertEquals("Regression test", result.getNotes());
        assertEquals("SCHEDULED", result.getStatus());
        assertNotNull(result.getPatient());
        assertNotNull(result.getDoctor());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    void patientBookingShouldAssociateAuthenticatedPatientDoctorAndDateTime() {
        AppointmentRepository appointmentRepository = mock(AppointmentRepository.class);
        PatientRepository patientRepository = mock(PatientRepository.class);
        DoctorRepository doctorRepository = mock(DoctorRepository.class);
        Patient patient = new Patient();
        Doctor doctor = new Doctor();

        when(patientRepository.findByUserUsername("patient1")).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(3L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentController controller = new AppointmentController(
                appointmentRepository,
                patientRepository,
                doctorRepository
        );
        Map<String, Object> payload = new HashMap<>();
        payload.put("doctor", Map.of("id", 3L));
        payload.put("appointmentTime", "2026-08-01T10:30");
        payload.put("status", "Scheduled");
        var authentication = new UsernamePasswordAuthenticationToken(
                "patient1", "unused", List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));

        Appointment result = controller.create(payload, authentication);

        assertEquals(patient, result.getPatient());
        assertEquals(doctor, result.getDoctor());
        assertEquals(LocalDateTime.of(2026, 8, 1, 10, 30), result.getAppointmentTime());
        verify(appointmentRepository).save(any(Appointment.class));
    }
}
