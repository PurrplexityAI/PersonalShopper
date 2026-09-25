# Personal Shopper

> A smart pantry inventory and cadence-driven shopping list web application.

Personal Shopper helps households track pantry staples, monitor stock levels, and predict replenishment needs with smart, frequency-based shopping suggestions.

---

## Features

- **Cadence-Driven Suggestions**: Set replenishment cycles (daily, weekly, bi-weekly, monthly, or custom intervals). Personal Shopper automatically calculates when items are due or overdue.
- **Stock Tracking & Alerts**: Track in-stock vs. out-of-stock items; out-of-stock essentials are immediately flagged for purchase.
- **Interactive Shopping List**:
  - Add items directly or promote cadence suggestions with a single click.
  - Checking off an item automatically marks it in stock, records the purchase date, and resets its cadence timer.
  - Remove items without altering pantry stock history if you decide not to purchase them.
- **Full Pantry Management**: Categorize items, record custom units, specify quantities, and append item notes.
- **Data Backup & Restore**: Export and import your pantry inventory as JSON, or reset to realistic sample items.
- **Mobile & LAN Ready**: Single Page Application (SPA mode) configured for local network Wi-Fi access and prepared for targeting into Capacitor for native mobile apps.

---

## Tech Stack

- **Framework**: [Nuxt 4.5.1](https://nuxt.com/) (configured in SPA mode with Nitro engine)
- **UI & Design**: [Nuxt UI 4.11.2](https://ui.nuxt.com/), [Tailwind CSS v4](https://tailwindcss.com/), [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **State Management**: [Pinia](https://pinia.vuejs.org/) via `@pinia/nuxt`
- **Data Layer**: Clean Repository Pattern (`PantryRepository`), flat-file storage (`data/pantry_db.json`) with atomic persistence, prepared for database migration (SQLite/PostgreSQL)
- **Testing**: [Vitest](https://vitest.dev/) & [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing) with in-memory test datastore isolation

---

## Project Structure

```text
PersonalShopper/
├── app/                   # Nuxt 4 frontend application
│   ├── assets/css/        # Tailwind v4 and Nuxt UI styling
│   ├── components/        # Nuxt UI components (Pantry, Shopping List, Modals, Navbar)
│   ├── stores/            # Pinia state management (usePantryStore)
│   ├── utils/             # Cadence algorithms, audio synthesizer, confetti, formatting
│   └── app.vue            # Root UApp wrapper and view orchestration
├── data/                  # Local JSON data store (pantry_db.json)
├── public/                # Static assets, icons, and web manifest
├── server/                # Nitro server engine
│   ├── api/               # REST API endpoints (/api/pantry, /api/shopping-list, /api/data)
│   └── utils/             # Repository abstraction (JsonFilePantryRepository, InMemoryPantryRepository)
├── shared/                # Shared TypeScript models and DTO interfaces
├── test/                  # Automated Vitest test suite with datastore isolation
├── nuxt.config.ts         # Nuxt 4 configuration (SPA mode, Nuxt UI, Pinia)
├── package.json           # Dependencies and project scripts
├── tsconfig.json          # TypeScript compiler configuration
└── vitest.config.ts       # Vitest configuration for Nuxt runtime environment
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd PersonalShopperHil
npm install
```

### Development Mode

Start the Nuxt 4 development server:

```bash
npm run dev
```

- Accessible at: `http://localhost:3000`

### Running Automated Tests

Run the isolated test suite verifying cadence math, repository operations, and Pinia store state transitions:

```bash
npm test
```

> **Note**: Automated tests run against an in-memory repository instance, ensuring zero mutation occurs to your production `data/pantry_db.json` store.

### Production Build & Preview

To build the client bundle and preview the application:

```bash
npm run build
npm run preview
```

---

## Copyright & License

Copyright (C) 2026 Alexander Ali.

This project is licensed under the terms of the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
