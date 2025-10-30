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
├── components/
│   ├── Sidemenu.vue               # Navigation sidebar with global person filter
│   ├── TransactionCard.vue        # Card display for transactions
│   └── TransactionFilters.vue     # Filter controls for transactions
├── composables/
│   ├── usePersonFilter.ts         # Global person filter logic (Juliana/Gabriel)
│   ├── useTransactions.ts         # Transaction data fetching and filtering
│   ├── useInstallments.ts         # Installment parsing and processing logic
│   └── useDashboardAnalytics.ts   # Dashboard analytics and insights
├── pages/
│   ├── index.vue                  # Dashboard overview with analytics
│   ├── transactions.vue           # Full transaction list with advanced filters
│   ├── categories.vue             # Category-based spending analysis
│   ├── installments.vue           # Installment analysis with timeline chart
│   └── fixed-costs.vue            # Fixed costs historical analysis (last 6 months)
├── server/
│   └── api/
│       └── transactions.get.ts   # API endpoint for fetching Google Sheets data
└── types/
    └── transaction.ts             # TypeScript type definitions
```

## Key Features

### 1. Google Sheets Integration
- Reads transaction data from a Google Sheets spreadsheet
- Uses Service Account authentication (server-side only)
- Expected sheet structure:
  - Transaction Id, Date, Origin, Destination, Description, Amount, Recorded at, Remote Id

### 2. Person-Based Filtering
- Global filter for Juliana/Gabriel/Both
- Auto-identifies person based on "Origin" column patterns
- Configured in [composables/usePersonFilter.ts](composables/usePersonFilter.ts)
- Patterns are case-insensitive and use `includes()` matching

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

### Core Logic
- [composables/usePersonFilter.ts](composables/usePersonFilter.ts): Person identification patterns and global filter state
- [composables/useTransactions.ts](composables/useTransactions.ts): Transaction fetching, filtering helpers
- [composables/useInstallments.ts](composables/useInstallments.ts): Installment parsing, processing, and expansion across months
- [composables/useDashboardAnalytics.ts](composables/useDashboardAnalytics.ts): Dashboard analytics, alerts, forecasts, and insights
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Server API endpoint that connects to Google Sheets
- [types/transaction.ts](types/transaction.ts): TypeScript interfaces for Transaction type

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

### Person Filter Patterns
Edit [composables/usePersonFilter.ts](composables/usePersonFilter.ts) to customize which Origin values map to Juliana or Gabriel:

```typescript
const julianaPatterns = [
  'juliana',
  'cartao juliana',
  'nubank juliana',
  // Add more patterns as needed
]

const gabrielPatterns = [
  'gabriel',
  'cartao gabriel',
  'conta gabriel',
  // Add more patterns as needed
]
```

### Theme Colors
Edit [tailwind.config.js](tailwind.config.js) to change the primary color scheme (currently blue).

### Google Sheets Structure
The system expects specific column names starting at A1. If your sheet has different columns, update:
- [server/api/transactions.get.ts](server/api/transactions.get.ts): Data parsing logic
- [types/transaction.ts](types/transaction.ts): Transaction interface

## API Endpoints

### GET /api/transactions
- Fetches all transactions from Google Sheets
- Returns array of Transaction objects
- Server-side only (uses private credentials)
- Used by all pages via `useTransactions()` composable

## State Management

- **Global Person Filter**: Shared via `usePersonFilter()` composable across all pages
- **Transaction Data**: Fetched via `useTransactions()` composable
- No external state management library (using Vue 3 reactivity and composables)

## Design Patterns

- **Composables**: Reusable logic for transactions, person filtering, installments, and analytics
- **Component-Based Navigation**: Each page includes the Sidemenu component for navigation (no layout wrapper)
- **Server API Routes**: Secure Google Sheets access (credentials never exposed to client)
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

### Adding a New Filter
1. Update [types/transaction.ts](types/transaction.ts) if needed
2. Add filter function to [composables/useTransactions.ts](composables/useTransactions.ts)
3. Add UI controls to relevant page component

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
- Client-side filtering (all data fetched at once)
- No data caching (fetches on each page load)

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
- Check patterns in [composables/usePersonFilter.ts](composables/usePersonFilter.ts)
- Patterns are case-insensitive and use substring matching
- Restart dev server after changing patterns

### Build errors
- Run `npm install` to ensure dependencies are up to date
- Check TypeScript errors with `npx tsc --noEmit`
- Verify all imports are correct

## Additional Resources

- [README.md](README.md): Full setup guide and feature documentation
- [CONFIGURACAO.md](CONFIGURACAO.md): Portuguese configuration guide with detailed filter setup
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
