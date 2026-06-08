import type { Transaction } from '~/types/transaction'

/**
 * TEMPORARY hardcoded seed — June/2026 credit card invoice (Gabriel), imported
 * from the bank CSV (fatura-548693044.csv). The Google Sheet only has data up to
 * 2026-01-13, so the recent purchases and newer installments are not yet synced.
 * REMOVE this file (and its use in useDashboardAnalytics.getCreditCardInvoice)
 * once the spreadsheet is updated. Total: R$ 2873.63.
 */

const SEED: Record<string, Transaction[]> = {
  '2026-06': [
    {
      "transactionId": "temp-2026-06-01",
      "date": "2026-06-06",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DM *helphbomaxcomNew YorkBR",
      "amount": 44.9,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-02",
      "date": "2026-06-06",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL *UberRidesSao PauloBR",
      "amount": 59.98,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-03",
      "date": "2026-06-06",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL *UberRidesSao PauloBR",
      "amount": 56.96,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-04",
      "date": "2026-06-04",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "APPLE.COM/BILLSAO PAULOBR",
      "amount": 14.9,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-05",
      "date": "2026-06-03",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "Amazon Prime AluguelSAO PAULOBR",
      "amount": 29.9,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-06",
      "date": "2026-06-03",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "MERCADOLIVRE*MERCADOLIVREITAPIRABR",
      "amount": 91.62,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-07",
      "date": "2026-06-02",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "PIXIVFANBOXTOKYOJP",
      "amount": 16.77,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-08",
      "date": "2026-06-02",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "IOF INTERNACIONAL - PIXIVFANBOXTOKYOJP",
      "amount": 0.59,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-09",
      "date": "2026-06-01",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "Itaú Avisa",
      "amount": 7.99,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-10",
      "date": "2026-05-31",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL*UberRidesSao PauloBR",
      "amount": 33.97,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-11",
      "date": "2026-05-31",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL *UberRidesSao PauloBR",
      "amount": 75.98,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-12",
      "date": "2026-05-31",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "CLAUDE.AI SUBSCRIPTIONANTHROPIC.COMUS",
      "amount": 586.12,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-13",
      "date": "2026-05-31",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "IOF INTERNACIONAL - CLAUDE.AI SUBSCRIPTIONANTHROPIC.COMUS",
      "amount": 20.51,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-14",
      "date": "2026-05-31",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL*UberRidesSao PauloBR",
      "amount": 74.98,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-15",
      "date": "2026-05-09",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "GIULIANA COMERCIO DE FSAO CAETANO DBR",
      "amount": 176.13,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-16",
      "date": "2026-05-02",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "DL *AliExpress BR AlipSao PauloBR",
      "amount": 56.37,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-17",
      "date": "2026-01-06",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "EC *MERCADOLIVREATIBAIABR",
      "amount": 419.99,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-18",
      "date": "2026-01-05",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "PG *JOOLA BRASILSAO PAULOBR",
      "amount": 201.57,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-19",
      "date": "2025-12-16",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "MP*MERCADOLIVRESARANDIBR",
      "amount": 398.08,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-20",
      "date": "2025-12-10",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "MP*VUCSOLUCOESSO PAULOBR",
      "amount": 67.25,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-21",
      "date": "2025-11-28",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "PG *NUVEM CASADOSSAO PAULOBR",
      "amount": 210.48,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-22",
      "date": "2025-11-10",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "MP*MERCADOLIVRECONSELHEIRO LBR",
      "amount": 49.51,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-23",
      "date": "2025-07-16",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "PIX Ministerio Da Fazenda",
      "amount": 102.42,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    },
    {
      "transactionId": "temp-2026-06-24",
      "date": "2025-03-16",
      "origin": "Credit Card Gabriel",
      "destination": "",
      "description": "ORTOBOM SAO BERNARDO BR",
      "amount": 76.66,
      "recordedAt": "",
      "remoteId": "",
      "person": "Gabriel"
    }
  ]
}

/**
 * Returns the hardcoded invoice items for the given invoice month (0-indexed),
 * or null when there is no seed for that month.
 */
export function getSeedInvoice(year: number, month: number): Transaction[] | null {
  return SEED[`${year}-${String(month + 1).padStart(2, '0')}`] ?? null
}
