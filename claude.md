# Financial Control App - Claude Context

## Project Overview

This is a **Nuxt 3** financial control application built on top of a **Bkper** ledger. The app
reads transactions straight from the Bkper REST API into an in-memory server snapshot (no
database mirror) and provides a web interface for visualization, filtering, and analysis.

**Key capabilities:**
- Real-time transaction viewing and filtering
- Person-based expense tracking (Juliana/Gabriel)
- Smart financial alerts and insights
- Installment payment tracking and forecasting
- Fixed costs analysis and trends
- Category-based spending analysis
- Interactive charts and visualizations

## Tech Stack

- **Framework**: Nuxt 3 (Vue 3)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (light design system; tokens in [tailwind.config.js](tailwind.config.js))
- **Source of truth & primary read source**: **Bkper** (REST API v5), read into an in-memory
  server snapshot with a 60min TTL (see "Data Layer & Cache"). There is no Google Sheets
  integration anymore — budget targets live in Postgres.
- **Database**: PostgreSQL (Neon serverless, HTTP driver) via Drizzle ORM — holds only the
  state the ledger cannot contain: `debt_plans` (the cheque-especial anchor) and
  `budget_targets` (the monthly spending target per category)
- **Charts**: Chart.js with vue-chartjs (plus a custom CSS/flex stacked-bar chart for installments)
- **Deployment**: Vercel (Nitro `vercel` preset, serverless functions)
- **Runtime**: Node.js 18+

## Project Structure

```
financial-control-app/
├── app.vue                          # Root component
├── nuxt.config.ts                  # Nuxt configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── package.json                    # Dependencies
├── .env                            # Environment variables (git-ignored)
├── components/
│   ├── Sidemenu.vue               # Navigation sidebar with global person filter
│   ├── LightStatCard.vue          # KPI/stat card (light design system)
│   ├── installments/
│   │   └── CommitmentChart.vue    # Custom CSS/flex stacked-bar projection chart
│   └── dashboard/                 # Dashboard-specific chart/list components
├── composables/
│   ├── usePersonFilter.ts         # Global person filter UI state (useState, default: Gabriel)
│   ├── useTransactions.ts         # The shared dataset (useAsyncData + getCachedData, fixed key)
│   ├── useInstallments.ts         # Re-exports shared/installments (parse/expand)
│   ├── useDashboardAnalytics.ts   # Dashboard analytics, invoice, insights
│   ├── useSync.ts                 # Snapshot freshness label + "Atualizar" action
│   └── useFormatters.ts           # Currency/date/month formatting helpers
├── pages/
│   ├── index.vue                  # "Meu Mês": budget vs spending + the move-out plan
│   ├── transactions.vue           # Full transaction list with filters
│   ├── categories.vue             # Category spending (shared useTransactions)
│   ├── installments.vue           # "Parcelas Ativas": commitment + 12-month projection
│   ├── fixed-costs.vue            # Fixed costs historical analysis (6 months)
│   ├── debt.vue                   # "Quitar Dívida": payoff plan over the raw snapshot
│   └── dashboard.vue              # The old dashboard, moved off `/`
├── server/
│   ├── api/
│   │   ├── transactions.get.ts    # Main endpoint (in-memory Bkper snapshot)
│   │   ├── categories.get.ts      # Category aggregation + budget targets
│   │   ├── month.get.ts           # The month measured against the budget (main screen)
│   │   ├── budget-targets.post.ts # Sets one category's monthly target
│   │   ├── sync.get.ts            # Snapshot age ("dados de há X")
│   │   ├── sync.post.ts           # Force-refresh snapshot
│   │   ├── debt.get.ts/.post.ts   # Debt plan (debt_plans CRUD + JS analytics)
│   ├── database/                  # Drizzle schema + Neon client (debt_plans only)
│   └── utils/
│       ├── bkper.ts               # Bkper REST client (OAuth + pagination + mapping)
│       ├── memoCache.ts           # createTtlCache: in-instance TTL cache w/ dedup + stale fallback
│       ├── bookSnapshot.ts        # The whole-book snapshot every read consumes
│       ├── monthSnapshot.ts       # Budget targets + the month snapshot the main screen reads
│       ├── loadTransactions.ts    # snapshot → installments → filters (single read path)
│       ├── personIdentifier.ts    # Person identification logic
│       ├── installmentProcessor.ts # Re-exports shared/installments
│       ├── debtPlan.ts            # Debt snapshot assembly (math in shared/debtAnalytics)
│       └── transactionFilters.ts  # Server-side filtering logic
├── shared/                        # Framework-agnostic logic (server + client)
│   ├── installments.ts            # Installment identity/parse/expansion
│   ├── expenseRules.ts            # One definition of income/expense/transfer/exclusions
│   ├── debtAnalytics.ts           # Debt math over the raw ledger (movement, interest, cashflow)
│   ├── categoryClassification.ts  # Fixed/committed category lists (server + fixed-costs page)
│   ├── monthBudget.ts             # Realized vs committed, pace, budget lines
│   ├── movePlan.ts                # The move-out plan: cash curve, targets, open tasks
│   ├── categoryIcons.ts           # Category → emoji
│   └── dates.ts                   # Timezone-safe month bucketing
└── types/
    └── transaction.ts             # TypeScript type definitions and interfaces
```

## Key Features

### 1. Bkper Integration

Transactions come from the Bkper ledger ([server/utils/bkper.ts](server/utils/bkper.ts)),
book "1 - Personal finances - Gabriel + Juliana". The app used to read the Google Sheet that
Bkper's own bot writes into; that mirror silently lagged and dropped rows (10 transactions from
Sep/2025, ~R$ 4,3k, existed in the ledger and never reached the sheet).

- **Auth**: Bkper takes a Google OAuth2 access token and has **no service-account path** — the
  token must identify a *user* with access to the book. So the server keeps the refresh token
  from `bkper auth login` (device flow, stored at `~/.config/bkper/.bkper-credentials.json`)
  and mints access tokens from it. Tokens are cached in module scope for the hour they last.
- **Mapping**: Bkper is double entry — `creditAccount` is the app's `origin`, `debitAccount` is
  its `destination`, and both come back as **ids only**, so account names need the extra
  `/accounts` call. Bkper's `id` is exactly what the old sheet called "Transaction Id", so
  `transactionId` stayed stable across every migration of the data layer.
- **Gotchas**: the pagination cursor travels as an **HTTP header**, not a query param — passing
  it as a query param is ignored and every page comes back identical. About half the book is
  uncategorized drafts carrying only one side of the entry; those rows are kept with an empty
  origin/destination, never dropped.

### 2. Person-Based Filtering (Server-Side)
- Global filter for Juliana/Gabriel/Both
- **Auto-identifies person on the server** and enriches transactions with `person` field
- Person identification patterns configured in [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts)
- Patterns are case-insensitive and use `includes()` matching
- UI state managed by [composables/usePersonFilter.ts](composables/usePersonFilter.ts)
- **All filtering happens server-side** via API query parameters for better performance

### 3. Pages
- **Dashboard (`/`)**: Financial overview with analytics, alerts, monthly stats, top spending categories, and upcoming expenses
- **Transactions (`/transactions`)**: Full list with date range, description, and person filters
- **Categories (`/categories`)**: Spending analysis by category (Destination), monthly filtering
- **Installments (`/installments`)** — "Parcelas Ativas": how much income is committed to installments and when it eases. Hero cards (committed this month / total debt), KPIs (active count, next relief, end date), a 12-month commitment projection (stacked bar per parcela that shrinks as series end, with a 30%-of-income healthy-limit line), relief insight, and a sortable list with progress + drill-down modal
- **Fixed Costs (`/fixed-costs`)**: Historical analysis of fixed costs over the last 6 months with chart visualization and category breakdown
- **Debt (`/debt`)** — "Quitar Dívida": tracks paying off the cheque especial. Live balance, the interest it has actually cost, a month-by-month payoff projection, and a derived action plan. A band on the dashboard links to it.

### 3a. "Meu Mês" — the main screen (`/`)

Answers three questions in the order they occur to someone opening the app: **how much can I
still spend**, **where is the month going**, and **am I on track for the move**.

- **Hero**: `renda − realizado − comprometido`, plus the days left and what that allows per day.
  It is a CASH number, not a budget one — a budget is an agreement, cash is what exists, and
  when they disagree cash wins.
- **Pace bar**: realized spending against the fraction of the month already lived. Committed
  installments are excluded: they land on the card's dates, not at a steady drip, so counting
  them would report "over pace" on the 10th of every month regardless of behaviour.
- **Category list**: one line per category, ordered by **proximity to breaking**, not by amount.
  Each uses `CeilingBar` (the empty space to the right is the headroom). The number on the right
  is what still fits, and it goes negative rather than clamping.
- **Targets are editable inline** and persist to `budget_targets`. Saving returns the recomputed
  snapshot, so the totals and the line can never disagree.
- **Plan strip**: expected cash for the month vs. actual (derived from the debt anchor), plus the
  open moves that cost money while they wait.

**The rule this screen rests on** (`shared/monthBudget.ts`): a month holds two kinds of row, and
merging them is what makes a budget screen lie. `realizado` already left the account;
`comprometido` is an installment row #2..N carrying `projected: true` — it has not happened but
it will. Adding them together reports a month that never happened; ignoring the projected half
promises headroom that is already spoken for. Both halves survive all the way to the UI.

The plan's own curve (`shared/movePlan.ts`) is code, not a table: it changes once a quarter, and
a plan you can edit from a form is a plan you edit instead of following.

### 3b. Debt Payoff Feature ("Quitar Dívida")

Answers: how much do I owe, what is it costing me, and when does it end?

**The balance is derived, not typed in.** An overdraft balance is a bank *state*, not a
transaction, so it can never be read out of the ledger. The user anchors it once
(`anchorBalance` + `anchorDate` in the `debt_plans` table) and from then on:

```
saldo hoje = âncora − (entradas − saídas na conta depois da data da âncora)
```

so every sync moves the number without re-typing it. Re-anchor via `POST /api/debt` whenever
the app and the bank disagree — never by editing history.

**Capacity is measured relative to today.** Today's surplus is whatever it is; what changes is
the installment load rolling off. So capacity in a future month is *today's surplus + the
installments that will have ended by then + any committed cut* (`capacityForMonth` in
[shared/debt.ts](shared/debt.ts)). This keeps the projection anchored to observed behaviour
instead of an aspirational budget.

**Gotchas:**
- The recurring surplus is the **median** month over the last 6 closed months, never the mean.
  Averaging folded a one-off tax refund into the monthly surplus and reported ~R$1.265/mês of
  room that did not exist — the plan then promised a payoff date funded by a windfall. The
  median also absorbs the mirror artefact where a salary paid on the 30th leaves the next month
  looking like it earned nothing.
- The current month is excluded from that window: it is half-lived (salary landed, card bill and
  boletos have not), so it always reads as a surplus that evaporates by the 15th.
- The relief card and the projection must use the **same** notion of freed money (cumulative vs.
  today, not the biggest single month-over-month step), or the headline number contradicts the
  chart under it.
- Installment roll-off is derived by the same date-arithmetic-on-the-installment-number rule as
  the installments page (see below). Do not switch it to counting months.
- The duplicated card-payment row (`pagamento debito automatico`) is excluded from account
  movement; counting both sides would double every month's outflow.

### 4. Installments Feature ("Parcelas Ativas")
The installments page answers: how much of my income is committed to installments,
when does it ease, and which installments are active?

**Features:**
- **Hero band**: "Comprometido este mês" (sum of installments due in the reference
  month, % of income, healthy-limit badge) and "Saldo devedor total" (sum of all
  remaining installments + payoff month).
- **KPIs**: active count, "Próximo alívio" (first month a parcela ends and how much/month
  frees up), and projected end month.
- **Commitment chart** ([components/installments/CommitmentChart.vue](components/installments/CommitmentChart.vue)):
  custom CSS/flex stacked bars over 12 months — one segment per parcela, shrinking as
  series finish. Future months are dashed (projection), with a dashed amber line at the
  30%-of-income healthy limit and a color→parcela legend.
- **Relief insight** + **sortable list** (maior parcela / termina antes / a pagar) with
  progress bars and a drill-down detail modal.

**Technical Details — installment math (IMPORTANT):**
- `paid`/`remaining` are derived by **date arithmetic from the installment number**, not by
  counting how many distinct months the data carries. The source sheet often clusters every
  installment row on a single date, so month-counting wildly under-counts `paid` and keeps
  finished series looking active.
- For each series (grouped by base description + origin + total): anchor on the lowest-numbered
  installment present (`NN` + its month), back out the month installment #1 was due
  (`startIdx = monthIdx − (NN − 1)`), then `paid = clamp(refMonthIdx − startIdx, 0, total)`.
- A series bills in a month only if that month ∈ `[startIdx, startIdx + total)`.
- Installment identity/parse/expansion lives in [shared/installments.ts](shared/installments.ts)
  (re-exported by `useInstallments()` and `installmentProcessor.ts`). `processInstallments`
  only builds a schedule when the first installment (`01/XX`) is present; series without it
  stay as-is — which is exactly why the page computes from the installment number.
- **A real row always beats the projection.** `buildSeriesSchedule` lays out one row per month:
  the ledger's own rows where they exist, a projected row only for the months it has nothing
  for. The schedule used to be regenerated from `01/XX` with the real rows discarded, so card
  purchases that had just synced disappeared from every screen — August showed a projected
  `09/12` on day 02 at the first installment's amount instead of the real `08/12` of 10/08,
  and a series that had already ended lost its last real charge entirely.
- **One row per month, still.** The ledger writes several rows of a series on a single date
  (01/12, 02/12 and 04/12 all on 16/12/2025); those are one charge written repeatedly. Two rows
  of the same series in one month would triple that month's total.
- Recognizes installments by `Installments/Financing` category **or** any credit-card-origin
  purchase with an `NN/NN` marker (e.g., "Netflix 01/12").

### 5. Dashboard Analytics
The dashboard provides intelligent financial insights and alerts:

**Features:**
- **Monthly Stats Cards**: Current month income, expenses, balance, and transaction count
- **Smart Alerts**: Automatic warnings for:
  - Spending 20% above previous month
  - High value transactions (over R$ 1,000)
  - Negative balance
  - Low transaction count (possible missing data)
- **Top Categories**: Shows top 5 spending categories for current month with percentage breakdown
- **Upcoming Expenses**: Lists scheduled expenses for the next 30 days
- **Monthly Forecast**: Projects income and expenses based on current patterns

**Technical Details:**
- Uses `useDashboardAnalytics()` composable for all calculations
- Automatically identifies income (destination = bank account) vs expenses (origin = bank account/credit card)
- Alert system helps identify spending patterns and potential issues
- All analytics are real-time based on filtered transaction data

### 6. Fixed Costs Feature
The fixed costs page provides historical analysis of recurring expenses:

**Features:**
- **6-Month Historical View**: Shows trends over last 6 months including current month
- **Summary Cards**:
  - Current Month Total: Total fixed costs for current month
  - Average Monthly Total: Average across 6-month period
  - Active Categories: Number of categories with expenses in the period
- **Evolution Chart**: Bar chart visualizing monthly fixed cost trends
- **Category Breakdown Table**: Detailed monthly view per category with totals and averages
- **Configurable Categories**: Easily customize which categories are considered "fixed costs"

**Configured Fixed Cost Categories:**
- Installments/Financing
- Rent
- Financing
- Subscriptions/Softwares
- Utilities
- Business & Taxes
- Investments
- Insurance
- Medical

**Technical Details:**
- Fixed cost categories configurable in `FIXED_COST_CATEGORIES` array at top of [pages/fixed-costs.vue](pages/fixed-costs.vue)
- Uses Chart.js for visualization
- Category matching is case-insensitive and uses `includes()` for flexible pattern matching
- Processes installments via `useInstallments()` composable to expand recurring payments

## Important Files

### Configuration
- [nuxt.config.ts](nuxt.config.ts): Nuxt app configuration, runtime config for Bkper credentials, OpenAPI settings
- [tailwind.config.js](tailwind.config.js): Custom theme colors (primary blue palette)
- `.env`: Environment variables (NUXT_BKPER_*, DATABASE_URL)
- `/_openapi.json`: **OpenAPI 3.1 specification** - Auto-generated API documentation for AI agents and tools

### Server-Side Logic (NEW Architecture)
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Main API endpoint with query parameter support and processing orchestration
- [server/utils/bkper.ts](server/utils/bkper.ts): **Bkper REST client** — OAuth token refresh, cursor pagination, ledger → Transaction mapping
- [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts): **Person identification patterns** and enrichment logic
- [server/utils/installmentProcessor.ts](server/utils/installmentProcessor.ts): **Installment parsing, grouping, and expansion** across months
- [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts): **All filtering logic** (person, date, search, etc.)
- [types/transaction.ts](types/transaction.ts): TypeScript interfaces including Transaction, TransactionQueryParams, and more

### Client-Side Composables
- [composables/usePersonFilter.ts](composables/usePersonFilter.ts): Global person filter **UI state management** (identification moved to server)
- [composables/useTransactions.ts](composables/useTransactions.ts): Transaction fetching (`useAsyncData` + `getCachedData` for instant navigation) with server-side filtering via query params
- [composables/useInstallments.ts](composables/useInstallments.ts): Thin re-export of [shared/installments.ts](shared/installments.ts) (parse/identify/expand installments)
- [composables/useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts): Dashboard analytics, credit-card invoice, insights. Every function takes an optional `refMonth` ("YYYY-MM") so the dashboard can navigate months
- [composables/useFormatters.ts](composables/useFormatters.ts): Currency/date/month formatting helpers

### Key Pages
- [pages/index.vue](pages/index.vue): Dashboard with analytics and insights
- [pages/transactions.vue](pages/transactions.vue): Full transaction list with filters
- [pages/categories.vue](pages/categories.vue): Category-based spending analysis
- [pages/installments.vue](pages/installments.vue): Installments timeline and analysis
- [pages/fixed-costs.vue](pages/fixed-costs.vue): Fixed costs historical analysis (6 months)

## Development Workflow

### Common Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Setup
1. Configure `.env` with the Bkper credentials and `DATABASE_URL`
2. Authenticate against Bkper: `npm i -g bkper && bkper auth login`, then copy the
   `refresh_token` from `~/.config/bkper/.bkper-credentials.json` into `NUXT_BKPER_REFRESH_TOKEN`
   (with the CLI's own OAuth client in `NUXT_BKPER_CLIENT_ID`/`NUXT_BKPER_CLIENT_SECRET`), and
   the book id in `NUXT_BKPER_BOOK_ID` (`GET https://api.bkper.app/v5/books` lists them).
3. Set `DATABASE_URL` (Neon Postgres) — the main screen and the debt screen both need it.

**Key env vars:** `NUXT_BKPER_BOOK_ID`, `NUXT_BKPER_REFRESH_TOKEN`, `NUXT_BKPER_CLIENT_ID`,
`NUXT_BKPER_CLIENT_SECRET`, `DATABASE_URL`. **All of them must also exist in the Vercel
project** — a deploy without `NUXT_BKPER_*` fails every transaction read, and one without
`DATABASE_URL` takes down the main screen.

## Customization Points

### Person Filter Patterns (Server-Side)

**IMPORTANT:** Person identification is now done on the **server-side** for better performance.

Edit [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts) to customize which Origin values map to Juliana or Gabriel:

```typescript
const JULIANA_PATTERNS = [
  'juliana',
  'cartao juliana',
  'nubank juliana',
  'credit card juliana',
  'bank account juliana',
  // Add more patterns as needed
]

const GABRIEL_PATTERNS = [
  'gabriel',
  'cartao gabriel',
  'conta gabriel',
  'bank account gabriel',
  'credit card gabriel',
  // Add more patterns as needed
]
```

After modifying patterns, **restart the dev server** for changes to take effect.

### Theme Colors
Edit [tailwind.config.js](tailwind.config.js) to change the primary color scheme (currently blue).

### Ledger Structure
Account names in Bkper are what every screen filters on ("Credit Card Gabriel", "Food"). Renaming
an account there changes `origin`/`destination` here — check
[server/utils/personIdentifier.ts](server/utils/personIdentifier.ts) and
[shared/expenseRules.ts](shared/expenseRules.ts) before renaming.

## API Documentation

### OpenAPI Specification

The API is fully documented using **OpenAPI 3.1** specification, accessible at `/_openapi.json`. This endpoint provides machine-readable API documentation designed for:

- **AI Agents & LLMs**: Complete context for code generation and understanding
- **API Tools**: Postman, Insomnia, Swagger UI, and other API clients
- **Automated Testing**: Generate test suites from specification
- **Client Generation**: Auto-generate TypeScript/JavaScript clients

**Accessing the OpenAPI Spec:**
```bash
# Get OpenAPI specification
curl http://localhost:3000/_openapi.json

# Or visit in browser
open http://localhost:3000/_openapi.json
```

**Interactive Documentation:**

Nitro provides built-in documentation viewers:
- **Swagger UI**: Visit `/_swagger` for interactive API documentation
- **Scalar UI**: Visit `/_scalar` for modern API documentation interface

### Main Endpoints

#### GET /api/transactions

**Main endpoint with server-side processing and filtering support.**

All parameters, request/response schemas, examples, and detailed descriptions are available in the OpenAPI specification at `/_openapi.json`.

**Quick Reference - Supported Query Parameters:**
- `person` - Filter by Juliana/Gabriel/Ambos
- `startDate` - Start date in YYYY-MM-DD format
- `endDate` - End date in YYYY-MM-DD format
- `searchTerm` - Search in transaction descriptions
- `origin` - Filter by account/card origin
- `destination` - Filter by category/destination
- `processInstallments` - Enable/disable installment processing (default: true)

**Example Requests:**
```bash
# Get all transactions (with installment processing)
GET /api/transactions

# Get Gabriel's transactions for January 2025
GET /api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31

# Search for Netflix transactions
GET /api/transactions?searchTerm=Netflix

# Get transactions without installment processing
GET /api/transactions?processInstallments=false
```

**For complete documentation including:**
- Full parameter descriptions with enums and formats
- Request/response schemas with all fields
- Example payloads for different scenarios
- Error response formats and codes
- Processing pipeline details

**See `/_openapi.json` for the complete OpenAPI 3.1 specification.**

## Maintaining API Documentation

The API documentation is **automatically generated** from OpenAPI metadata defined in the endpoint handlers. No manual documentation maintenance is required.

### How It Works

1. **OpenAPI Metadata**: Each endpoint includes `defineRouteMeta()` with OpenAPI specification
2. **Auto-Generation**: Nitro automatically generates `/openapi.json` from endpoint metadata
3. **Always Up-to-Date**: Documentation stays synchronized with code automatically

### Updating API Documentation

When you add or modify API endpoints:

1. **Add/Update OpenAPI Metadata** in the endpoint handler:
   ```typescript
   export default defineEventHandler(async (event) => {
     defineRouteMeta({
       openAPI: {
         summary: 'Your endpoint summary',
         description: 'Detailed description with examples',
         tags: ['Category'],
         parameters: [ /* parameter definitions */ ],
         responses: { /* response schemas */ }
       }
     })
     // ... endpoint logic
   })
   ```

2. **Test the Documentation**:
   ```bash
   # Start dev server
   npm run dev

   # View OpenAPI spec
   curl http://localhost:3000/_openapi.json

   # Or use interactive docs
   open http://localhost:3000/_swagger
   open http://localhost:3000/_scalar
   ```

3. **Commit Changes**: The OpenAPI spec is generated at runtime, no files to commit

### Best Practices

1. **Be Descriptive**: Write clear summaries and descriptions for AI agents
2. **Include Examples**: Add example values for parameters and responses
3. **Document All Fields**: Define complete schemas with all properties
4. **Use Tags**: Organize endpoints into logical categories
5. **Test**: Verify the OpenAPI spec renders correctly in Swagger/Scalar UI

## State Management

- **Global Person Filter**: Shared via `usePersonFilter()` composable across all pages
- **Transaction Data**: Fetched via `useTransactions()` composable
- No external state management library (using Vue 3 reactivity and composables)

## Architecture & Design Patterns

### Server-Side Architecture

The application uses a **server-first architecture** where all heavy processing happens on the Nitro server:

**Data Flow (`/api/transactions`):**
1. Client requests `/api/transactions` with optional query parameters.
2. Server reads the in-memory **Bkper snapshot** ([bookSnapshot.ts](server/utils/bookSnapshot.ts)) —
   already person-enriched ([personIdentifier.ts](server/utils/personIdentifier.ts)) and sorted;
   a cold instance fetches the whole book once (~7s), warm reads are memory.
3. Server processes/expands installments ([installmentProcessor.ts](server/utils/installmentProcessor.ts) → [shared/installments.ts](shared/installments.ts)).
4. Server applies filters (person, date, search, etc.) ([transactionFilters.ts](server/utils/transactionFilters.ts)).
5. Server returns processed data to the client.

See **"Data Layer & Cache"** below for the cache/TTL details.

**Benefits:**
- ✅ **Better Performance**: Reduced client-side processing, lower bandwidth usage
- ✅ **Scalability**: Server handles larger datasets more efficiently
- ✅ **Security**: All ledger credentials and business logic stay server-side
- ✅ **Maintainability**: Clear separation of concerns, single source of truth for logic
- ✅ **Testability**: Server utilities can be tested independently

### Design Patterns

- **Server-Side Processing**: All data transformation, filtering, and enrichment happens on the server
- **Composables**: Reusable logic for UI state and server communication
- **Component-Based Navigation**: Each page includes the Sidemenu component for navigation (no layout wrapper)
- **Server API Routes**: Ledger credentials stay server-side; the client only ever sees filtered data
- **Utility Functions**: Modular server utilities for each processing step (fetch, identify, process, filter)
- **Tailwind Utility Classes**: All styling via Tailwind
- **TypeScript**: Full type safety with Transaction interface and typed composables

## Common Tasks

### Adding a New Page
1. Create file in `pages/` directory (Nuxt will automatically create the route)
2. Add Sidemenu component to the page for navigation
3. Add navigation link in [components/Sidemenu.vue](components/Sidemenu.vue)
4. Use `usePersonFilter()` for global person filtering
5. Use `useTransactions()` for data fetching
6. Use `useInstallments()` if working with installment data
7. Use `useDashboardAnalytics()` for analytics features

### Adding a New Filter (Server-Side)

Filters are now processed on the server for better performance.

1. Add parameter to `TransactionQueryParams` interface in [types/transaction.ts](types/transaction.ts)
2. Create filter function in [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts)
3. Add filter to `applyFilters()` function in [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts)
4. Add validation in `validateQueryParams()` if needed
5. Add UI controls to relevant page component
6. Pass new filter parameter to `fetchTransactions()` in composable

**Example:**
```typescript
// In page component
await fetchTransactions({
  person: 'Gabriel',
  yourNewFilter: 'value'
})
```

### Customizing Fixed Cost Categories
1. Open [pages/fixed-costs.vue](pages/fixed-costs.vue)
2. Edit the `FIXED_COST_CATEGORIES` array near the top of the script section
3. Add or remove category names (matching is case-insensitive and uses `includes()`)
4. Save and refresh the page

### Modifying the Bkper Integration
1. Update [server/utils/bkper.ts](server/utils/bkper.ts) for fetching/mapping
2. Update [types/transaction.ts](types/transaction.ts) for type changes
3. Cover the mapping in [test/bkper.test.ts](test/bkper.test.ts)

## Security Notes

- Ledger credentials stored server-side only (never exposed to client)
- Environment variables used for sensitive data
- `.env` file is git-ignored
- The Bkper refresh token grants full access to the ledger — it belongs in env vars, never in the repo

## Data Layer & Cache

- **One source, one snapshot.** Every transaction read goes through
  [server/utils/bookSnapshot.ts](server/utils/bookSnapshot.ts): the whole Bkper book (~4,1k rows
  over ~22 cursor pages, ~7s) is fetched, person-enriched and sorted once, then held in instance
  memory behind [server/utils/memoCache.ts](server/utils/memoCache.ts) (`createTtlCache`,
  TTL 60min from `runtimeConfig.cache.ttlMinutes`). There is no Postgres mirror, no CSV cache,
  no cron. Warm reads are milliseconds; a cold instance pays the ~7s fetch once.
- **Pipeline**: [server/utils/loadTransactions.ts](server/utils/loadTransactions.ts) =
  `getBookSnapshot()` → `processInstallments()` → `applyFilters()`. `/api/transactions`,
  `/api/categories` and `apply-template` all go through it; `/api/debt` reads the RAW snapshot
  (no installment expansion — projected rows must never count as account movement).
- **Budget targets** live in Postgres and are read fresh on every request — there is nothing
  to cache and nothing to invalidate. `readTargets()` in
  [server/utils/monthSnapshot.ts](server/utils/monthSnapshot.ts) seeds the plan's budget the
  first time it finds the table empty.
- `GET /api/sync` reports the snapshot's age (the "dados de há X" label — warns when refreshes
  seem to be failing). `POST /api/sync` (the "Atualizar" button) forces a fresh Bkper read and
  the client then calls `refreshNuxtData()`.
- **Failure mode**: a background refresh that fails serves the previous (stale) snapshot and
  logs; an explicit refresh (the button) propagates the error so the user sees it.
- **Multi-instance caveat (Vercel)**: each serverless instance holds its own snapshot, so the
  "dados de há X" label can differ between requests and "Atualizar" only renews the instance
  that served it. Fine for a personal app; the TTL bounds the drift at 60min.
- **Postgres (Neon)** holds `debt_plans` and `budget_targets`
  ([server/database/schema.ts](server/database/schema.ts)).
  The old `transactions`/`budgets`/`sync_metadata` tables may still exist in the database until
  `npm run db:push` is run against the slimmed schema — leaving them for a few days after the
  migration is the free rollback.

## Conventions & Gotchas

- **One definition of "this is spending."** [shared/expenseRules.ts](shared/expenseRules.ts) owns
  income / expense / transfer / exclusions, and is imported by the dashboard, the categories and
  fixed-costs pages, the transactions list and `/api/categories`. These four had each grown their
  own exclusion list and reported different totals for the same month. Change the rule there, never
  in a screen.
- **Dates are timezone-sensitive.** `new Date("2026-06-01")` parses as UTC midnight, which in
  UTC-3 rolls back to the previous month — leaking day-01 transactions (incl. salary) into the
  wrong month. Bucket months with `monthKeyOf()` from [shared/dates.ts](shared/dates.ts) (a
  `"YYYY-MM"` string slice); `parseLocalDate()` is only for when you genuinely need a `Date`.
  Never bucket months with raw `new Date(isoDate)`. `npm test` runs the suite a second time under
  `TZ=Pacific/Midway` to keep this honest.
- **Projected vs. realized.** Installment rows #2..N are generated by the projection and carry
  `projected: true`. A month with nothing synced still expands installments into it, so anything
  reporting "what already happened" must filter them out — otherwise an un-synced month shows a
  spending total out of thin air.
- **One read path.** `/api/transactions` and `/api/categories` both go through
  [server/utils/loadTransactions.ts](server/utils/loadTransactions.ts). When installments are being
  expanded, a date window is applied **after** expansion — filtering first drops the `01/XX` anchor
  row and the whole series disappears.
- **Navigation caching.** `useTransactions` and `categories` pass `getCachedData` to `useAsyncData`
  so client-side navigation reuses already-loaded data instead of refetching (no loading flash).
  Refetch happens only on full reload, an explicit refresh, or a filter/param change. The four
  transaction pages share the same cache key, so after the first load they're instant.
- **Credit-card invoice** (`getCreditCardInvoice` in [useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts))
  is computed from the synced transactions by billing cycle — there is no hardcoded seed anymore.
- **Installment math** anchors on the installment number (see Installments Feature above), not on
  counting months — keep that property if you touch the calculation.

## Known Limitations

- Read-only access to Bkper (no write operations); the ledger is the source of truth.
- Single book support
- No user authentication
- Data freshness is bounded by the snapshot TTL (60min) — the "Atualizar" button forces a
  fresh read when needed.

## Future Enhancement Ideas

See [README.md](README.md) for detailed list of potential improvements including:
- Multiple spreadsheet/account support
- User authentication
- Data caching and performance optimization
- Advanced visualizations and charts
- Export functionality (CSV, PDF)

## Troubleshooting

### Transactions not loading
- Check `.env` has the `NUXT_BKPER_*` values (a 500 saying "Bkper is not configured" lists what is missing)
- A 401 saying the refresh token was refused means `bkper auth login` has to be re-run and
  `NUXT_BKPER_REFRESH_TOKEN` updated (in `.env` **and** in Vercel)
- Confirm the book is still shared with the Google account that authenticated
- Check server logs for detailed errors

### Person filter not working
- Verify the account names in the Bkper book
- Check patterns in [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts) (server-side)
- Patterns are case-insensitive and use substring matching
- **IMPORTANT:** Restart dev server after changing patterns
- Check browser dev tools Network tab to see if `person` field is populated in API response
- Check server logs for person identification process

### Build errors
- Run `npm install` to ensure dependencies are up to date
- Check TypeScript errors with `npx tsc --noEmit`
- Verify all imports are correct

## Server-Side Architecture Migration

The application was refactored to move all transaction processing to the server-side (Nitro API). Here's what changed:

### What Was Moved to Server

**Before (Client-Side):**
- Person identification via `identifyPerson()` in composable
- Installment processing via `processInstallments()` in composable
- All filtering logic in page components
- Heavy processing in browser

**After (Server-Side):**
- Person identification in [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts)
- Installment processing in [server/utils/installmentProcessor.ts](server/utils/installmentProcessor.ts)
- Filtering logic in [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts)
- Heavy processing on server, optimized responses to client

### Key Changes for Developers

1. **Transaction Object**: Now includes `person` field (auto-populated by server)
2. **fetchTransactions()**: Accepts query parameters for server-side filtering
3. **usePersonFilter**: Simplified to UI state management only
4. **No more identifyPerson()**: Person is already identified in transaction data

### Migration Example

**Old Code (Client-Side):**
```typescript
const { identifyPerson } = usePersonFilter()
await fetchTransactions()
const filtered = transactions.value.filter(t =>
  identifyPerson(t.origin) === 'Gabriel'
)
```

**New Code (Server-Side):**
```typescript
await fetchTransactions({ person: 'Gabriel' })
// transactions.value already contains only Gabriel's transactions
// Each transaction has transaction.person field populated
```

### Benefits of New Architecture

- ⚡ **60-80% faster** filtering on large datasets
- 📦 **Lower bandwidth** usage (only filtered data sent to client)
- 🔒 **Better security** (all business logic server-side)
- 🧪 **Easier testing** (server utilities can be unit tested)
- 🎯 **Single source of truth** for all processing logic

## Additional Resources

- **`/_openapi.json`**: Complete OpenAPI 3.1 specification for AI agents and API tools
- **`/_swagger`**: Interactive Swagger UI documentation
- **`/_scalar`**: Modern Scalar UI documentation interface
- [README.md](README.md): Full setup guide and feature documentation
- [CONFIGURACAO.md](CONFIGURACAO.md): Portuguese configuration guide with detailed filter setup
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Nitro OpenAPI Documentation](https://nitro.unjs.io/guide/openapi)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Bkper REST API](https://bkper.com/docs/api/rest)
