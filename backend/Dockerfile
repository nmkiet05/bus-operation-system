# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (cache improvement)
RUN mvn -B -e -C dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/bos-backend-*.jar app.jar
EXPOSE 8080
# Use 75% of container memory for Heap to avoid OOM
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
