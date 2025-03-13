# OFX Backend Service

A TypeScript-based Express backend service for handling currency exchange quotes and transfers.

## Features

-   Currency exchange quote generation
-   Transfer management with status tracking
-   SQLite database with Drizzle ORM
-   RESTful API endpoints
-   Exchange rate caching

## Prerequisites

-   Node.js (v16 or higher)
-   npm (v8 or higher)
-   SQLite3

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ofx-be
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```properties
PORT=3001
DB_FILE_NAME=file:ofx.db
```

## Database Setup

1. Generate database migrations:

```bash
npm run db:generate
```

2. Run migrations:

```bash
npm run db:migrate
```

3. Seed the database with sample data:

```bash
npm run db:seed
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm run prod
```

### Running Tests

```bash
npm test
```

## API Endpoints

### Quotes

-   `POST /api/transfers/quote` - Create a new quote
-   `GET /api/transfers/quote/:quoteId` - Retrieve a specific quote

### Transfers

-   `POST /api/transfers` - Create a new transfer
-   `GET /api/transfers/:transferId` - Retrieve a specific transfer

## Viewing Database

1. Using SQLite CLI:

```bash
sqlite3 ofx.db
.tables
SELECT * FROM quotes;
```

2. Using VS Code Extension:

-   Install "SQLite Viewer" extension
-   Right-click on `ofx.db`
-   Select "Open With..." → "SQLite Viewer"

3. Using the built-in viewer:

```bash
npm run db:view
```

## Development

### Project Structure

```
ofx-be/
├── src/
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── handlers/
│   │   └── transfers.ts
│   ├── services/
│   │   └── exchange-rate-service.ts
│   ├── app.ts
│   ├── index.ts
│   └── router.ts
├── tests/
│   └── transfers.test.ts
├── scripts/
│   └── seed.ts
└── package.json
```

### Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run prod` - Run production server
-   `npm test` - Run tests
-   `npm run db:generate` - Generate database migrations
-   `npm run db:migrate` - Run database migrations
-   `npm run db:seed` - Seed database with sample data
-   `npm run view` - View database contents

## Author

Karthik Peerlagudem
