/**
 * The daily briefing: a short note, written each morning by the `financas-diario`
 * skill, that reads the month against the move-out plan and says what to watch.
 *
 * The app does not write it — it only stores and shows it. The judgement lives
 * in the skill, where it can read the plan's decisions and the ledger together;
 * the screen is where it gets read, first thing, before any number.
 *
 * The note is structured, not prose: one verdict sentence with its key numbers
 * marked, then every point sorted into what to do (agir), what to hold back on
 * (segurar) and what only looks wrong (tranquilo). A paragraph plus bullets
 * carried the same facts but left the reader to work out which ones needed them.
 */

/** The same two tones the rest of the screen speaks — never a third one. */
export const BRIEFING_VERDICTS = ['no-trilho', 'fora-do-trilho'] as const
export type BriefingVerdict = (typeof BRIEFING_VERDICTS)[number]

export const TRIAGE_BUCKETS = ['agir', 'segurar', 'tranquilo'] as const
export type TriageBucket = (typeof TRIAGE_BUCKETS)[number]

export const HIGHLIGHT_TONES = ['good', 'bad'] as const
export type HighlightTone = (typeof HIGHLIGHT_TONES)[number]

export const AMOUNT_TONES = ['good', 'bad', 'neutral'] as const
export type AmountTone = (typeof AMOUNT_TONES)[number]

/**
 * A briefing that runs past this stops being read on a phone before coffee,
 * which is the only reason it exists.
 */
export const BRIEFING_MAX_WORDS = 200
export const HEADLINE_MAX_CHARS = 240
const ITEMS_PER_BUCKET_MAX = 4
const TITLE_MAX_CHARS = 48
const AMOUNT_MAX_CHARS = 24
const NOTE_MAX_CHARS = 140

export interface VerdictHighlight {
  /** Exact substring of the headline to colour. */
  match: string
  tone: HighlightTone
}

export interface TriageItem {
  bucket: TriageBucket
  title: string
  /** Already formatted ("R$ 420", "R$ 5 livres", "−R$ 117"). */
  amount: string
  amountTone: AmountTone
  note: string
  /** 0–1, share of the target already used. Only meaningful in `segurar`. */
  progress?: number
  /** In-app path ("/debt"), anchor ("#plano") or an https link (Bkper). */
  href?: string
}

export interface Briefing {
  /** "YYYY-MM-DD" — one briefing per day; writing again replaces it. */
  date: string
  verdict: BriefingVerdict
  /** The verdict sentence, with its numbers marked by `highlights`. */
  headline: string
  highlights: VerdictHighlight[]
  items: TriageItem[]
  /**
   * Legacy free-text body (lines starting with "- " are bullets). Briefings
   * written before the triage format only have this; new ones send `items`.
   */
  body?: string
  createdAt?: string
}

export interface BriefingInput {
  date?: unknown
  verdict?: unknown
  headline?: unknown
  highlights?: unknown
  items?: unknown
  body?: unknown
}

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export function countWords(text: string): number {
  return text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length
}

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** Anything rendered as a link must not be able to run script. */
export function isSafeHref(href: string): boolean {
  return /^(\/(?!\/)|#|https:\/\/)/.test(href)
}

function validateHighlights(input: unknown, headline: string, errors: string[]): VerdictHighlight[] {
  if (input === undefined) return []
  if (!Array.isArray(input)) {
    errors.push('highlights deve ser uma lista')
    return []
  }

  return input.flatMap((raw, i) => {
    const match = str(raw?.match)
    const tone = raw?.tone
    if (!match || !headline.includes(match)) {
      errors.push(`highlights[${i}].match deve ser um trecho exato da headline`)
      return []
    }
    if (!HIGHLIGHT_TONES.includes(tone)) {
      errors.push(`highlights[${i}].tone deve ser um de: ${HIGHLIGHT_TONES.join(', ')}`)
      return []
    }
    return [{ match, tone }]
  })
}

function validateItems(input: unknown, errors: string[]): TriageItem[] {
  if (input === undefined) return []
  if (!Array.isArray(input)) {
    errors.push('items deve ser uma lista')
    return []
  }

  const items = input.flatMap((raw, i): TriageItem[] => {
    const at = `items[${i}]`
    const before = errors.length

    const bucket = raw?.bucket
    if (!TRIAGE_BUCKETS.includes(bucket)) errors.push(`${at}.bucket deve ser um de: ${TRIAGE_BUCKETS.join(', ')}`)

    const title = str(raw?.title)
    if (!title || title.length > TITLE_MAX_CHARS) errors.push(`${at}.title é obrigatório (até ${TITLE_MAX_CHARS} caracteres)`)

    const amount = str(raw?.amount)
    if (amount.length > AMOUNT_MAX_CHARS) errors.push(`${at}.amount tem no máximo ${AMOUNT_MAX_CHARS} caracteres`)

    const amountTone = raw?.amountTone ?? 'neutral'
    if (!AMOUNT_TONES.includes(amountTone)) errors.push(`${at}.amountTone deve ser um de: ${AMOUNT_TONES.join(', ')}`)

    const note = str(raw?.note)
    if (!note || note.length > NOTE_MAX_CHARS) errors.push(`${at}.note é obrigatória (até ${NOTE_MAX_CHARS} caracteres)`)

    const progress = raw?.progress
    if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 1.5)) {
      errors.push(`${at}.progress deve ser um número entre 0 e 1`)
    }

    const href = raw?.href === undefined ? undefined : str(raw.href)
    if (href !== undefined && !isSafeHref(href)) errors.push(`${at}.href deve começar com "/", "#" ou "https://"`)

    if (errors.length > before) return []
    return [{
      bucket,
      title,
      amount,
      amountTone,
      note,
      ...(progress !== undefined && { progress }),
      ...(href && { href }),
    }]
  })

  for (const bucket of TRIAGE_BUCKETS) {
    const count = items.filter(item => item.bucket === bucket).length
    if (count > ITEMS_PER_BUCKET_MAX) errors.push(`${bucket} tem ${count} itens; o teto é ${ITEMS_PER_BUCKET_MAX}`)
  }

  return items
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

  const headline = str(input.headline)
  if (!headline) errors.push('headline é obrigatória')
  if (headline.length > HEADLINE_MAX_CHARS) {
    errors.push(`headline tem no máximo ${HEADLINE_MAX_CHARS} caracteres`)
  }

  const highlights = validateHighlights(input.highlights, headline, errors)
  const items = validateItems(input.items, errors)
  const body = str(input.body)

  if (input.items === undefined && !body) errors.push('items é obrigatório')

  const words = countWords([headline, body, ...items.flatMap(item => [item.title, item.note])].join(' '))
  if (words > BRIEFING_MAX_WORDS) {
    errors.push(`o briefing tem ${words} palavras; o teto é ${BRIEFING_MAX_WORDS}`)
  }

  if (errors.length) return { briefing: null, errors }

  return {
    briefing: {
      date: date as string,
      verdict: verdict as BriefingVerdict,
      headline,
      highlights,
      items,
      ...(body && { body }),
    },
    errors: [],
  }
}

export type BriefingBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }

/**
 * Splits a legacy body into paragraphs and bullet lists.
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

export interface HighlightSegment {
  text: string
  tone: HighlightTone | null
}

/**
 * Splits the verdict sentence at its highlights, first occurrence of each, in
 * the order they appear. Overlapping highlights keep the earlier one.
 */
export function highlightSegments(text: string, highlights: VerdictHighlight[]): HighlightSegment[] {
  const ranges = highlights
    .map(h => ({ start: text.indexOf(h.match), end: text.indexOf(h.match) + h.match.length, tone: h.tone }))
    .filter(r => r.start >= 0)
    .sort((a, b) => a.start - b.start)

  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor) continue
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), tone: null })
    segments.push({ text: text.slice(range.start, range.end), tone: range.tone })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), tone: null })
  return segments
}

export interface TriageColumn {
  bucket: TriageBucket
  items: TriageItem[]
}

/** Buckets in reading order, empty ones dropped so the grid closes up. */
export function triageColumns(items: TriageItem[]): TriageColumn[] {
  return TRIAGE_BUCKETS
    .map(bucket => ({ bucket, items: items.filter(item => item.bucket === bucket) }))
    .filter(column => column.items.length > 0)
}

export interface TextSegment {
  text: string
  money: boolean
}

const MONEY = /([-−]?R\$\s?[-−]?[\d.]+(?:,\d{1,2})?(?:\s?(?:mil|k))?)/g

/**
 * Splits a line so the amounts in it can be blurred by privacy mode, which
 * masks elements rather than characters.
 */
export function moneySegments(text: string): TextSegment[] {
  return text
    .split(MONEY)
    .filter(Boolean)
    .map(part => ({ text: part, money: /^[-−]?R\$/.test(part) }))
}
