/**
 * The daily briefing: a short note, written each morning by the `financas-diario`
 * skill, that reads the month against the move-out plan and says what to watch.
 *
 * The app does not write it — it only stores and shows it. The judgement lives
 * in the skill, where it can read the plan's decisions and the ledger together;
 * the screen is where it gets read, first thing, before any number.
 */

/** The same two tones the rest of the screen speaks — never a third one. */
export const BRIEFING_VERDICTS = ['no-trilho', 'fora-do-trilho'] as const
export type BriefingVerdict = (typeof BRIEFING_VERDICTS)[number]

/**
 * A briefing that runs past this stops being read on a phone before coffee,
 * which is the only reason it exists.
 */
export const BRIEFING_MAX_WORDS = 200
const HEADLINE_MAX_CHARS = 140

export interface Briefing {
  /** "YYYY-MM-DD" — one briefing per day; writing again replaces it. */
  date: string
  verdict: BriefingVerdict
  /** One line: the verdict in words. */
  headline: string
  /** Plain text. Lines starting with "- " render as bullets; nothing else is parsed. */
  body: string
  createdAt?: string
}

export interface BriefingInput {
  date?: unknown
  verdict?: unknown
  headline?: unknown
  body?: unknown
}

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export function countWords(text: string): number {
  return text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length
}

export function validateBriefing(
  input: BriefingInput,
  today: string
): { briefing: Briefing; errors: [] } | { briefing: null; errors: string[] } {
  const errors: string[] = []

  const date = input.date === undefined ? today : input.date
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    errors.push('date deve estar no formato YYYY-MM-DD')
  }

  const verdict = input.verdict
  if (!BRIEFING_VERDICTS.includes(verdict as BriefingVerdict)) {
    errors.push(`verdict deve ser um de: ${BRIEFING_VERDICTS.join(', ')}`)
  }

  const headline = typeof input.headline === 'string' ? input.headline.trim() : ''
  if (!headline) errors.push('headline é obrigatória')
  if (headline.length > HEADLINE_MAX_CHARS) {
    errors.push(`headline tem no máximo ${HEADLINE_MAX_CHARS} caracteres`)
  }

  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (!body) errors.push('body é obrigatório')

  const words = countWords(`${headline} ${body}`)
  if (words > BRIEFING_MAX_WORDS) {
    errors.push(`o briefing tem ${words} palavras; o teto é ${BRIEFING_MAX_WORDS}`)
  }

  if (errors.length) return { briefing: null, errors }

  return {
    briefing: { date: date as string, verdict: verdict as BriefingVerdict, headline, body },
    errors: [],
  }
}

export type BriefingBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }

/**
 * Splits the body into paragraphs and bullet lists.
 *
 * Deliberately not markdown: the body is rendered as text, never as HTML, so
 * the only structure it can carry is the one this function understands.
 */
export function briefingBlocks(body: string): BriefingBlock[] {
  const blocks: BriefingBlock[] = []

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const bullet = line.match(/^[-•*]\s+(.*)$/)
    const last = blocks[blocks.length - 1]

    if (bullet) {
      if (last?.kind === 'list') last.items.push(bullet[1])
      else blocks.push({ kind: 'list', items: [bullet[1]] })
    } else {
      blocks.push({ kind: 'paragraph', text: line })
    }
  }

  return blocks
}

export interface TextSegment {
  text: string
  money: boolean
}

const MONEY = /(-?R\$\s?-?[\d.]+(?:,\d{1,2})?(?:\s?(?:mil|k))?)/g

/**
 * Splits a line so the amounts in it can be blurred by privacy mode, which
 * masks elements rather than characters.
 */
export function moneySegments(text: string): TextSegment[] {
  return text
    .split(MONEY)
    .filter(Boolean)
    .map(part => ({ text: part, money: /^-?R\$/.test(part) }))
}
