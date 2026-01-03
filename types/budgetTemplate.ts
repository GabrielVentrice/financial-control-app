/**
 * Budget Template Types
 *
 * Budget templates allow users to configure percentage-based budget allocations
 * that can be applied to automatically create budgets based on detected income.
 */

export interface BudgetTemplate {
  id: string // Unique identifier: category-person
  category: string
  person: 'Juliana' | 'Gabriel'
  percentage: number // 0-100
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BudgetTemplateInput {
  category: string
  person: 'Juliana' | 'Gabriel'
  percentage: number
  active?: boolean
}

export interface BudgetTemplateQueryParams {
  person?: 'Juliana' | 'Gabriel'
  active?: string // 'true' or 'false'
  category?: string
}

export interface ApplyTemplateRequest {
  person: 'Juliana' | 'Gabriel'
  month: number // 1-12
  year: number // YYYY
}

export interface ApplyTemplateResponse {
  success: boolean
  totalIncome: number // Total de ganhos detectados no mês
  templatesApplied: {
    category: string
    percentage: number
    calculatedAmount: number
    applied: boolean // false se já existe budget manual para esta categoria
    reason?: string // Explicação quando applied = false
  }[]
  budgetsCreated: number
  message: string
}

export interface BudgetTemplatesResponse {
  templates: BudgetTemplate[]
  totalByPerson: {
    Juliana: number
    Gabriel: number
  }
  validByPerson: {
    Juliana: boolean // true se soma ≤ 100%
    Gabriel: boolean
  }
}
