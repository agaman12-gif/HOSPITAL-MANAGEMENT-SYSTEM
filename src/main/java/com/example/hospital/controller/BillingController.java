package com.example.hospital.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BillingController {

    @GetMapping("/billing")
    public List<Map<String, Object>> getAllBilling() {
        return List.of(
                Map.of(
                        "invoice", "INV-1042",
                        "patient", "Naina K",
                        "amount", "₹420",
                        "status", "Paid",
                        "date", "2026-07-29"
                ),
                Map.of(
                        "invoice", "INV-1043",
                        "patient", "Sanjay R",
                        "amount", "₹295",
                        "status", "Pending",
                        "date", "2026-07-30"
                ),
                Map.of(
                        "invoice", "INV-1044",
                        "patient", "Mina T",
                        "amount", "₹610",
                        "status", "Paid",
                        "date", "2026-07-31"
                )
        );
    }
}
