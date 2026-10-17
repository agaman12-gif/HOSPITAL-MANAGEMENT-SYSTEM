Hospital Management System - Starter

This project is a starter Hospital Management System built with:
- Java 25
- Spring Boot (REST API)
- MySQL (JPA/Hibernate)
- JWT-based authentication
- Simple static HTML + JavaScript frontend (served from Spring static resources)

Run:
1. Configure src/main/resources/application.properties with your MySQL credentials.
2. Build & run: mvn spring-boot:run
3. Open http://localhost:8080/index.html
4. Default admin login: username=admin, password=admin123
5. New users can self-register as patients from the login page and will be assigned the patient role.

Structure: src/main/java/com/example/hospital/... and resources/static for frontend.
