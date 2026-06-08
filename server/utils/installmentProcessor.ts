/**
 * Server-side installment processing.
 *
 * The implementation now lives in the shared, framework-agnostic module
 * `shared/installments.ts` so the server pipeline (/api/transactions,
 * /api/categories) and the client composable (composables/useInstallments.ts)
 * never diverge. This file re-exports it to preserve existing import paths.
 */
export {
  parseInstallment,
  isInstallmentTransaction,
  isFirstInstallment,
  createInstallmentGroupKey,
  generateMonthlyInstallments,
  processInstallments,
} from '../../shared/installments'
