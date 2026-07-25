# Smartwatch Checkout App

Full-stack checkout application for purchasing a smartwatch using a payment gateway. Built as a technical assessment with emphasis on clean architecture, type safety, and test coverage.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Getting Started — Backend](#getting-started--backend)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Test Results](#test-results)
- [Project Structure](#project-structure)

---

## Architecture

The backend follows **Hexagonal Architecture (Ports & Adapters)** with one bounded context per domain module. Business logic lives exclusively in the application layer; the infrastructure layer (controllers, repositories, adapters) only wires things together.

```
┌─────────────────────────────────────────────┐
│                  HTTP Layer                 │
│            (NestJS Controllers)             │
└──────────────────┬──────────────────────────┘
                   │ DTOs / validation
┌──────────────────▼──────────────────────────┐
│             Application Layer               │
│   Use Cases (Railway Oriented Programming)  │
│        Result<T, E> = Ok<T> | Err<E>        │
└──────────┬───────────────────┬──────────────┘
           │ Domain entities   │ Ports (abstract)
┌──────────▼──────────┐  ┌────▼────────────────┐
│    Domain Layer     │  │  Infrastructure      │
│  Entities, VOs,     │  │  Repositories (JSON) │
│  Repository ports   │  │  Payment adapter     │
└─────────────────────┘  └─────────────────────┘
```

Each module is fully decoupled — the `TransactionsModule` communicates with `CustomersModule`, `ProductsModule`, and `DeliveriesModule` only through their exported use cases and repository ports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Framework | NestJS 11 |
| Architecture | Hexagonal Architecture + Ports & Adapters |
| Error handling | Railway Oriented Programming (`Result<T,E>`) |
| API docs | Swagger (`@nestjs/swagger`) |
| Validation | `class-validator` + `class-transformer` |
| Payment gateway | Wompi sandbox |
| Storage | JSON files (temporary — pre-database) |
| Tests | Jest 30 |

---

## Data Model

### Customer

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `string` | Full name |
| `email` | `string` | Unique — normalized to lowercase |
| `phone` | `string` | Contact phone |
| `createdAt` | `Date` | Creation timestamp |

### Product

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `string` | Product name |
| `description` | `string` | Product description |
| `priceInCents` | `number` | Price in COP cents |
| `imageUrl` | `string` | Image URL |
| `stock` | `number` | Available units |
| `createdAt` | `Date` | Creation timestamp |

### Transaction

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `reference` | `string` | Format: `SW-{uuid}` — visible in gateway dashboard |
| `wompiId` | `string \| null` | Gateway transaction ID |
| `customerId` | `uuid` | FK → Customer |
| `productId` | `uuid` | FK → Product |
| `productAmountInCents` | `number` | Product price at time of purchase |
| `baseFeeInCents` | `number` | Fixed base fee: 300,000 ($3,000 COP) |
| `deliveryFeeInCents` | `number` | Fixed delivery fee: 500,000 ($5,000 COP) |
| `amountInCents` | `number` | Total charged: product + base + delivery |
| `status` | `enum` | `PENDING \| APPROVED \| DECLINED \| VOIDED \| ERROR` |
| `cardLastFour` | `string \| null` | Last 4 digits of the card used |
| `cardBrand` | `string \| null` | Card brand (VISA, MASTERCARD, etc.) |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

### Delivery

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `transactionId` | `uuid` | FK → Transaction |
| `customerId` | `uuid` | FK → Customer |
| `recipientName` | `string` | Delivery recipient |
| `phone` | `string` | Contact phone |
| `address` | `string` | Street address |
| `city` | `string` | City |
| `department` | `string` | Department / State |
| `createdAt` | `Date` | Creation timestamp |

### Entity Relationships

```
Customer ──< Transaction >── Product
                │
                └──< Delivery
```

---

## Getting Started — Backend

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
cd backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Fill in your payment gateway credentials in .env
```

### Run in development

```bash
npm run start:dev
```

### Run in production

```bash
npm run build
npm run start:prod
```

The server starts on `http://localhost:3000` by default (configurable via `PORT` in `.env`).

On startup, the database is automatically seeded with the **Smartwatch Pro X1** product if it does not already exist.

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/docs
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List all products with stock |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/products` | Create a product |
| `PATCH` | `/api/products/:id/stock` | Update product stock |
| `POST` | `/api/customers` | Create a customer |
| `GET` | `/api/customers/:id` | Get customer by ID |
| `POST` | `/api/transactions` | Process a payment (full checkout orchestration) |
| `GET` | `/api/transactions/:id` | Get transaction by ID |
| `POST` | `/api/deliveries` | Create a delivery |
| `GET` | `/api/deliveries/:id` | Get delivery by ID |
| `GET` | `/api/deliveries/transaction/:transactionId` | Get delivery by transaction |

### Checkout flow — `POST /api/transactions`

This single endpoint orchestrates the full checkout process:

1. Upsert customer (find-or-create by email, update name and phone on match)
2. Validate product exists and has stock
3. Calculate total: `product price + $3,000 base fee + $5,000 delivery fee`
4. Create a `PENDING` transaction in storage
5. Tokenize card and call payment gateway
6. Update transaction with gateway result (`APPROVED / DECLINED / VOIDED / ERROR / PENDING`)
7. If `APPROVED`: create delivery record and decrement product stock
8. Return transaction with `deliveryId`

**Request body example:**

```json
{
  "customer": {
    "name": "Juan Cardona",
    "email": "juan@example.com",
    "phone": "+573001234567"
  },
  "productId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "card": {
    "number": "4111111111111111",
    "holder": "Juan Cardona",
    "expMonth": "12",
    "expYear": "2030",
    "cvc": "123"
  },
  "delivery": {
    "recipientName": "Juan Cardona",
    "phone": "+573001234567",
    "address": "Calle 123 #45-67",
    "city": "Bogotá",
    "department": "Cundinamarca"
  }
}
```

> All prices are in **COP cents**. Example: `29900000` = $299,000 COP.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | HTTP server port | `3000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `WOMPI_API_URL` | Payment gateway base URL | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `WOMPI_PUBLIC_KEY` | Gateway public key | `pub_stagtest_...` |
| `WOMPI_PRIVATE_KEY` | Gateway private key | `prv_stagtest_...` |
| `WOMPI_INTEGRITY_KEY` | Integrity hash key | `stagtest_integrity_...` |
| `WOMPI_EVENTS_KEY` | Webhook events key | `stagtest_events_...` |

Copy `.env.example` to `.env` and fill in your credentials. **Never commit `.env`.**

---

## Test Results

From the **project root** (runs all tests across the full project):

```bash
npm test
```

From the **backend folder** (with coverage report):

```bash
cd backend
npm run test:cov
```

### Results

```
Test Suites: 23 passed, 23 total
Tests:       115 passed, 115 total
Time:        ~1.8s
```

### Coverage by context (application + domain layers)

| Context | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **customers** — use cases | 76% | 72% | 66% | 72% |
| **customers** — domain | 88% | 100% | 50% | 88% |
| **customers** — domain/value-objects | 100% | 83% | 100% | 100% |
| **deliveries** — use cases | 100% | 83% | 100% | 100% |
| **deliveries** — domain | 94% | 100% | 67% | 94% |
| **products** — use cases | 100% | 85% | 100% | 100% |
| **products** — domain | 100% | 100% | 100% | 100% |
| **transactions** — use cases | 100% | 83% | 100% | 100% |
| **transactions** — domain | 100% | 100% | 100% | 100% |
| **transactions** — adapter (Wompi) | 100% | 67% | 100% | 100% |

> Infrastructure layers (JSON repositories, NestJS modules) are intentionally excluded from unit test coverage — they are validated through integration testing.

---

## Project Structure

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts                          # Bootstrap: CORS, Swagger, ValidationPipe
│   ├── shared/
│   │   └── result.ts                    # Result<T,E> = Ok<T> | Err<E>
│   └── contexts/
│       ├── customers/
│       │   ├── application/use-cases/   # CreateCustomer, GetCustomer, UpsertCustomer
│       │   ├── domain/                  # Customer entity, CustomerEmail VO, repository port
│       │   └── infrastructure/          # Controller, JSON repository, DTOs
│       ├── deliveries/
│       │   ├── application/use-cases/   # CreateDelivery, GetDelivery
│       │   ├── domain/                  # Delivery entity, DeliveryId VO, repository port
│       │   └── infrastructure/          # Controller, JSON repository, DTOs
│       ├── products/
│       │   ├── application/use-cases/   # CreateProduct, GetProduct, UpdateStock
│       │   ├── domain/                  # Product entity, ProductId VO, repository port
│       │   └── infrastructure/          # Controller, JSON repository, seed, DTOs
│       └── transactions/
│           ├── application/
│           │   ├── ports/               # PaymentGatewayPort (abstract)
│           │   └── use-cases/           # CreateTransaction, GetTransaction
│           ├── domain/                  # Transaction entity, VOs, fees constants
│           └── infrastructure/
│               ├── adapters/            # WompiAdapter (implements PaymentGatewayPort)
│               ├── controllers/
│               ├── dtos/
│               └── repositories/
├── data/                                # JSON storage (transactions, customers, etc.)
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```
