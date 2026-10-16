# Personal Shopper

> A smart pantry inventory and cadence-driven shopping list web application built with Nuxt 4, Prisma 8, and deployed to  Cloudflare Workers.

Personal Shopper helps households track pantry staples, monitor stock levels, and predict replenishment needs with smart, frequency-based shopping suggestions.

## 📱 Mobile Showcase & Key Interactions

Below are live captures of key interactions running on mobile emulation:

| 1. Smart Frequency Learning | 2. Pantry Filter & Search | 3. Checklist & Trip History |
| :---: | :---: | :---: |
| ![Smart Frequency Anomaly Prompt](docs/assets/demo/anomaly-prompt.gif) | ![Pantry Filter and Search](docs/assets/demo/pantry-filter.gif) | ![Checking and Unchecking Shopping Items](docs/assets/demo/shopping-toggle.gif) |
| **Adaptive Cadence Prompt**<br>Adding an item earlier than planned triggers anomaly detection, allowing one-tap frequency learning. | **Instant Mobile Search**<br>Instant filtering across pantry inventory and categories with the illuminated mobile search action. | **One-Tap Checkoff & History**<br>Purchased items trigger celebration confetti and organize into collapsible session history. |

## Features

- **Cadence-Driven Suggestions**: Set replenishment cycles (daily, weekly, bi-weekly, monthly, or custom intervals). Personal Shopper automatically calculates when items are due or overdue.
- **Smart Frequency Learning**: Automatically tracks consumption patterns based on shopping frequency and cadence intervals.
- **Stock Tracking & Alerts**: Track in-stock vs. out-of-stock items; out-of-stock essentials are immediately flagged for purchase.
- **Interactive Shopping List**:
  - Add items directly or promote cadence suggestions with a single click.
  - Checking off an item automatically marks it in stock, records the purchase date, and resets its cadence timer.
  - Remove items without altering pantry stock history if you decide not to purchase them.
- **Full Pantry Management**: Categorize items, record custom units, specify quantities, and append item notes.
- **Responsive & Mobile Ready**: Single Page Application (SPA mode) optimized for mobile touch devices and prepared for Capacitor mobile compilation.

## Tech Stack

- **Framework**: [Nuxt 4.5.1](https://nuxt.com/) (configured in SPA mode with Nitro engine)
- **UI & Design**: [Nuxt UI 4.11.2](https://ui.nuxt.com/), [Tailwind CSS v4](https://tailwindcss.com/), [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **State Management**: [Pinia](https://pinia.vuejs.org/) via `@pinia/nuxt`
- **Database & ORM**: [Prisma 8](https://www.prisma.io/) (`@prisma/orm-postgres`) with PostgreSQL (Supabase)
- **Edge Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) via [Wrangler](https://developers.cloudflare.com/workers/wrangler/) with request-scoped DB pooling (`ctx.waitUntil(db.close())`)
- **Testing & Verification**: [Vitest](https://vitest.dev/) & [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing) with mocked Prisma client isolation, ESLint 10, and TypeScript 6


## Project Structure

```text
PersonalShopper/
├── app/                   # Nuxt 4 frontend application
│   ├── assets/css/        # Tailwind v4 and Nuxt UI styling
│   ├── components/        # Nuxt UI components (Pantry, Shopping List, Modals, Navbar)
│   ├── stores/            # Pinia state management (usePantryStore)
│   ├── utils/             # Cadence algorithms, frequency tracking, audio, formatting
│   └── app.vue            # Root UApp wrapper and view orchestration
├── migrations/            # Prisma 8 database schema migrations
├── prisma/                # Prisma contract definition (contract.prisma, contract.json)
├── public/                # Static assets, icons, and web manifest
├── server/                # Nitro server engine
│   ├── api/               # REST API endpoints (/api/pantry, /api/shopping-list)
│   └── utils/             # Prisma client factory and repository pattern (PrismaPantryRepository)
├── shared/                # Shared TypeScript models and DTO interfaces
├── test/                  # Automated Vitest test suite with mocked Prisma context
├── nuxt.config.ts         # Nuxt 4 configuration (SPA mode, Nuxt UI, Pinia, Cloudflare preset)
├── package.json           # Dependencies and project scripts
├── prisma.config.ts       # Prisma 8 configuration
├── tsconfig.json          # TypeScript compiler configuration
├── vitest.config.ts       # Vitest configuration for Nuxt runtime environment
└── wrangler.json          # Cloudflare Workers deployment configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/PurrplexityAI/PersonalShopper.git
cd PersonalShopper
npm install
```

### Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your PostgreSQL connection strings in `.env`:
- `NUXT_DATABASE_URL`: Connection pooler URL (e.g. Supabase transaction pooler on port 6543) used by runtime API endpoints.
- `NUXT_DIRECT_URL`: Direct PostgreSQL connection (port 5432) used by Prisma 8 CLI for contracts and migrations.

### Database Contract & Migrations

Emit Prisma contracts and apply migrations:

```bash
npx prisma contract emit
```

### Development Mode

Start the Nuxt 4 development server:

```bash
npm run dev
```

- Accessible at: `http://localhost:3000`

### Running Automated Tests

Run the complete test suite (unit + E2E browser tests):

```bash
npm test
```

You can also run specific test suites individually:

- **Unit & Component Suite (Vitest)**: Verifies cadence math, frequency algorithms, component interactions, and Pinia store state transitions against an in-memory mocked context:
  ```bash
  npm run test:unit
  ```
- **End-to-End Mobile Suite (Vitest + Playwright)**: Verifies live mobile browser flows, user interactions, and UI reactivity using `@nuxt/test-utils/e2e`:
  ```bash
  npm run test:e2e
  ```
- **Regenerate Showcase GIFs**: Re-records the key interaction flows on mobile emulation and compiles high-quality, palette-optimized GIFs for the documentation:
  ```bash
  npm run showcase:generate
  ```

### Code Quality & Type Checking

Run ESLint and TypeScript compilation checks:

```bash
npm run lint
npm run typecheck
```

### Production Build & Edge Deployment

Build the client bundle and Cloudflare Workers Nitro server:

```bash
npm run build
```

Deploy to Cloudflare Workers via Wrangler:

```bash
npm run deploy
```


## Roadmap

For upcoming features, UX improvements, architectural refactoring, and known technical trade-offs, see [ROADMAP.md](ROADMAP.md).

## Copyright & License

Copyright (C) 2026 Alexander Ali.

This project is licensed under the terms of the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
