# Financial Control App - Claude Context

## Project Overview

This is a **Nuxt 3** financial control application that integrates with Google Sheets to provide comprehensive transaction management, analytics, and filtering capabilities. The app reads financial transaction data from a Google Sheets spreadsheet and provides a web interface for visualization, filtering, and analysis.

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
- **Database**: PostgreSQL (Neon serverless, HTTP driver) via Drizzle ORM — primary read source
- **Source of truth**: Google Sheets, synced into Postgres (see "Data Layer & Sync")
- **Charts**: Chart.js with vue-chartjs (plus a custom CSS/flex stacked-bar chart for installments)
- **Deployment**: Vercel (Nitro `vercel` preset, serverless functions + cron)
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
│   ├── usePersonFilter.ts         # Global person filter UI state (default: Gabriel)
│   ├── useTransactions.ts         # Transaction fetching (useAsyncData + getCachedData)
│   ├── useInstallments.ts         # Re-exports shared/installments (parse/expand)
│   ├── useDashboardAnalytics.ts   # Dashboard analytics, invoice, insights
│   ├── useFormatters.ts           # Currency/date/month formatting helpers
│   └── useCacheStatus.ts          # Cache metadata status
├── pages/
│   ├── index.vue                  # Dashboard ("Coluna Refinada" layout)
│   ├── transactions.vue           # Full transaction list with filters
│   ├── categories.vue             # Category spending (own /api/categories fetch)
│   ├── installments.vue           # "Parcelas Ativas": commitment + 12-month projection
│   ├── fixed-costs.vue            # Fixed costs historical analysis (6 months)
│   ├── budget.vue                 # Monthly budgets (imperative fetch)
│   └── budget-templates.vue       # Budget templates (imperative fetch)
├── server/
│   ├── api/
│   │   ├── transactions.get.ts    # Main endpoint (DB read or Sheets+cache fallback)
│   │   ├── sync.post.ts           # Manual Sheets → Postgres sync
│   │   └── cron/sync.get.ts       # Daily cron sync (Vercel, CRON_SECRET guarded)
│   ├── database/                  # Drizzle schema + Neon client
│   └── utils/
│       ├── googleSheets.ts        # Google Sheets data fetching
│       ├── personIdentifier.ts    # Person identification logic
│       ├── installmentProcessor.ts # Re-exports shared/installments
│       ├── syncTransactions.ts    # Batched upsert util (shared by sync + cron)
│       └── transactionFilters.ts  # Server-side filtering logic
├── shared/
│   └── installments.ts            # Framework-agnostic installment logic (server + client)
└── types/
    └── transaction.ts             # TypeScript type definitions and interfaces
```

## Key Features

### 1. Google Sheets Integration
- Reads transaction data from a Google Sheets spreadsheet
- Uses Service Account authentication (server-side only)
- Expected sheet structure:
  - Transaction Id, Date, Origin, Destination, Description, Amount, Recorded at, Remote Id

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
  only regenerates a monthly schedule when the first installment (`01/XX`) is present; series
  without it stay as-is — which is exactly why the page computes from the installment number.
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
- [nuxt.config.ts](nuxt.config.ts): Nuxt app configuration, runtime config for Google credentials, OpenAPI settings
- [tailwind.config.js](tailwind.config.js): Custom theme colors (primary blue palette)
- `.env`: Environment variables (NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID, NUXT_GOOGLE_CLIENT_EMAIL, NUXT_GOOGLE_PRIVATE_KEY)
- `/_openapi.json`: **OpenAPI 3.1 specification** - Auto-generated API documentation for AI agents and tools

### Server-Side Logic (NEW Architecture)
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Main API endpoint with query parameter support and processing orchestration
- [server/utils/googleSheets.ts](server/utils/googleSheets.ts): Google Sheets API integration and data fetching
- [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts): **Person identification patterns** and enrichment logic
- [server/utils/installmentProcessor.ts](server/utils/installmentProcessor.ts): **Installment parsing, grouping, and expansion** across months
- [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts): **All filtering logic** (person, date, search, etc.)
- [types/transaction.ts](types/transaction.ts): TypeScript interfaces including Transaction, TransactionQueryParams, and more

### Client-Side Composables
- [composables/usePersonFilter.ts](composables/usePersonFilter.ts): Global person filter **UI state management** (identification moved to server)
- [composables/useTransactions.ts](composables/useTransactions.ts): Transaction fetching (`useAsyncData` + `getCachedData` for instant navigation) with server-side filtering via query params
- [composables/useInstallments.ts](composables/useInstallments.ts): Thin re-export of [shared/installments.ts](shared/installments.ts) (parse/identify/expand installments)
- [composables/useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts): Dashboard analytics, credit-card invoice, alerts, forecasts, insights (uses `parseLocalDate` for month bucketing)
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
1. Create Google Cloud project
2. Enable Google Sheets API
3. Create Service Account and download JSON key
4. Share target Google Sheets with service account email
5. Configure `.env` with credentials and spreadsheet ID
6. Set `DATABASE_URL` (Neon Postgres). Without it, the app falls back to Sheets + on-disk cache.
7. Set `CRON_SECRET` (in Vercel env vars) so the daily cron endpoint is protected in production.

**Key env vars:** `NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID`, `NUXT_GOOGLE_CLIENT_EMAIL`,
`NUXT_GOOGLE_PRIVATE_KEY`, `DATABASE_URL`, `CRON_SECRET`.

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

### Google Sheets Structure
The system expects specific column names starting at A1. If your sheet has different columns, update:
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Data parsing logic
- [types/transaction.ts](types/transaction.ts): Transaction interface

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
2. Server reads transactions from **PostgreSQL** when `DATABASE_URL` is set (the normal path);
   otherwise it falls back to Google Sheets + on-disk cache.
3. Server enriches with person identification ([personIdentifier.ts](server/utils/personIdentifier.ts))
   when reading from Sheets (DB rows already carry `person` from the sync).
4. Server processes/expands installments ([installmentProcessor.ts](server/utils/installmentProcessor.ts) → [shared/installments.ts](shared/installments.ts)).
5. Server applies filters (person, date, search, etc.) ([transactionFilters.ts](server/utils/transactionFilters.ts)).
6. Server returns processed data to the client.

See **"Data Layer & Sync"** below for how Postgres stays in sync with the sheet.

**Benefits:**
- ✅ **Better Performance**: Reduced client-side processing, lower bandwidth usage
- ✅ **Scalability**: Server handles larger datasets more efficiently
- ✅ **Security**: All Google credentials and business logic stay server-side
- ✅ **Maintainability**: Clear separation of concerns, single source of truth for logic
- ✅ **Testability**: Server utilities can be tested independently

### Design Patterns

- **Server-Side Processing**: All data transformation, filtering, and enrichment happens on the server
- **Composables**: Reusable logic for UI state and server communication
- **Component-Based Navigation**: Each page includes the Sidemenu component for navigation (no layout wrapper)
- **Server API Routes**: Secure Google Sheets access with query parameter support (credentials never exposed to client)
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

### Modifying Google Sheets Integration
1. Update [server/api/transactions.get.ts](server/api/transactions.get.ts) for data fetching
2. Update [types/transaction.ts](types/transaction.ts) for type changes
3. Update parsing logic if column structure changes

## Security Notes

- Google credentials stored server-side only (never exposed to client)
- Environment variables used for sensitive data
- `.env` file is git-ignored
- Service Account has read-only access to specific spreadsheet

## Data Layer & Sync

- **Read path**: `/api/transactions` reads from **PostgreSQL** (Neon) when `DATABASE_URL` is set.
  The schema (`transactions`, `budgets`, `sync_metadata`) lives in [server/database/schema.ts](server/database/schema.ts).
- **Source of truth** is still the **Google Sheet**. Postgres is a synced mirror.
- **Sync** is implemented once in [server/utils/syncTransactions.ts](server/utils/syncTransactions.ts)
  as a batched bulk upsert (`INSERT … ON CONFLICT DO UPDATE`, ~500 rows/batch) — fast enough to
  finish inside the serverless timeout. Two entry points reuse it:
  - `POST /api/sync` — manual sync.
  - `GET /api/cron/sync` — **daily Vercel cron at `0 9 * * *` (09:00 UTC = 06:00 BRT)**, declared in
    `nuxt.config.ts` under `nitro.vercel.config.crons` (function `maxDuration: 60`). Guarded by
    `CRON_SECRET` (must be set as a Vercel env var; Vercel sends it as `Authorization: Bearer …`).
- **Gotcha**: Postgres can lag the sheet (sync is daily, not live). If dashboard numbers look
  stale/wrong, run the sync **before** debugging code.

## Conventions & Gotchas

- **Dates are timezone-sensitive.** `new Date("2026-06-01")` parses as UTC midnight, which in
  UTC-3 rolls back to the previous month — leaking day-01 transactions (incl. salary) into the
  wrong month. Use `parseLocalDate()` in [useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts),
  or bucket by `YYYY-MM` **string** keys (as the installments page does). Never bucket months
  with raw `new Date(isoDate)`.
- **Navigation caching.** `useTransactions` and `categories` pass `getCachedData` to `useAsyncData`
  so client-side navigation reuses already-loaded data instead of refetching (no loading flash).
  Refetch happens only on full reload, an explicit refresh, or a filter/param change. The four
  transaction pages share the same cache key, so after the first load they're instant.
- **Credit-card invoice** (`getCreditCardInvoice` in [useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts))
  is computed from the synced transactions by billing cycle — there is no hardcoded seed anymore.
- **Installment math** anchors on the installment number (see Installments Feature above), not on
  counting months — keep that property if you touch the calculation.

## Known Limitations

- Read-only access to Google Sheets (no write operations); sheet is the source of truth.
- Single spreadsheet support
- No user authentication
- Postgres sync is **daily (cron), not real-time** — data can lag the sheet until the next sync.
- `budget.vue` / `budget-templates.vue` still use an imperative `loading` ref (not the cached
  `useAsyncData` pattern), so they show a loading state on navigation.

## Future Enhancement Ideas

See [README.md](README.md) for detailed list of potential improvements including:
- Write capabilities to Google Sheets
- Multiple spreadsheet/account support
- User authentication
- Data caching and performance optimization
- Advanced visualizations and charts
- Export functionality (CSV, PDF)

## Troubleshooting

### Transactions not loading
- Check `.env` file has correct credentials
- Verify spreadsheet is shared with service account email
- Confirm Google Sheets API is enabled in Google Cloud Console
- Check server logs for detailed errors

### Person filter not working
- Verify Origin column values in Google Sheets
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
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
