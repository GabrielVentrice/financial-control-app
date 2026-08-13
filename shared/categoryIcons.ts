/**
 * Category → emoji, shared by the two budget screens.
 *
 * Each screen used to carry its own map and they disagreed on half the
 * categories — the same "Medical" row showed a different icon depending on
 * which screen you were on. Matching is case-insensitive substring, as
 * everywhere else in the app.
 *
 * Framework-agnostic (no Vue/Nitro) so both sides can import it.
 */

/**
 * First match wins, so narrower terms come first: "taxi" has to be caught by
 * transport before "tax" reaches the business rule.
 */
const ICON_RULES: Array<{ icon: string; terms: string[] }> = [
  { icon: '🛒', terms: ['mercado', 'supermercado', 'grocer'] },
  { icon: '🍽️', terms: ['restaurante', 'restaurant', 'comida', 'alimentação', 'alimentacao', 'food', 'almoço', 'almoco', 'jantar', 'lanche'] },
  { icon: '🚗', terms: ['uber', 'taxi', 'transporte', 'transport', 'combustível', 'combustivel', 'gasolina'] },
  { icon: '🏥', terms: ['saúde', 'saude', 'health', 'farmácia', 'farmacia', 'pharmacy', 'médico', 'medico', 'medical', 'hospital'] },
  { icon: '📚', terms: ['educação', 'educacao', 'education', 'escola', 'curso', 'course', 'livro'] },
  { icon: '🏠', terms: ['aluguel', 'rent', 'condomínio', 'condominio', 'casa', 'moradia', 'housing'] },
  { icon: '💡', terms: ['luz', 'água', 'agua', 'internet', 'telefone', 'conta', 'bill', 'utilities'] },
  { icon: '🎬', terms: ['cinema', 'streaming', 'netflix', 'spotify', 'lazer', 'entertainment'] },
  { icon: '👕', terms: ['roupa', 'vestuário', 'vestuario', 'clothes', 'clothing', 'fashion'] },
  { icon: '🛍️', terms: ['shopping', 'compras', 'loja'] },
  { icon: '💻', terms: ['tecnologia', 'eletrônico', 'eletronico', 'tech', 'computador', 'celular'] },
  { icon: '✈️', terms: ['viagem', 'travel', 'hotel', 'passagem', 'flight'] },
  { icon: '🐾', terms: ['pet', 'veterinário', 'veterinario', 'animal'] },
  { icon: '💄', terms: ['beleza', 'salão', 'salao', 'cabelo', 'beauty', 'cosmético', 'cosmetico'] },
  { icon: '💪', terms: ['academia', 'esporte', 'fitness', 'gym'] },
  { icon: '📅', terms: ['installment', 'parcela', 'parcelamento', 'financing', 'financiamento'] },
  { icon: '📈', terms: ['investimento', 'investment', 'invest', 'poupança', 'poupanca', 'savings'] },
  { icon: '🛡️', terms: ['insurance', 'seguro'] },
  { icon: '📱', terms: ['subscri', 'assinatura', 'software'] },
  { icon: '🎁', terms: ['presente', 'gift'] },
  { icon: '💳', terms: ['pagamento', 'transferência', 'transferencia', 'pix', 'payment', 'transfer'] },
  { icon: '☕', terms: ['bar', 'bebida', 'café', 'cafe', 'drink', 'coffee'] },
  { icon: '💼', terms: ['business', 'tax', 'negócio', 'negocio'] },
]

export function getCategoryIcon(category: string): string {
  const name = (category || '').toLowerCase()
  return ICON_RULES.find(rule => rule.terms.some(term => name.includes(term)))?.icon || '💰'
}
