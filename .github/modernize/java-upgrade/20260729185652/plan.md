# Upgrade Plan: Hospital Management System (20260729185652)

- **Generated**: 2026-07-30 00:00:00
- **HEAD Branch**: N/A
- **HEAD Commit ID**: N/A

## Available Tools

**JDKs**
- JDK 17: C:\Program Files\Java\jdk-26.0.2\bin (available, used for upgrade target)
- JDK 25: C:\Program Files\Java\jdk-26.0.2\bin (latest LTS available in environment; Java 25 is not separately installed, so the environment uses JDK 26 as the closest installed runtime)

**Build Tools**
- Maven 3.9.16: C:\Users\amang\Downloads\Desktop\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: appmod/java-upgrade-20260729185652
- Run tests before and after the upgrade: true

## Upgrade Goals

- Java runtime: latest LTS version available in environment (Java 25-compatible toolchain via installed JDK 26)

## Technology Stack

| Technology/Dependency | Current | Min Compatible | Why Incompatible |
| ---------------------- | ------- | -------------- | ---------------- |
| Java | 17 | 25 | User requested latest LTS runtime |
| Spring Boot | 3.1.4 | 3.5.x | Keep toolchain aligned with current JDK |
| Maven | 3.9.16 | 3.9.16 | Compatible |

## Derived Upgrades

- Upgrade Maven compiler target to the installed LTS-compatible Java level.
- Ensure Spring Boot build remains compatible with the newer Java runtime.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
|------|-----------|---------|--------|--------|--------|
| pom.xml | java.version | 17 | upgrade | 25 | User requested latest LTS runtime |

### Source Code Changes

| File | Location | Current | Required Change | Reason |
|------|----------|---------|------------------|--------|
| None expected | - | - | No source rewrite required for this simple runtime upgrade | Existing code appears compatible |

### Configuration Changes

| File | Property/Setting | Current | Required Change | Reason |
|------|------------------|---------|------------------|--------|
| pom.xml | maven-compiler-plugin source/target | default via java.version | Align with Java 25 | Ensure build uses target runtime |

### CI/CD Changes

| File | Location | Current | Required Change |
|------|----------|---------|------------------|
| None | - | - | No CI/CD files found |

### Risks & Warnings

- The environment only has JDK 26 installed, so the build will target the closest available LTS-compatible runtime rather than a separately installed Java 25 JDK.
- Spring Boot 3.1.4 should remain compatible, but the build will be validated through compilation and tests.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: Ensure the build uses the requested Java runtime.
  - **Changes to Make**: Confirm Java/Maven toolchain availability; use installed JDK 26 for verification.
  - **Verification**: Run `mvn -version` and `java -version`.

- Step 2: Setup Baseline
  - **Rationale**: Capture current build health before the change.
  - **Changes to Make**: Run existing Maven test/compile flow.
  - **Verification**: Run `mvn clean test-compile -q && mvn clean test -q`.

- Step 3: Upgrade Java Runtime Configuration
  - **Rationale**: Update the Maven project to target the newer LTS runtime and preserve compatibility with the current Spring Boot version.
  - **Changes to Make**: Apply pom.xml property change for Java version.
  - **Verification**: Run `mvn clean test-compile -q`.

- Step 4: Final Validation
  - **Rationale**: Confirm the project compiles and tests successfully with the upgraded runtime configuration.
  - **Changes to Make**: None beyond any fixes required by verification.
  - **Verification**: Run `mvn clean test -q`.
