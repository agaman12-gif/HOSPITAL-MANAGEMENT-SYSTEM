package com.example.hospital.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
public class StaticResourceController {

    @GetMapping(value = "/styles.css", produces = "text/css")
    public ResponseEntity<String> styles() {
        try {
            return ResponseEntity.ok(new String(new ClassPathResource("static/styles.css").getInputStream().readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping(value = "/app.js", produces = "application/javascript")
    public ResponseEntity<String> appJs() {
        try {
            return ResponseEntity.ok(new String(new ClassPathResource("static/app.js").getInputStream().readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping(value = "/patient.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> patientPortal() {
        try {
            return ResponseEntity.ok(new String(new ClassPathResource("static/patient.html").getInputStream().readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping(value = "/patient.js", produces = "application/javascript")
    public ResponseEntity<String> patientPortalScript() {
        try {
            return ResponseEntity.ok(new String(new ClassPathResource("static/patient.js").getInputStream().readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
