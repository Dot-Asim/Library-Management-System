<![CDATA[<div align="center">

# 📚 ULMS — Ultimate Library Management System

### Enterprise-Grade Microservices Architecture

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

> *A production-grade, cloud-ready, event-driven distributed system designed to handle real-world library operations at scale.*

---

[Architecture](#architecture) • [Services](#microservices) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Roadmap](#roadmap)

</div>

---

## 🏗️ Architecture

ULMS is a **microservices-based** system with an **event-driven backbone** powered by RabbitMQ. Each service is independently deployable, scalable, and owns its own PostgreSQL database (Database-per-Service pattern).

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                 │
├─────────────────────────────────────────────────────────┤
│                  Spring Cloud API Gateway                │
│              (JWT Validation · Rate Limiting · CORS)     │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┤
│ Auth │Cata- │Mem-  │Bor-  │ Fine │Noti- │Search│ Libra  │
│ Svc  │log   │ber   │row   │ Svc  │fica- │ Svc  │  AI    │
│      │Svc   │Svc   │Svc   │      │tion  │      │        │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────┤
│          RabbitMQ (Event-Driven Message Broker)          │
├─────────────┬───────────────┬───────────────────────────┤
│ PostgreSQL  │     Redis     │      Elasticsearch        │
│ (per-svc DB)│  (Cache/JWT)  │    (Full-Text Search)     │
└─────────────┴───────────────┴───────────────────────────┘
```

## 🔧 Microservices

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 8080 | Request routing, JWT validation, rate limiting |
| **Auth Service** | 8081 | Registration, login, JWT + refresh tokens, RBAC |
| **Catalog Service** | 8082 | Books, authors, categories, physical copies |
| **Member Service** | 8083 | Member profiles, membership plans, cards |
| **Borrowing Service** | 8084 | Borrow, return, renew, reservations, policies |
| **Fine Service** | 8085 | Fine calculation, payments, waivers |
| **Notification Service** | 8086 | Email/SMS via RabbitMQ event consumers |
| **Search Service** | 8087 | Elasticsearch full-text search with facets |
| **Libra AI** | 8088 | AI assistant with RAG, LLM, agentic tools |

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Java 21, Spring Boot 3.3, Spring Cloud Gateway, Spring Security, Spring AMQP, Spring Data JPA |
| **Frontend** | Next.js 14, React, TailwindCSS, Zustand, TanStack Query, Recharts |
| **Data** | PostgreSQL 16, Redis 7, Elasticsearch 8, Qdrant (Vector DB) |
| **Messaging** | RabbitMQ 3 (Topic Exchange, Dead Letter Queues) |
| **AI** | Spring AI, OpenAI / Anthropic, RAG Pipeline, Sentence Transformers |
| **Infrastructure** | Docker, Docker Compose, Nginx, Prometheus, Grafana, ELK Stack, Zipkin |
| **DevOps** | GitHub Actions CI/CD, Kubernetes-ready manifests, Testcontainers |

## 🚀 Getting Started

### Prerequisites
- JDK 21 ([Adoptium](https://adoptium.net/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop/))
- Node.js 20+ ([Download](https://nodejs.org/))

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Dot-Asim/Library-Management-System.git
cd Library-Management-System

# Start infrastructure (PostgreSQL, Redis, RabbitMQ)
docker compose up -d

# Build all services (Maven Wrapper included)
./mvnw clean install -DskipTests

# Start individual services
./mvnw spring-boot:run -pl auth-service
./mvnw spring-boot:run -pl catalog-service
# ... etc

# Start frontend
cd frontend && npm install && npm run dev
```

## 📍 Roadmap

- [x] Phase 0: Project setup & architecture design
- [ ] Phase 1: Foundation (Auth + Catalog + Member services)
- [ ] Phase 2: Borrowing Engine (Borrow + Fine + Notification)
- [ ] Phase 3: Search & Discovery (Elasticsearch)
- [ ] Phase 4: Frontend (Next.js 14)
- [ ] Phase 5: Observability (Prometheus, Grafana, ELK, Zipkin)
- [ ] Phase 6: CI/CD & Production Readiness
- [ ] Phase 7: Libra AI Assistant (RAG + LLM)

## 📂 Project Structure

```
├── lms-events/              # Shared event POJOs (Maven module)
├── api-gateway/             # Spring Cloud Gateway
├── auth-service/            # JWT Authentication & RBAC
├── catalog-service/         # Book Catalog Management
├── member-service/          # Member Management
├── borrowing-service/       # Borrow/Return/Reserve Engine
├── fine-service/            # Fine Calculation & Payment
├── notification-service/    # Event-driven Notifications
├── search-service/          # Elasticsearch Full-Text Search
├── libra-service/           # Libra AI Assistant
├── frontend/                # Next.js 14 Application
├── infra/                   # Infrastructure configs
├── docker-compose.yml       # Full stack orchestration
└── pom.xml                  # Parent POM (Maven multi-module)
```

## 📝 Key Design Principles

- **Domain-Driven Design (DDD)** — Bounded contexts per microservice
- **Event-Driven Architecture** — Asynchronous RabbitMQ communication
- **Database-per-Service** — No cross-service DB joins
- **Cache-Aside Pattern** — Redis for frequently accessed data
- **CQRS** — Separate read/write paths via Search Service
- **Security First** — JWT + RBAC + rate limiting + OWASP compliance

## 👤 Author

**Muhammad Asim** — [GitHub](https://github.com/Dot-Asim)

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
]]>
