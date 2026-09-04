/**
 * The move-out plan: rent up to R$ 4.000, keys in January 2027.
 *
 * This is DATA, not a table. The curve below changes when the plan is
 * re-decided — once a quarter at most — and a plan you can edit from a form is
 * a plan you edit instead of following. Changing it should look like what it is:
 * a commit, with a diff, next to the reasoning that produced it.
 *
 * Every number was derived from the Bkper ledger on 04/09/2026 and from the
 * Porto Seguro statement for cota AF292/0261. The full write-up lives at
 * PLAN_ARTIFACT_URL.
 */

export const PLAN_ARTIFACT_URL =
  'https://claude.ai/code/artifact/48fbb121-d947-4a36-a00e-dab9b2c88d06'

export interface PlanMilestone {
  monthKey: string
  /** Cash expected in the account at the end of this month. */
  targetCash: number
  /** What has to happen for the number to land. */
  headline: string
}

/**
 * The cash curve of the plan.
 *
 * Assumes the two decisions that make it work: the vehicle consórcio cota is
 * ceded (the R$ 1.178,97 boleto stops in November) and delivery plus personal
 * subscriptions are cut by R$ 600/month from October. Extraordinary income is
 * in: 13º in November, bonus in December.
 */
export const PLAN_MILESTONES: PlanMilestone[] = [
  { monthKey: '2026-09', targetCash: -3_043, headline: 'Fatura do curso. Anunciar a cota.' },
  { monthKey: '2026-10', targetCash: -2_433, headline: 'Cortes começam. Cobrar o reembolso.' },
  { monthKey: '2026-11', targetCash: 27_800, headline: '13º + cessão da cota. Visitar imóveis.' },
  { monthKey: '2026-12', targetCash: 65_700, headline: 'Bônus cai. Assinar o contrato.' },
  { monthKey: '2027-01', targetCash: 40_700, headline: 'Mudança — entrada de R$ 25.000 sai daqui.' },
  { monthKey: '2027-02', targetCash: 41_700, headline: 'Primeiro mês inteiro na casa nova.' },
]

export const MOVE_PLAN = {
  /** Rent + condomínio + IPTU. The mathematical ceiling is R$ 4.341. */
  housingTarget: 4_000,
  housingCeiling: 4_341,
  /** Recurring net income the whole budget is sized against. */
  monthlyIncome: 11_000,
  /** Month the keys are picked up. */
  moveMonth: '2027-01',
  /** Cash left after the move-in costs — 4,1 months of fixed cost. */
  reserveGoal: 40_700,
  /** Next target after the move: six months of fixed cost. */
  reserveStretch: 59_800,
  /** What the plan says a month costs once the rent is being paid. */
  fixedCostAfterMove: 9_959,
}

export interface PlanTask {
  id: string
  title: string
  detail: string
  /** Month it has to be done by. */
  dueMonth: string
}

/**
 * The open moves, in the order they unblock each other.
 *
 * Deliberately short. A checklist of twenty items is a checklist nobody reads;
 * these four are the ones where doing nothing costs real money every month.
 */
export const PLAN_TASKS: PlanTask[] = [
  {
    id: 'cessao-cota',
    title: 'Ceder a cota do consórcio de veículo',
    detail:
      'Grupo AF292, cota 0261-00. Para o boleto de R$ 1.178,97 e devolve R$ 14,7 a 18,9 mil. ' +
      'Faltam 57 parcelas e R$ 88.697 — é a decisão que sustenta o aluguel de R$ 4.000.',
    dueMonth: '2026-11',
  },
  {
    id: 'reembolso-curso',
    title: 'Cobrar o reembolso de 50% do curso',
    detail: 'US$ 862,50 ≈ R$ 4.933. Não está em nenhuma projeção — quando entrar, é folga por cima.',
    dueMonth: '2026-10',
  },
  {
    id: 'sair-cheque-especial',
    title: 'Sair do cheque especial e não voltar',
    detail: 'R$ 494/mês de juros nos últimos 12 meses. É o corte que não custa estilo de vida nenhum.',
    dueMonth: '2026-12',
  },
  {
    id: 'assinar-contrato',
    title: 'Assinar o contrato de aluguel',
    detail:
      'Em dezembro, com o bônus na conta — nunca em novembro, que deixaria R$ 1.667 na conta ' +
      'por três semanas já pagando aluguel. Caução se a cessão fechar, seguro-fiança se não.',
    dueMonth: '2026-12',
  },
]

/** The milestone for a month, when the plan has one. */
export function milestoneFor(monthKey: string): PlanMilestone | null {
  return PLAN_MILESTONES.find(m => m.monthKey === monthKey) ?? null
}
