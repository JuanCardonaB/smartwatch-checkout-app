# Smartwatch Checkout App

Full-stack checkout application for purchasing a smartwatch using a payment gateway. Built as a technical assessment emphasising clean architecture, type safety, and test coverage.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Test Results](#test-results)
- [Project Structure](#project-structure)
- [Deployed App](#deployed-app)

---

## Architecture

### Backend — Hexagonal Architecture + Ports & Adapters

Business logic lives exclusively in the application layer. The infrastructure layer (controllers, repositories, adapters) only wires things together.

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

Each module is fully decoupled — `TransactionsModule` communicates with `CustomersModule`, `ProductsModule`, and `DeliveriesModule` only through their exported use cases and repository ports.

### Frontend — Flux Architecture (Redux Toolkit)

```
UI Components → dispatch(action/thunk) → Redux Store → re-render
                                              │
                                    checkout.slice.ts
                                    (step, product, customer,
                                     card, delivery, transaction)
```

State is persisted to `localStorage` on every change, except `card` data (security) and `product` (always fetched fresh from the API).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Redux Toolkit, React Router v7, Tailwind CSS v4, Vite |
| **Backend runtime** | Node.js 22, TypeScript |
| **Backend framework** | NestJS 11 |
| **Architecture** | Hexagonal Architecture + Ports & Adapters |
| **Error handling** | Railway Oriented Programming (`Result<T,E>`) |
| **API docs** | Swagger (`@nestjs/swagger`) |
| **Validation** | `class-validator` + `class-transformer` |
| **Payment gateway** | Wompi sandbox |
| **Storage** | PostgreSQL 16 |
| **Image storage** | Cloudinary |
| **Tests** | Jest 30, `@testing-library/react` |

---

## Data Model

### Entity Relationships

```
Customer ──< Transaction >── Product
                │
                └──< Delivery
```

### Customer

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `string` | Full name |
| `email` | `string` | Unique — upserted by email |
| `phone` | `string` | Contact phone |
| `createdAt` | `Date` | Creation timestamp |

### Product

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `string` | Product name |
| `description` | `string` | Product description |
| `priceInCents` | `number` | Price in COP cents |
| `imageUrls` | `string[]` | Image URLs |
| `stock` | `number` | Available units |
| `createdAt` | `Date` | Creation timestamp |

### Transaction

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `reference` | `string` | Format: `SW-{uuid}` |
| `wompiId` | `string \| null` | Gateway transaction ID |
| `customerId` | `uuid` | FK → Customer |
| `productId` | `uuid` | FK → Product |
| `productAmountInCents` | `number` | Product price at time of purchase |
| `baseFeeInCents` | `number` | Fixed base fee: 300,000 ($3,000 COP) |
| `deliveryFeeInCents` | `number` | Fixed delivery fee: 500,000 ($5,000 COP) |
| `amountInCents` | `number` | Total: product + base + delivery |
| `status` | `enum` | `PENDING \| APPROVED \| DECLINED \| VOIDED \| ERROR` |
| `cardLastFour` | `string \| null` | Last 4 digits of card |
| `cardBrand` | `string \| null` | VISA, MASTERCARD, etc. |
| `deliveryId` | `string \| null` | FK → Delivery (set when APPROVED) |
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
| `status` | `enum` | `PENDING \| SHIPPED \| DELIVERED` |
| `createdAt` | `Date` | Creation timestamp |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Docker Desktop

### 1. Database (PostgreSQL via Docker)

```bash
# From the project root
docker compose up -d
```

This starts a PostgreSQL 16 container on **port 5433** (mapped to avoid conflicts with local installs).

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `smartwatch` |
| Username | `smartwatch` |
| Password | `smartwatch` |

> Tables are created automatically on first backend start (`synchronize: true` in dev).  
> The product seed also runs automatically on startup.

To stop the database:
```bash
docker compose down
```

To stop and delete all data:
```bash
docker compose down -v
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in Wompi and Cloudinary credentials (DB vars are pre-filled)
npm run start:dev
```

Server starts at `http://localhost:3000`. Swagger UI at `http://localhost:3000/api/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App starts at `http://localhost:5173`.

---

## API Documentation

### Swagger UI

```
http://localhost:3000/api/docs
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get product by ID |
| `PUT` | `/api/products/:id` | Update product |
| `POST` | `/api/products/images` | Upload product images |
| `GET` | `/api/customers` | List all customers |
| `POST` | `/api/customers` | Create customer |
| `GET` | `/api/customers/:id` | Get customer by ID |
| `POST` | `/api/transactions` | **Process payment** (full checkout orchestration) |
| `GET` | `/api/transactions` | List all transactions |
| `GET` | `/api/transactions/:id` | Get transaction by ID |
| `POST` | `/api/deliveries` | Create delivery |
| `GET` | `/api/deliveries` | List all deliveries |
| `GET` | `/api/deliveries/:id` | Get delivery by ID |
| `GET` | `/api/deliveries/transaction/:transactionId` | Get delivery by transaction |

### Checkout flow — `POST /api/transactions`

This single endpoint orchestrates the full checkout:

1. Upsert customer (find-or-create by email)
2. Validate product exists and has stock
3. Calculate total: `product + $3,000 base fee + $5,000 delivery fee`
4. Create a `PENDING` transaction
5. Tokenize card and call Wompi
6. Poll Wompi until final status (`APPROVED / DECLINED / ERROR`)
7. Update transaction with gateway result
8. If `APPROVED`: create delivery record and decrement stock
9. Return transaction + `deliveryId`

**Request body:**

```json
{
  "customer": {
    "name": "Juan Cardona",
    "email": "juan@example.com",
    "phone": "+573001234567"
  },
  "productId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "card": {
    "number": "4242424242424242",
    "holder": "JUAN CARDONA",
    "expMonth": "12",
    "expYear": "2028",
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

> All prices are in **COP cents**. Example: `100000000` = $1,000,000 COP.

**Wompi sandbox test cards:**

| Number | Brand | Result |
|---|---|---|
| `4242 4242 4242 4242` | VISA | APPROVED |
| `4111 1111 1111 1111` | VISA | DECLINED |

---

## Environment Variables

All variables live in `backend/.env`. Copy `.env.example` to `.env` and fill in your credentials. **Never commit `.env`.**

### Server

| Variable | Description |
|---|---|
| `PORT` | HTTP server port (default `3000`) |
| `FRONTEND_URL` | Allowed CORS origin |

### Database

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | PostgreSQL database name |

### Cloudinary — Image Storage

Product images are uploaded directly to [Cloudinary](https://cloudinary.com) and served via Cloudinary's CDN. The backend never writes image files to disk, which ensures images persist across server restarts and deployments (critical for platforms with ephemeral filesystems such as Render.com's free plan).

| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloud name from your Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | API key from your Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | API secret from your Cloudinary dashboard |

Find these at **Cloudinary Dashboard → Settings → API Keys**.

When the admin removes an image from a product and saves, the image is also deleted from Cloudinary automatically — no orphaned files accumulate.

### Wompi — Payment Gateway

| Variable | Description |
|---|---|
| `WOMPI_API_URL` | Payment gateway base URL |
| `WOMPI_PUBLIC_KEY` | Gateway public key |
| `WOMPI_PRIVATE_KEY` | Gateway private key |
| `WOMPI_INTEGRITY_KEY` | Integrity hash key |
| `WOMPI_EVENTS_KEY` | Webhook events key |

---

## Security

### Backend

| Mechanism | Details |
|---|---|
| `helmet()` | Sets `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, and more on every API response |
| CORS | Requests accepted only from the frontend origin (`FRONTEND_URL` env var) |
| `ValidationPipe` | `whitelist: true` + `forbidNonWhitelisted: true` — unknown fields in request body are rejected with 400 |
| Rate limiting | `ThrottlerGuard` applied to the `POST /api/transactions` endpoint |

### Frontend

The following headers are set on every response via `vercel.json`:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Stops MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer info sent to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables browser APIs not used by the app |
| `Content-Security-Policy` | allowlist-based | Restricts script, style, and connection sources to trusted origins only |

### Sensitive data handling

- Credit card number and CVC are **never stored** in `localStorage` — they exist in Redux state only for the duration of the session.
- Only the last 4 digits and card brand are persisted after a transaction completes.

---

## Test Results

### Run tests

```bash
# Backend (from /backend)
npm run test:cov

# Frontend (from /frontend)
npm run test:cov
```

### Backend — Jest

```
Test Suites: 32 passed, 32 total
Tests:       188 passed, 188 total
Time:        ~1s
```

| Metric | Coverage |
|---|---|
| Statements | **91.94%** |
| Branches | **81.69%** |
| Functions | **95.55%** |
| Lines | **91.85%** |

### Frontend — Jest + Testing Library

```
Test Suites: 12 passed, 12 total
Tests:       151 passed, 151 total
Time:        ~3.3s
```

| Metric | Coverage |
|---|---|
| Statements | **89.39%** |
| Branches | **80.80%** |
| Functions | **81.15%** |
| Lines | **91.49%** |

---

## Project Structure

```
smartwatch-checkout-app/
├── backend/
│   ├── src/
│   │   ├── main.ts                        # Bootstrap: CORS, Swagger, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── shared/
│   │   │   └── result.ts                  # Result<T,E> = Ok<T> | Err<E>
│   │   └── contexts/
│   │       ├── customers/
│   │       │   ├── application/use-cases/ # CreateCustomer, GetCustomer, UpsertCustomer
│   │       │   ├── domain/                # Customer entity, CustomerEmail VO
│   │       │   └── infrastructure/        # Controller, JSON repository, DTOs
│   │       ├── deliveries/
│   │       │   ├── application/use-cases/ # CreateDelivery, GetDelivery
│   │       │   ├── domain/                # Delivery entity, DeliveryId VO
│   │       │   └── infrastructure/        # Controller, JSON repository, DTOs
│   │       ├── products/
│   │       │   ├── application/use-cases/ # GetProduct, UpdateStock, ListProducts
│   │       │   ├── domain/                # Product entity, ProductId VO
│   │       │   └── infrastructure/        # Controller, TypeORM repository, seed, DTOs
│   │       │       └── cloudinary.service.ts  # Upload & delete images via Cloudinary SDK
│   │       └── transactions/
│   │           ├── application/
│   │           │   ├── ports/             # PaymentGatewayPort (abstract)
│   │           │   └── use-cases/         # CreateTransaction, GetTransaction
│   │           ├── domain/                # Transaction entity, VOs, fee constants
│   │           └── infrastructure/
│   │               ├── adapters/          # WompiAdapter (implements PaymentGatewayPort)
│   │               ├── controllers/
│   │               ├── dtos/
│   │               └── repositories/
│   └── .env.example
│
└── frontend/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/index.ts
        ├── store/
        │   ├── index.ts
        │   └── slices/
        │       └── checkout.slice.ts      # Product, step, customer, card, delivery, transaction
        ├── services/
        │   └── api.ts                     # Axios — productsApi, transactionsApi
        ├── pages/
        │   ├── ProductPage/               # Step 1 — product display + buy button
        │   ├── CheckoutPage/              # Router: renders step 2/3/4
        │   └── AdminPage/                 # Product & order management
        └── components/
            ├── StepCardDelivery/          # Step 2 — card + delivery form (3D flip)
            ├── StepSummary/               # Step 3 — order summary (Material Backdrop)
            └── StepResult/                # Step 4 — APPROVED / DECLINED / ERROR screen
```

---

## Deployed App

| | URL |
|---|---|
| **Frontend** | https://smartwatch-checkout-app.vercel.app |
| **Backend API** | https://smartwatch-api-abwz.onrender.com/api |
| **Swagger UI** | https://smartwatch-api-abwz.onrender.com/api/docs |
| **Admin panel** | https://smartwatch-checkout-app.vercel.app/admin |

> The admin panel provides a lightweight view of products, transactions, and stock — useful for verifying end-to-end behaviour during the review.
