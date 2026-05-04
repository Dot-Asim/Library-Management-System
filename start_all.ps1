docker-compose up -d

$services = @(
    "api-gateway",
    "auth-service",
    "borrowing-service",
    "catalog-service",
    "fine-service",
    "member-service",
    "notification-service",
    "search-service"
)

foreach ($service in $services) {
    Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c", "mvnw.cmd", "spring-boot:run", "-pl", $service
}

cd frontend
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "dev"
