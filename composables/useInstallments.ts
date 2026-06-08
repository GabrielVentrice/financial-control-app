import {
  parseInstallment,
  isInstallmentTransaction,
  isFirstInstallment,
  processInstallments,
} from '~/shared/installments'

/**
 * Composable for installment-related utilities.
 *
 * The actual logic lives in the shared module `shared/installments.ts` (used by the
 * server pipeline as well), so client and server stay in sync. This composable
 * just exposes it to the installments and fixed-costs pages.
 */
export const useInstallments = () => {
  return {
    parseInstallment,
    isInstallmentTransaction,
    isFirstInstallment,
    processInstallments,
  }
}
