/**
 * Category → icon, shared by the budget screens.
 *
 * Each screen used to carry its own map and they disagreed on half the
 * categories — the same "Medical" row showed a different icon depending on
 * which screen you were on. Matching is case-insensitive substring, as
 * everywhere else in the app.
 *
 * Two renderings of the same rule:
 *
 *   `icon`  — emoji, for the screens that list categories on a plain surface.
 *   `glyph` — a monochrome typographic mark, for the screens that put the icon
 *             in a tinted square whose colour carries meaning (over budget /
 *             within it). An emoji there would fight the tint: it brings its
 *             own colours, and the square's colour is the signal.
 *
 * Framework-agnostic (no Vue/Nitro) so both sides can import it.
 */

/**
 * First match wins, so narrower terms come first: "taxi" has to be caught by
 * transport before "tax" reaches the business rule, and "Installments/Financing"
 * has to be caught by the installment rule before the financing one.
 */
const ICON_RULES: Array<{ icon: string; glyph: string; terms: string[] }> = [
  { icon: '🛒', glyph: '▦', terms: ['mercado', 'supermercado', 'supermarket', 'grocer'] },
  { icon: '🍽️', glyph: '◐', terms: ['restaurante', 'restaurant', 'comida', 'alimentação', 'alimentacao', 'food', 'almoço', 'almoco', 'jantar', 'lanche'] },
  { icon: '🚗', glyph: '→', terms: ['uber', 'taxi', 'transporte', 'transport', 'combustível', 'combustivel', 'gasolina'] },
  { icon: '🏥', glyph: '+', terms: ['saúde', 'saude', 'health', 'farmácia', 'farmacia', 'pharmacy', 'médico', 'medico', 'medical', 'hospital'] },
  { icon: '📚', glyph: '≡', terms: ['educação', 'educacao', 'education', 'escola', 'curso', 'course', 'livro'] },
  { icon: '🏠', glyph: '⌂', terms: ['aluguel', 'rent', 'condomínio', 'condominio', 'casa', 'moradia', 'housing', 'home'] },
  { icon: '💡', glyph: '⚡', terms: ['luz', 'água', 'agua', 'internet', 'telefone', 'conta', 'bill', 'utilities'] },
  { icon: '🎬', glyph: '♪', terms: ['cinema', 'streaming', 'netflix', 'spotify', 'lazer', 'entertainment'] },
  { icon: '👕', glyph: '◇', terms: ['roupa', 'vestuário', 'vestuario', 'clothes', 'clothing', 'fashion'] },
  { icon: '🛍️', glyph: '◎', terms: ['shopping', 'compras', 'loja'] },
  { icon: '💻', glyph: '⌘', terms: ['tecnologia', 'eletrônico', 'eletronico', 'tech', 'computador', 'celular'] },
  { icon: '✈️', glyph: '✈', terms: ['viagem', 'travel', 'hotel', 'passagem', 'flight'] },
  { icon: '🐾', glyph: '❋', terms: ['pet', 'veterinário', 'veterinario', 'animal'] },
  { icon: '💄', glyph: '✧', terms: ['beleza', 'salão', 'salao', 'cabelo', 'beauty', 'cosmético', 'cosmetico', 'personal care'] },
  { icon: '💪', glyph: '△', terms: ['academia', 'esporte', 'fitness', 'gym'] },
  { icon: '📅', glyph: '÷', terms: ['installment', 'parcela', 'parcelamento'] },
  { icon: '📅', glyph: '%', terms: ['financing', 'financiamento'] },
  { icon: '📈', glyph: '↗', terms: ['investimento', 'investment', 'invest', 'poupança', 'poupanca', 'savings'] },
  { icon: '🛡️', glyph: '⌾', terms: ['insurance', 'seguro'] },
  { icon: '📱', glyph: '∞', terms: ['subscri', 'assinatura', 'software'] },
  { icon: '🎁', glyph: '♡', terms: ['presente', 'gift', 'donation', 'doação', 'doacao'] },
  { icon: '💳', glyph: '⇄', terms: ['pagamento', 'transferência', 'transferencia', 'pix', 'payment', 'transfer'] },
  { icon: '☕', glyph: '◡', terms: ['bar', 'bebida', 'café', 'cafe', 'drink', 'coffee'] },
  { icon: '💼', glyph: '§', terms: ['business', 'tax', 'negócio', 'negocio'] },
]

const ruleFor = (category: string) => {
  const name = (category || '').toLowerCase()
  return ICON_RULES.find(rule => rule.terms.some(term => name.includes(term)))
}

export function getCategoryIcon(category: string): string {
  return ruleFor(category)?.icon || '💰'
}

/** The monochrome mark, for icons that sit inside a colour-carrying square. */
export function getCategoryGlyph(category: string): string {
  return ruleFor(category)?.glyph || '•'
}
