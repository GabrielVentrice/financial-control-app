# API Architecture Documentation

## Overview

The application has been refactored to move all transaction processing logic from the client-side to the server-side (Nitro API layer). This provides better performance, security, and maintainability.

## Architecture Layers

### 1. Data Fetching Layer
**Location**: `server/utils/googleSheets.ts`

- Handles connection to Google Sheets API
- Fetches raw transaction data
- Single source of truth for transaction data

### 2. Transformation Layer
**Location**: `server/utils/personIdentifier.ts`

- Enriches transactions with person identification (Juliana/Gabriel)
- Pattern-based matching on Origin field
- Configurable patterns for easy customization

### 3. Processing Layer
**Location**: `server/utils/installmentProcessor.ts`

- Parses installment descriptions (e.g., "Netflix 01/12")
- Expands installments across months
- Groups related installments
- Generates correct dates for recurring payments

### 4. Filtering Layer
**Location**: `server/utils/transactionFilters.ts`

- Applies filters based on query parameters
- Validates filter inputs
- Supports multiple filter types simultaneously

### 5. API Endpoint
**Location**: `server/api/transactions.get.ts`

- Orchestrates all layers
- Handles HTTP requests
- Validates query parameters
- Returns filtered, processed data

## API Endpoint Usage

### Base URL
```
GET /api/transactions
```

### Supported Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `person` | string | Filter by Juliana/Gabriel/Ambos | `?person=Gabriel` |
| `startDate` | string | Start date (YYYY-MM-DD) | `?startDate=2025-01-01` |
| `endDate` | string | End date (YYYY-MM-DD) | `?endDate=2025-01-31` |
| `searchTerm` | string | Search in descriptions | `?searchTerm=Netflix` |
| `origin` | string | Filter by account/card | `?origin=Credit%20Card` |
| `destination` | string | Filter by category | `?destination=Food` |
| `processInstallments` | boolean | Enable/disable installment processing | `?processInstallments=false` |

### Example Requests

#### Get all transactions (default behavior)
```
GET /api/transactions
```

#### Get Gabriel's transactions for January 2025
```
GET /api/transactions?person=Gabriel&startDate=2025-01-01&endDate=2025-01-31
```

#### Search for Netflix transactions
```
GET /api/transactions?searchTerm=Netflix
```

#### Get transactions without installment processing
```
GET /api/transactions?processInstallments=false
```

#### Combine multiple filters
```
GET /api/transactions?person=Juliana&startDate=2025-01-01&destination=Food&searchTerm=restaurant
```

## Client-Side Usage

### Using the Composable

```typescript
import { useTransactions } from '~/composables/useTransactions'

const { transactions, loading, error, fetchTransactions } = useTransactions()

// Fetch all transactions
await fetchTransactions()

// Fetch with filters
await fetchTransactions({
  person: 'Gabriel',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
})

// Fetch specific category
await fetchTransactions({
  destination: 'Food',
  searchTerm: 'restaurant'
})
```

### Person Filter Integration

```typescript
import { usePersonFilter } from '~/composables/usePersonFilter'
import { useTransactions } from '~/composables/useTransactions'

const { selectedPerson, setPersonFilter } = usePersonFilter()
const { fetchTransactions } = useTransactions()

// Change person filter
setPersonFilter('Gabriel')

// Fetch with new filter
await fetchTransactions({ person: selectedPerson.value })
```

## Data Flow

```
1. Client Request
   ↓
2. API Endpoint (validates params)
   ↓
3. Fetch from Google Sheets
   ↓
4. Enrich with Person Data
   ↓
5. Process Installments (optional)
   ↓
6. Apply Filters
   ↓
7. Return to Client
```

## Transaction Object Structure

```typescript
interface Transaction {
  transactionId: string
  date: string              // YYYY-MM-DD format
  origin: string            // Account/card name
  destination: string       // Category
  description: string       // Transaction description
  amount: number            // Transaction amount
  recordedAt: string        // When transaction was recorded
  remoteId: string          // External ID
  person?: 'Juliana' | 'Gabriel' | null  // Auto-identified person
}
```

## Customization

### Adding Person Patterns

Edit `server/utils/personIdentifier.ts`:

```typescript
const JULIANA_PATTERNS = [
  'juliana',
  'cartao juliana',
  // Add your patterns here
]

const GABRIEL_PATTERNS = [
  'gabriel',
  'conta gabriel',
  // Add your patterns here
]
```

### Adding New Filters

1. Add parameter to `TransactionQueryParams` in `types/transaction.ts`
2. Create filter function in `server/utils/transactionFilters.ts`
3. Add to `applyFilters()` function
4. Update validation in `validateQueryParams()` if needed

### Disabling Installment Processing

Pass `processInstallments: false` in query params:

```typescript
await fetchTransactions({ processInstallments: false })
```

## Performance Benefits

1. **Reduced Client-Side Processing**: All heavy computation happens on the server
2. **Lower Bandwidth**: Only filtered data is sent to client
3. **Faster Page Loads**: Less JavaScript to execute in browser
4. **Better Scalability**: Server can handle larger datasets more efficiently
5. **Cached Results**: Server can implement caching strategies (future enhancement)

## Migration from Old Architecture

### Before (Client-Side Filtering)
```typescript
// Old way - fetches all data, filters client-side
const { transactions, fetchTransactions } = useTransactions()
const { filterTransactionsByPerson } = usePersonFilter()

await fetchTransactions()
const filtered = filterTransactionsByPerson(transactions.value)
```

### After (Server-Side Filtering)
```typescript
// New way - filters server-side, receives only needed data
const { transactions, fetchTransactions } = useTransactions()

await fetchTransactions({ person: 'Gabriel' })
// transactions.value already contains only Gabriel's transactions
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server-side error (Google Sheets, processing, etc.)

Example error response:
```json
{
  "statusCode": 400,
  "statusMessage": "Invalid query parameters",
  "data": [
    "Invalid person filter: InvalidName. Must be one of: Juliana, Gabriel, Ambos"
  ]
}
```

## Testing

### Manual Testing
```bash
# Start dev server
npm run dev

# Test endpoints with curl
curl "http://localhost:3000/api/transactions"
curl "http://localhost:3000/api/transactions?person=Gabriel"
curl "http://localhost:3000/api/transactions?startDate=2025-01-01&endDate=2025-01-31"
```

### In Browser
Open browser dev tools and check:
1. Network tab for API requests
2. Console for server logs (check terminal)
3. Response data structure

## Future Enhancements

1. **Caching**: Implement Redis/memory cache for frequently accessed data
2. **Analytics Endpoint**: Dedicated endpoint for dashboard analytics
3. **Batch Operations**: Support for multiple simultaneous filters
4. **Export Functionality**: CSV/PDF export via API
5. **Real-time Updates**: WebSocket support for live transaction updates
6. **Pagination**: Support for large datasets
7. **Aggregation Endpoint**: Pre-calculated summaries and statistics

## Security Notes

- Google credentials remain server-side only (never exposed to client)
- Input validation prevents injection attacks
- Rate limiting can be added in future
- CORS configured for Nuxt app only
