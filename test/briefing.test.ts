import { describe, it, expect } from 'vitest'
import { validateBriefing, briefingBlocks, moneySegments, countWords } from '~/shared/briefing'
import { todayKeyIn } from '~/shared/dates'

const valid = {
  verdict: 'no-trilho',
  headline: 'Mês sob controle, R$ 1.200 abaixo do ritmo.',
  body: 'Delivery já usou 80% da meta.\n- Ceder a cota até novembro\n- Cobrar o reembolso',
}

describe('validateBriefing', () => {
  it('defaults the date to today', () => {
    const { briefing } = validateBriefing(valid, '2026-09-28')
    expect(briefing?.date).toBe('2026-09-28')
  })

  it('rejects an unknown verdict and a bad date', () => {
    const { errors } = validateBriefing({ ...valid, verdict: 'atencao', date: '28/09/2026' }, '2026-09-28')
    expect(errors).toHaveLength(2)
  })

  /** The cap is the whole point: a briefing nobody finishes reading is noise. */
  it('counts headline and body against the 200-word cap', () => {
    const body = Array.from({ length: 195 }, () => 'palavra').join(' ')
    const { errors } = validateBriefing({ ...valid, body }, '2026-09-28')
    expect(errors[0]).toMatch(/palavras; o teto é 200/)
  })

  it('does not count bullets and dashes as words', () => {
    expect(countWords('- Ceder a cota — até novembro')).toBe(5)
  })
})

describe('briefingBlocks', () => {
  it('groups consecutive bullets into one list', () => {
    expect(briefingBlocks(valid.body)).toEqual([
      { kind: 'paragraph', text: 'Delivery já usou 80% da meta.' },
      { kind: 'list', items: ['Ceder a cota até novembro', 'Cobrar o reembolso'] },
    ])
  })
})

describe('moneySegments', () => {
  it('isolates amounts so privacy mode can blur them', () => {
    expect(moneySegments('Sobram R$ 2.419,50 até dia 30')).toEqual([
      { text: 'Sobram ', money: false },
      { text: 'R$ 2.419,50', money: true },
      { text: ' até dia 30', money: false },
    ])
  })
})

describe('todayKeyIn', () => {
  /** 01h UTC is still the previous evening in São Paulo. */
  it('files a late-evening note under the local day', () => {
    expect(todayKeyIn('America/Sao_Paulo', new Date('2026-09-29T01:00:00Z'))).toBe('2026-09-28')
  })
})
