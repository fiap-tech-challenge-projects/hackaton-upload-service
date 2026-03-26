# Upload Service

Upload and orchestration service for architecture diagram analysis. Receives diagram images, stores them in S3-compatible storage, persists metadata in PostgreSQL, and publishes analysis requests to RabbitMQ for downstream processing.

## Tech Stack

- **Runtime:** NestJS 11, TypeScript 5
- **Database:** PostgreSQL 15 via Prisma 6
- **Storage:** S3 / MinIO
- **Messaging:** RabbitMQ (amqplib)
- **Docs:** Swagger / OpenAPI

## Architecture

Clean Architecture with four layers:

```
src/
  domain/          # Entities, value objects, domain interfaces
  application/     # Use cases, DTOs, ports
  infra/           # Prisma, S3, RabbitMQ adapters
  interfaces/      # Controllers, guards, decorators
  shared/          # Filters, interceptors, utilities
  config/          # Configuration modules
```

## API Endpoints

| Method | Path                   | Description                             |
| ------ | ---------------------- | --------------------------------------- |
| `POST` | `/api/v1/analyses`     | Upload a diagram and create an analysis |
| `GET`  | `/api/v1/analyses`     | List all analyses                       |
| `GET`  | `/api/v1/analyses/:id` | Get analysis by ID                      |
| `GET`  | `/api/v1/health`       | Health check                            |

Swagger UI is available at `/api/v1/docs` when the service is running.

## Data Model

```prisma
model Analysis {
  id            String         @id @default(uuid())
  fileName      String
  fileUrl       String
  fileType      String
  fileSize      Int
  status        AnalysisStatus @default(RECEIVED)  // RECEIVED | PROCESSING | ANALYZED | ERROR
  reportId      String?
  errorMessage  String?
  correlationId String
  createdAt     DateTime
  updatedAt     DateTime
}
```

## Environment Variables

| Variable              | Description                   | Required | Default             |
| --------------------- | ----------------------------- | -------- | ------------------- |
| `NODE_ENV`            | Environment                   | No       | `development`       |
| `PORT`                | Server port                   | No       | `3001`              |
| `API_PREFIX`          | API route prefix              | No       | `/api/v1`           |
| `DATABASE_URL`        | PostgreSQL connection string  | Yes      | -                   |
| `S3_ENDPOINT`         | S3/MinIO endpoint             | Yes      | -                   |
| `S3_REGION`           | S3 region                     | No       | `us-east-1`         |
| `S3_ACCESS_KEY`       | S3 access key                 | Yes      | -                   |
| `S3_SECRET_KEY`       | S3 secret key                 | Yes      | -                   |
| `S3_BUCKET`           | S3 bucket name                | No       | `hackaton-diagrams` |
| `S3_FORCE_PATH_STYLE` | Force path-style URLs (MinIO) | No       | `true`              |
| `RABBITMQ_URL`        | RabbitMQ connection string    | Yes      | -                   |

## Running Locally

```bash
cp .env.example .env
# Edit .env with your local values

npm install
npx prisma generate
npx prisma migrate dev

npm run start:dev
```

## Tests

```bash
npm test              # Unit tests
npm run test:cov      # With coverage
npm run test:e2e      # End-to-end tests
```

## Docker

```bash
docker build -t upload-service .
docker run -p 3001:3001 --env-file .env upload-service
```

## License

UNLICENSED
