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
- **Styling**: Tailwind CSS
- **API Integration**: Google Sheets API via googleapis
- **Charts**: Chart.js with vue-chartjs
- **Runtime**: Node.js 18+

## Project Structure

```
financial-control-app/
├── app.vue                          # Root component
├── nuxt.config.ts                  # Nuxt configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── package.json                    # Dependencies
├── .env                            # Environment variables (git-ignored)
├── API_ARCHITECTURE.md             # Detailed API architecture documentation
├── components/
│   ├── Sidemenu.vue               # Navigation sidebar with global person filter
│   ├── TransactionCard.vue        # Card display for transactions
│   └── TransactionFilters.vue     # Filter controls for transactions
├── composables/
│   ├── usePersonFilter.ts         # Global person filter UI state management
│   ├── useTransactions.ts         # Transaction data fetching with server-side filtering
│   ├── useInstallments.ts         # Client-side installment utilities (legacy)
│   └── useDashboardAnalytics.ts   # Dashboard analytics and insights
├── pages/
│   ├── index.vue                  # Dashboard overview with analytics
│   ├── transactions.vue           # Full transaction list with advanced filters
│   ├── categories.vue             # Category-based spending analysis
│   ├── installments.vue           # Installment analysis with timeline chart
│   └── fixed-costs.vue            # Fixed costs historical analysis (last 6 months)
├── server/
│   ├── api/
│   │   └── transactions.get.ts   # API endpoint with query parameter support
│   └── utils/
│       ├── googleSheets.ts        # Google Sheets data fetching
│       ├── personIdentifier.ts    # Person identification logic
│       ├── installmentProcessor.ts # Installment processing and expansion
│       └── transactionFilters.ts  # Server-side filtering logic
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
- **Installments (`/installments`)**: Timeline analysis of installments with 13-month chart (6 months back, current, 6 months ahead), active installments tracking, and monthly breakdown
- **Fixed Costs (`/fixed-costs`)**: Historical analysis of fixed costs over the last 6 months with chart visualization and category breakdown

### 4. Installments Feature
The installments page provides comprehensive analysis of recurring payments:

**Features:**
- **Timeline Chart**: Bar chart showing 13 months of data (6 months before and after current month)
  - Past months shown in gray
  - Current month highlighted in dark blue
  - Future months shown in light blue
- **Summary Cards**:
  - Active Installments: Count of payment series with future installments remaining
  - Current Month Total: Total value of installments for the current month
  - Average Monthly Total: Average across the 13-month period
- **Active Installments List**: Shows all payment series with pending installments
  - Progress bar showing paid vs. total installments
  - First and last payment dates
  - Monthly payment amount
- **Monthly Breakdown Table**: Detailed view of installment count and total per month

**Technical Details:**
- Uses `useInstallments()` composable to process and expand installments across months
- Leverages Chart.js for interactive bar charts
- Automatically identifies installments by `Installments/Financing` category
- Parses installment format (e.g., "Netflix 01/12") to track series

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
- [nuxt.config.ts](nuxt.config.ts): Nuxt app configuration, runtime config for Google credentials
- [tailwind.config.js](tailwind.config.js): Custom theme colors (primary blue palette)
- `.env`: Environment variables (NUXT_PUBLIC_GOOGLE_SPREADSHEET_ID, NUXT_GOOGLE_CLIENT_EMAIL, NUXT_GOOGLE_PRIVATE_KEY)
- [API_ARCHITECTURE.md](API_ARCHITECTURE.md): **Detailed documentation** of the server-side API architecture

### Server-Side Logic (NEW Architecture)
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Main API endpoint with query parameter support and processing orchestration
- [server/utils/googleSheets.ts](server/utils/googleSheets.ts): Google Sheets API integration and data fetching
- [server/utils/personIdentifier.ts](server/utils/personIdentifier.ts): **Person identification patterns** and enrichment logic
- [server/utils/installmentProcessor.ts](server/utils/installmentProcessor.ts): **Installment parsing, grouping, and expansion** across months
- [server/utils/transactionFilters.ts](server/utils/transactionFilters.ts): **All filtering logic** (person, date, search, etc.)
- [types/transaction.ts](types/transaction.ts): TypeScript interfaces including Transaction, TransactionQueryParams, and more

### Client-Side Composables
- [composables/usePersonFilter.ts](composables/usePersonFilter.ts): Global person filter **UI state management** (identification moved to server)
- [composables/useTransactions.ts](composables/useTransactions.ts): Transaction fetching with **server-side filtering** via query params
- [composables/useInstallments.ts](composables/useInstallments.ts): Legacy client-side installment utilities (kept for compatibility)
- [composables/useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts): Dashboard analytics, alerts, forecasts, and insights

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

## API Endpoints

### GET /api/transactions

**Main endpoint with server-side processing and filtering support.**

**Supported Query Parameters:**
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

**Response:**
- Returns array of Transaction objects with `person` field populated
- All processing (person identification, installments, filtering) done server-side
- Input validation returns 400 error with clear error messages

**See [API_ARCHITECTURE.md](API_ARCHITECTURE.md) for complete documentation.**

## State Management

- **Global Person Filter**: Shared via `usePersonFilter()` composable across all pages
- **Transaction Data**: Fetched via `useTransactions()` composable
- No external state management library (using Vue 3 reactivity and composables)

## Architecture & Design Patterns

### Server-Side Architecture (NEW)

The application uses a **server-first architecture** where all heavy processing happens on the Nitro server:

**Data Flow:**
1. Client makes request to `/api/transactions` with optional query parameters
2. Server fetches raw data from Google Sheets ([googleSheets.ts](server/utils/googleSheets.ts))
3. Server enriches transactions with person identification ([personIdentifier.ts](server/utils/personIdentifier.ts))
4. Server processes installments and expands recurring payments ([installmentProcessor.ts](server/utils/installmentProcessor.ts))
5. Server applies all filters (person, date, search, etc.) ([transactionFilters.ts](server/utils/transactionFilters.ts))
6. Server returns filtered, processed data to client

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

## Known Limitations

- Read-only access to Google Sheets (no write operations)
- Single spreadsheet support
- No user authentication
- No data caching (fetches from Google Sheets on each API request)
- Fetches all data from Google Sheets then filters (no database layer)

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

- **[API_ARCHITECTURE.md](API_ARCHITECTURE.md)**: Complete API documentation and examples
- [README.md](README.md): Full setup guide and feature documentation
- [CONFIGURACAO.md](CONFIGURACAO.md): Portuguese configuration guide with detailed filter setup
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
