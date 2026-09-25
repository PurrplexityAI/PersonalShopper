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
- **Mobile & LAN Ready**: Configured for local network access so you can manage your pantry directly from your smartphone on the same Wi-Fi network.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Vite](https://vitejs.dev/), [Lucide React](https://lucide.dev/), [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Backend**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx), [CORS](https://github.com/expressjs/cors)
- **Database**: Local JSON flat-file storage (`data/pantry_db.json`) with atomic persistence

---

## Project Structure

```text
PersonalShopper/
├── data/                  # Local JSON data store (pantry_db.json)
├── public/                # Static assets, icons, and web manifest
├── server/                # Express API & business logic
│   ├── cadence.ts         # Replenishment calculation & urgency algorithms
│   ├── db.ts              # JSON database persistence & CRUD helpers
│   ├── index.ts           # Express server endpoints & static asset serving
│   ├── tests/             # Automated verification test suite
│   └── types.ts           # Backend TypeScript models
├── src/                   # React frontend application
│   ├── components/        # UI components (Pantry, Shopping List, Modals, Navbar)
│   ├── utils/             # Helper utilities
│   ├── api.ts             # Client API service
│   ├── App.tsx            # Main layout and application state
│   ├── main.tsx           # React DOM bootstrap
│   └── types.ts           # Frontend TypeScript types
├── index.html             # HTML entry point with mobile viewport settings
├── package.json           # Dependencies and project scripts
├── tsconfig.json          # TypeScript compiler configuration
└── vite.config.ts         # Vite build and proxy configuration
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

Run both the backend API and frontend Vite client simultaneously:

```bash
npm run dev
```

- **Client**: `http://localhost:5173` (also accessible over your local Wi-Fi via your machine's LAN IP)
- **Server API**: `http://localhost:3001` (proxied by Vite)

You can also run client or server independently:

```bash
npm run dev:server   # Starts Express API with file-watching via tsx
npm run dev:client   # Starts Vite development server
```

### Running Tests

Run the backend cadence and schedule calculation test suite:

```bash
npm test
```

### Production Build & Launch

To build the client bundle and start the production Express server:

```bash
npm run build
npm start
```

The Express server will serve both the `/api/*` endpoints and the compiled static frontend from `dist/` on port `3001`.

---

## Copyright & License

Copyright (C) 2026 Alexander Ali.

This project is licensed under the terms of the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
