import { describe, it, expect } from 'vitest'
import { computeDelta } from '~/shared/delta'

describe('delta polarity', () => {
  it('reads a rising expense as bad news', () => {
    // The arrow points up and the number is positive, but spending more is not
    // good — colour follows the metric, never the sign.
    const d = computeDelta(2580, 1096, 'expense')
    expect(d.label).toBe('▴ 135%')
    expect(d.cls).toBe('text-neg-text')
  })

  it('reads a falling expense as good news', () => {
    const d = computeDelta(348, 735, 'expense')
    expect(d.label).toBe('▾ 53%')
    expect(d.cls).toBe('text-pos-text')
  })

  it('inverts the judgement for income', () => {
    expect(computeDelta(1200, 1000, 'income').cls).toBe('text-pos-text')
    expect(computeDelta(800, 1000, 'income').cls).toBe('text-neg-text')
  })
})

describe('delta edge cases become words', () => {
  it('says novo instead of an infinite percentage', () => {
    const d = computeDelta(475, 0)
    expect(d.label).toBe('novo')
    expect(d.kind).toBe('new')
  })

  it('says estável instead of 0%', () => {
    expect(computeDelta(1549, 1549).label).toBe('estável')
    expect(computeDelta(0, 0).label).toBe('estável')
  })

  it('rounds the way the mockup does', () => {
    // Food: 1040 vs 217 → 379%, not 380%.
    expect(computeDelta(1040, 217, 'expense').label).toBe('▴ 379%')
  })
})

describe('sorting by biggest rise', () => {
  it('exposes the absolute change so R$ leads, not percentage', () => {
    // A R$ 25 category that doubled must not outrank one that rose R$ 1.483.
    const big = computeDelta(2580, 1096)
    const small = computeDelta(50, 25)
    expect(big.absolute).toBe(1484)
    expect(small.absolute).toBe(25)
    expect(big.absolute).toBeGreaterThan(small.absolute)
  })
})
