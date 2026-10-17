package com.example.hospital.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.*;
import java.util.Date;

/**
 * Utility for creating and validating JWT tokens.
 * For production, keep the secret key safe and rotate regularly.
 */
@Component
public class JwtUtil {
    // Use a secure key; for demo, generated from a string. Replace for production.
    private final Key key = Keys.hmacShaKeyFor("replace-with-a-secure-secret-at-least-256-bits-long".getBytes());
    private final long expirationMs = 1000L * 60 * 60 * 4; // 4 hours

    public String generateToken(String username, List<String> roles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(username)
                .addClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException ex) {
            return false;
        }
    }

    public String getUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public List<String> getRoles(String token) {
        Object rolesClaim = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token)
                .getBody()
                .get("roles");

        if (rolesClaim instanceof Collection<?>) {
            Collection<?> roles = (Collection<?>) rolesClaim;
            List<String> roleNames = new ArrayList<>(roles.size());
            for (Object role : roles) {
                roleNames.add(String.valueOf(role));
            }
            return roleNames;
        }

        return Collections.emptyList();
    }
}
