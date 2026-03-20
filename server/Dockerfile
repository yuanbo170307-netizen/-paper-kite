FROM openjdk:8-jdk-alpine

WORKDIR /app

ADD target/appspaces-0.0.1-SNAPSHOT.jar /app/boot.jar

EXPOSE 40201

ENTRYPOINT ["java", \
    "-Xms512m", \
    "-Xmx1024m", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "/app/boot.jar"]
