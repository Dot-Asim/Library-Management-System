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

> *A production-grade, cloud-ready, event-driven distributed system designed to handle real-world library operations at scale.*

---

[About](#-about) •
[Architecture](#-architecture) •
[Services](#-microservices) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[Roadmap](#-roadmap)

---

</div>

## 📖 About

**ULMS** (Ultimate Library Management System) is a full-stack, enterprise-grade library management platform built with a **microservices architecture**. It is designed to demonstrate real-world software engineering practices including event-driven communication, domain-driven design, and cloud-native deployment strategies.

### Why ULMS?

- **Real-World Complexity** — Not a simple CRUD app. ULMS handles borrowing policies, membership tiers, fine calculations, notification workflows, and AI-powered search.
- **Production Patterns** — Implements JWT authentication, RBAC, rate limiting, circuit breakers, dead-letter queues, and CQRS.
- **Scalable by Design** — Each microservice owns its database, communicates asynchronously via RabbitMQ, and is independently deployable.
- **Full Stack** — Java backend + Next.js frontend + Docker infrastructure + AI assistant.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication & RBAC** | JWT + refresh tokens, role-based access control, account lockout |
| 📚 **Catalog Management** | Books, authors, categories, physical copy tracking |
| 👥 **Member Management** | Member profiles, membership plans, library cards |
| 📤 **Borrowing Engine** | Borrow, return, renew, reserve with configurable policies |
| 💰 **Fine System** | Automatic fine calculation, payment processing, waivers |
| 🔔 **Notifications** | Event-driven email/SMS notifications via RabbitMQ |
| 🔍 **Full-Text Search** | Elasticsearch with faceted search and auto-suggest |
| 🤖 **AI Assistant** | RAG-powered library assistant with agentic capabilities |

---

## 🏗️ Architecture

ULMS follows a **microservices architecture** with an **event-driven backbone** powered by RabbitMQ. Each service is independently deployable, scalable, and owns its own PostgreSQL database following the **Database-per-Service** pattern.

```
┌─────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy                    │
├─────────────────────────────────────────────────────────┤
│             Spring Cloud API Gateway                    │
│        (JWT Validation · Rate Limiting · CORS)          │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────┤
│ Auth │Cata- │Mem-  │Bor-  │ Fine │Noti- │Search│ Libra  │
│ Svc  │log   │ber   │row   │ Svc  │fica- │ Svc  │  AI    │
│      │Svc   │Svc   │Svc   │      │tion  │      │        │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────┤
│          RabbitMQ (Event-Driven Message Broker)          │
├─────────────┬───────────────┬───────────────────────────┤
│ PostgreSQL  │     Redis     │     Elasticsearch         │
│ (per-svc DB)│  (Cache/JWT)  │  (Full-Text Search)       │
└─────────────┴───────────────┴───────────────────────────┘
```

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Domain-Driven Design** | Bounded contexts per microservice |
| **Event-Driven Architecture** | Asynchronous RabbitMQ communication |
| **Database-per-Service** | No cross-service DB joins |
| **Cache-Aside Pattern** | Redis for frequently accessed data |
| **CQRS** | Separate read/write paths via Search Service |
| **Security First** | JWT + RBAC + rate limiting + OWASP compliance |

---

## 🔧 Microservices

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| **API Gateway** | `8080` | Request routing, JWT validation, rate limiting | ✅ Live |
| **Auth Service** | `8081` | Registration, login, JWT + refresh tokens, RBAC | ✅ Live |
| **Catalog Service** | `8082` | Books, authors, categories, physical copies | ✅ Live |
| **Member Service** | `8083` | Member profiles, membership plans, cards | ✅ Live |
| **Borrowing Service** | `8084` | Borrow, return, renew, reservations, policies | 🔜 Phase 2 |
| **Fine Service** | `8085` | Fine calculation, payments, waivers | 🔜 Phase 2 |
| **Notification Service** | `8086` | Email/SMS via RabbitMQ event consumers | 🔜 Phase 2 |
| **Search Service** | `8087` | Elasticsearch full-text search with facets | 🔜 Phase 3 |
| **Libra AI** | `8088` | AI assistant with RAG, LLM, agentic tools | 🔜 Phase 7 |

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| Java 21 | Core language |
| Spring Boot 3.3 | Application framework |
| Spring Cloud Gateway | API routing & filtering |
| Spring Security | Authentication & authorization |
| Spring AMQP | RabbitMQ integration |
| Spring Data JPA | Database access (Hibernate ORM) |

### Frontend

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | React framework |
| TailwindCSS | Utility-first styling |
| Zustand | State management |
| TanStack Query | Data fetching & caching |
| Recharts | Data visualization |

### Data & Messaging

| Technology | Purpose |
|-----------|---------|
| PostgreSQL 16 | Primary database (per-service) |
| Redis 7 | Caching, JWT refresh tokens, rate limiting |
| RabbitMQ 3 | Event broker (Topic Exchange, DLQ) |
| Elasticsearch 8 | Full-text search |
| Qdrant | Vector DB for AI |

### Infrastructure & DevOps

| Technology | Purpose |
|-----------|---------|
| Docker & Docker Compose | Containerization & orchestration |
| Nginx | Reverse proxy |
| Prometheus & Grafana | Monitoring & dashboards |
| ELK Stack | Centralized logging |
| Zipkin | Distributed tracing |
| GitHub Actions | CI/CD pipeline |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Download |
|-------------|---------|----------|
| JDK | 21+ | [Adoptium](https://adoptium.net/) |
| Docker Desktop | Latest | [Docker](https://www.docker.com/products/docker-desktop/) |
| Node.js | 20+ | [Node.js](https://nodejs.org/) |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Dot-Asim/Library-Management-System.git
cd Library-Management-System

# 2. Start infrastructure (PostgreSQL, Redis, RabbitMQ, pgAdmin)
docker compose up -d

# 3. Build all services (Maven Wrapper included — no Maven install needed)
./mvnw clean install -DskipTests

# 4. Start services
java -jar auth-service/target/auth-service-1.0.0-SNAPSHOT.jar
java -jar catalog-service/target/catalog-service-1.0.0-SNAPSHOT.jar
java -jar member-service/target/member-service-1.0.0-SNAPSHOT.jar
java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar

# 5. (Optional) Start frontend
cd frontend && npm install && npm run dev
```

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | `ulms_admin` | `ulms_secret_2026` |
| RabbitMQ UI (`localhost:15672`) | `ulms` | `ulms_rabbit_2026` |
| pgAdmin (`localhost:5050`) | `admin@ulms.com` | `admin` |

### Verify It Works

```bash
# Register a new user
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ulms.com","password":"Demo1234!","firstName":"Demo","lastName":"User"}'

# Browse the catalog
curl http://localhost:8082/api/v1/books

# Check members
curl http://localhost:8083/api/v1/members

# All routes via Gateway
curl http://localhost:8080/api/v1/books
```

---

## 📍 Roadmap

- [x] **Phase 0** — Project setup & architecture design
- [x] **Phase 1** — Foundation (Auth + Catalog + Member services)
- [ ] **Phase 2** — Borrowing Engine (Borrow + Fine + Notification)
- [ ] **Phase 3** — Search & Discovery (Elasticsearch)
- [ ] **Phase 4** — Frontend (Next.js 14)
- [ ] **Phase 5** — Observability (Prometheus, Grafana, ELK, Zipkin)
- [ ] **Phase 6** — CI/CD & Production Readiness
- [ ] **Phase 7** — Libra AI Assistant (RAG + LLM)

---

## 📂 Project Structure

```
ULMS/
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
│   └── postgres/            # Database init scripts
├── docker-compose.yml       # Full stack orchestration
├── .env                     # Environment variables
└── pom.xml                  # Parent POM (Maven multi-module)
```

---

## 👤 Author

**Muhammad Asim** — [@Dot-Asim](https://github.com/Dot-Asim)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
]]>
