# ============================================================
# Dockerfile multi-stage del backend (Spring Boot)
# ------------------------------------------------------------
# Etapa 1 (build):  compila el JAR con Maven + JDK 17.
# Etapa 2 (runtime): imagen liviana solo con el JRE + el JAR.
# Resultado: artefacto final mas pequeno y seguro (sin Maven
# ni codigo fuente dentro de la imagen de produccion).
# ============================================================

# ---------- Etapa 1: construccion ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Cache de dependencias: primero el pom, luego el codigo
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests || true
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Etapa 2: ejecucion ----------
FROM eclipse-temurin:17-jre
WORKDIR /app
# wget se usa para el healthcheck de docker-compose
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
