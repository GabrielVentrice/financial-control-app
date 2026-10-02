import { describe, it, expect } from 'vitest'
import {
  validateBriefing,
  briefingBlocks,
  moneySegments,
  countWords,
  highlightSegments,
  triageColumns,
  isSafeHref,
} from '~/shared/briefing'
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

const triage = {
  verdict: 'no-trilho',
  headline: 'Você está R$ 1.293 acima da curva e gastando R$ 442 abaixo do ritmo.',
  highlights: [
    { match: 'R$ 1.293 acima', tone: 'good' },
    { match: 'R$ 442 abaixo', tone: 'good' },
  ],
  items: [
    { bucket: 'agir', title: 'Classificar no Bkper', amount: 'R$ 420', amountTone: 'neutral', note: 'Hoje.' },
    { bucket: 'segurar', title: 'Home & Maintenance', amount: 'R$ 5 livres', amountTone: 'neutral', note: '97% de R$ 150.', progress: 0.97, href: '#categorias' },
  ],
}

describe('validateBriefing — triage format', () => {
  it('accepts the structured briefing and defaults amountTone', () => {
    const { briefing, errors } = validateBriefing(
      { ...triage, items: [{ ...triage.items[0], amountTone: undefined }] },
      '2026-10-02'
    )
    expect(errors).toEqual([])
    expect(briefing?.items[0].amountTone).toBe('neutral')
  })

  /** A highlight that is not in the sentence would silently colour nothing. */
  it('rejects a highlight that is not part of the headline', () => {
    const { errors } = validateBriefing(
      { ...triage, highlights: [{ match: 'R$ 999', tone: 'good' }] },
      '2026-10-02'
    )
    expect(errors[0]).toMatch(/trecho exato da headline/)
  })

  it('rejects an unknown bucket and a script href', () => {
    const { errors } = validateBriefing(
      { ...triage, items: [{ ...triage.items[0], bucket: 'hoje', href: 'javascript:alert(1)' }] },
      '2026-10-02'
    )
    expect(errors).toHaveLength(2)
  })

  it('requires items when there is no legacy body', () => {
    const { errors } = validateBriefing({ verdict: 'no-trilho', headline: 'Ok.' }, '2026-10-02')
    expect(errors).toEqual(['items é obrigatório'])
  })
})

describe('highlightSegments', () => {
  it('splits the sentence at each highlight', () => {
    expect(highlightSegments(triage.headline, triage.highlights as any)).toEqual([
      { text: 'Você está ', tone: null },
      { text: 'R$ 1.293 acima', tone: 'good' },
      { text: ' da curva e gastando ', tone: null },
      { text: 'R$ 442 abaixo', tone: 'good' },
      { text: ' do ritmo.', tone: null },
    ])
  })
})

describe('triageColumns', () => {
  it('keeps reading order and drops empty buckets', () => {
    const columns = triageColumns([...triage.items].reverse() as any)
    expect(columns.map(c => c.bucket)).toEqual(['agir', 'segurar'])
  })
})

describe('isSafeHref', () => {
  it('allows in-app paths, anchors and https only', () => {
    expect(['/debt', '#plano', 'https://app.bkper.com'].every(isSafeHref)).toBe(true)
    expect(['//evil.com', 'javascript:x', 'http://x'].some(isSafeHref)).toBe(false)
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

  it('treats a typographic minus as part of the amount', () => {
    expect(moneySegments('−R$ 117')).toEqual([{ text: '−R$ 117', money: true }])
  })
})

describe('todayKeyIn', () => {
  /** 01h UTC is still the previous evening in São Paulo. */
  it('files a late-evening note under the local day', () => {
    expect(todayKeyIn('America/Sao_Paulo', new Date('2026-09-29T01:00:00Z'))).toBe('2026-09-28')
  })
})
