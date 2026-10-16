# Personal Shopper — Product Roadmap & Engineering Backlog

This document outlines upcoming features, UX enhancements, architectural refactors, and known technical trade-offs for Personal Shopper. It provides reviewers and contributors with insight into the project's technical direction and engineering priorities.

## 1. UX & Performance Polish

Practical refinements to eliminate latency bottlenecks, reduce perceived delay, and smooth out touch interactions.

### Optimistic UI for Item Checking
- **Status**: `Planned`
- **Context**: On slower mobile data connections, ticking an item off the shopping list experiences perceptible latency while awaiting the server API completion before the UI transitions.
- **Proposed Solution**: Implement optimistic state updates in Pinia (`usePantryStore`). Immediately flip the checked state, strike-through the item, and trigger purchase transitions client-side; rollback state with an informative toast notification only if the network request fails.

### Click Idempotency & Rapid-Click Safeguards
- **Status**: `Planned`
- **Context**: Rapidly clicking action buttons (such as check-off, item editing, or adding items to the list) has high idempotency bug potential and can dispatch duplicate asynchronous mutations.
- **Proposed Solution**: Introduce per-item mutation guards / button debouncing and attach client-generated request tokens / idempotency keys to ensure duplicate submissions are gracefully ignored by the backend.

### Confetti on Full List Completion
- **Status**: `Planned`
- **Context**: Canvas confetti currently triggers on every individual item tick-off, which diminishes its rewarding effect and feels repetitive during a long shopping run.
- **Proposed Solution**: Relocate the celebration trigger to fire exclusively when the final shopping list item is checked off, accompanied by a satisfying list completion chime.

### Mobile Pantry Filter Panel Scrolling Fix
- **Status**: `Planned` (Bug Fix)
- **Context**: On smaller mobile viewport heights, the pantry filter bar can exhibit glitchy positioning behavior (disappearing abruptly rather than naturally scrolling out of view with the document flow).
- **Proposed Solution**: Audit CSS sticky positioning and overflow rules in `PantryView.vue` and `CategorySelect.vue` to ensure natural viewport scrolling without clipping dropdowns.

### Delete Safety for Active Purchased Items
- **Status**: `Planned` (Bug Fix)
- **Context**: An edge case exists where an item that was just checked off and still displayed in the session's "Purchased items" drawer can be deleted, causing an inconsistency between session memory and database records.
- **Proposed Solution**: Add validation safeguards preventing deletion of active session-purchased items, or cascade removal cleanly from both the database and the purchased items array.

## 2. Architecture & Data Cleanliness

Refactoring technical debt, cleaning data models, and setting consistent API patterns.

### REST API Route Real Estate Standardization
- **Status**: `Planned`
- **Context**: API route namespaces currently have overlapping patterns (e.g. `/thing/:id` alongside `/thing/action` style RPC routes), which can create routing ambiguities and complicates middleware application.
- **Proposed Solution**: Restructure the Nitro API route hierarchy following strict REST conventions:
  - Resource CRUD: `GET /api/pantry`, `POST /api/pantry`, `GET /api/pantry/:id`, `PATCH /api/pantry/:id`, `DELETE /api/pantry/:id`
  - Sub-resources / Actions: `POST /api/pantry/:id/stock-toggle`, `POST /api/shopping-list/:id/check`

### Database Access & Query Chain Optimization
- **Status**: `Planned`
- **Context**: Certain actions (like item check-off or item edits) perform sequential, daisy-chained database round-trips (fetch -> verify -> update -> recalculate frequency -> response), creating unnecessary database access overhead.
- **Proposed Solution**: Consolidate multi-step reads and writes into atomic Prisma transactions (`db.transaction()`) and optimize SQL queries to reduce network trips between Cloudflare Workers and PostgreSQL.

### Quantity Schema & Code Cleanup
- **Status**: `Planned`
- **Context**: Early prototyping included item quantities (`quantity`, `unit`), but cadence and replenishment logic is fundamentally frequency-driven. The vestigial quantity code adds maintenance friction and risks polluting downstream features.
- **Proposed Solution**: Run a structured Prisma migration to deprecate and drop unused quantity columns, simplifying the `PantryItem` DTO, component props, and database contracts.

### UK Supermarket Category System
- **Status**: `Planned`
- **Context**: Initial categories were hardcoded defaults from early generation. Users need true custom categorization that matches real-world UK supermarket aisle layouts (e.g. Produce, Chilled & Dairy, Bakery, Food Cupboard, Frozen, Household & Toiletries).
- **Proposed Solution**: Build a proper category management system allowing user-defined custom categories, customizable sorting by supermarket aisle navigation order, and category persistence in the database.

## 3. AI & Edge Capabilities

Next-generation capabilities leveraging edge compute, multimodal vision, and agentic workflows.

### Multimodal Vision: Add to Pantry from Camera
- **Status**: `Under Consideration`
- **Context**: Entering pantry staples by hand is high friction for new users. Users should be able to snap photos of grocery receipts, their fridge shelves, or pantry cupboards to instantly populate inventory.
- **Proposed Solution**: 
  - Leverage lightweight multimodal models (e.g. Gemini Flash Vision API) via server routes.
  - Extract item names, estimate initial replenishment cadence from receipt item types, and perform fuzzy matching/merging against existing pantry inventory to prevent duplicates.

### Model Context Protocol (MCP) Server
- **Status**: `Planned`
- **Context**: Enabling external AI assistants (e.g. Claude Desktop, Gemini CLI, Antigravity) to query and update the pantry and shopping list directly.
- **Proposed Solution**: Implement an MCP server exposing tools (`list_pantry_items`, `get_shopping_list`, `add_shopping_item`, `suggest_meal_from_stock`) allowing personal AI agents to act as automated household shoppers and meal planners.

### Deepen Automated Frequency Tracking
- **Status**: `In Progress`
- **Context**: Initial smart frequency tracking was scaffolded to adjust cadence intervals based on consecutive purchases.
- **Proposed Solution**: Expand the cadence algorithm to handle irregular purchase rhythms, account for seasonal gaps, and provide user prompts when purchase cadence substantially drifts.

## 4. Productization & Platform

Platform features required to support multi-user households and control production operating costs.

### Feature Gating & AI Cost Containment
- **Status**: `Planned`
- **Context**: Multimodal vision and AI receipt scanning incur non-trivial API costs per invocation.
- **Proposed Solution**: Implement client and server-side feature flags with daily/monthly usage quotas or subscription tiers to prevent uncontrolled inference expenditure.

### Authentication & Multi-User Household Tenancy
- **Status**: `Planned`
- **Context**: Currently operating in single-tenant mode. Households need shared shopping lists where multiple family members can view and check off items concurrently.
- **Proposed Solution**: Integrate lightweight authentication (e.g. Supabase Auth or Cloudflare Access) with household account scoping, granting shared inventory access to invited members.

### Desktop Navigation Menu & Sidebar Refactor
- **Status**: `Planned`
- **Context**: The existing top navbar is optimized for mobile SPA use, but desktop viewports have ample screen real estate that would benefit from a persistent sidebar navigation menu.
- **Proposed Solution**: Refactor navigation using `@nuxt/ui` `NavigationMenu`, transitioning to a collapsible desktop sidebar that will also house future user profile, household settings, and category management panels.
