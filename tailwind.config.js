/** @type {import('tailwindcss').Config} */

// Controle Financeiro — identidade "Editorial".
// Papel quente e tinta: a hierarquia vem de tipografia e régua de 1px, não de
// card com sombra. Cor é semântica (positivo / negativo / requer ação), nunca
// decorativa. Os valores vivem em assets/css/tokens.css; aqui só os expomos
// como utilitários.
const token = (name) => `var(--${name})`

module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        // --- Superfícies (máximo duas por tela) ---
        canvas: token('canvas'),
        'surface-1': token('surface-1'),
        'surface-2': token('surface-2'),
        'surface-3': token('surface-3'),

        // --- Linhas ---
        'rule-soft': token('rule-soft'),
        rule: token('rule'),
        'rule-strong': token('rule-strong'),

        // --- Tinta ---
        ink: token('ink'),
        'ink-2': token('ink-2'),
        'text-2': token('text-2'),
        'text-3': token('text-3'),
        'text-4': token('text-4'),

        // --- Semânticas ---
        accent: token('accent'),
        'accent-wash': token('accent-wash'),
        'pos-text': token('pos-text'),
        neg: token('neg'),
        'neg-bar': token('neg-bar'),
        'neg-swatch': token('neg-swatch'),
        'neg-fill': token('neg-fill'),
        'neg-text': token('neg-text'),
        'neg-wash': token('neg-wash'),
        warn: token('warn'),
        'warn-wash': token('warn-wash'),

        // --- Compatibilidade ---
        // As telas ainda não redesenhadas (orçamento, templates, custos fixos,
        // parcelas, categorias, transações) usam estes nomes. Apontá-los para os
        // tokens novos retematiza todas de uma vez, sem tocar no layout delas —
        // que é o que o handoff pede (os designs dessas telas ainda não existem).
        // Remover conforme cada tela for redesenhada.
        positive: token('pos-text'),
        negative: token('neg-text'),
        neutral: token('text-2'),
        warning: token('warn'),
        'text-primary': token('ink'),
        'text-secondary': token('text-2'),
        'text-muted': token('text-3'),
        'text-inverse': token('surface-1'),
        'background-page': token('surface-1'),
        'background-card': token('surface-1'),
        'background-section': token('surface-2'),
        'background-hover': token('surface-2'),
        'border-base': token('border'),
        'border-subtle': token('rule'),
        'accent-primary': token('accent'),
        'accent-primary-hover': token('pos-text'),
        'accent-success': token('pos-text'),
        'accent-warning': token('warn'),
        'accent-danger': token('neg-text'),
        'accent-info': token('text-2'),
      },

      borderColor: {
        DEFAULT: token('border'),
        base: token('border'),
      },

      fontFamily: {
        // Serifa marca o que é resultado; sans é a interface.
        display: ['Instrument Serif', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Public Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },

      fontSize: {
        // Serifa
        hero: ['82px', { lineHeight: '0.9', letterSpacing: '-0.01em', fontWeight: '400' }],
        'hero-2': ['38px', { lineHeight: '1', fontWeight: '400' }],
        section: ['22px', { lineHeight: '1.2', fontWeight: '400' }],
        brand: ['21px', { lineHeight: '1.1', fontWeight: '400' }],

        // Interface
        value: ['15px', { lineHeight: '1.3', fontWeight: '600' }],
        'value-sm': ['14.5px', { lineHeight: '1.3', fontWeight: '600' }],
        item: ['14px', { lineHeight: '1.35', fontWeight: '500' }],
        body: ['13.5px', { lineHeight: '1.45' }],
        'body-sm': ['13px', { lineHeight: '1.45' }],
        meta: ['12.5px', { lineHeight: '1.4' }],
        micro: ['12px', { lineHeight: '1.4' }],
        label: ['11px', { lineHeight: '1.2', letterSpacing: '0.16em', fontWeight: '700' }],
        caption: ['10px', { lineHeight: '1.2', letterSpacing: '0.12em' }],

        // --- Compatibilidade: escala antiga usada pelas telas não redesenhadas ---
        'kpi-xl': ['38px', { lineHeight: '1', fontWeight: '400' }],
        'kpi-lg': ['30px', { lineHeight: '1.05', fontWeight: '400' }],
        'kpi-md': ['24px', { lineHeight: '1.1', fontWeight: '400' }],
        'kpi-sm': ['19px', { lineHeight: '1.2', fontWeight: '500' }],
      },

      spacing: {
        // Só os degraus da escala que NÃO colidem com a numérica do Tailwind.
        // 7/10/11/14/16 existem por padrão (1.75rem, 2.5rem, …) e redefini-los
        // encolheria `h-11`, `lg:px-10` e afins nas telas ainda não redesenhadas.
        // Para esses, use valor arbitrário: `gap-[10px]`.
        18: '18px', 22: '22px', 26: '26px', 30: '30px', 34: '34px',
        sidebar: '232px',
      },

      borderRadius: {
        bar: '2px',
        control: '3px',
        shell: '4px',

        // "Nada de 8px+ — nenhuma pill card." A escala default do Tailwind vai
        // até 16px e as telas ainda não redesenhadas usam rounded-lg/xl/2xl à
        // vontade; remapeá-las aqui aplica a linguagem de forma do sistema sem
        // precisar tocar no markup de cada uma. `rounded-full` continua full,
        // que é o correto para barras de progresso e avatar.
        md: '3px',
        lg: '3px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
      },

      boxShadow: {
        // A única sombra do sistema, e só no shell do app.
        app: '0 1px 2px oklch(0.24 0.012 60 / 0.04), 0 12px 32px oklch(0.24 0.012 60 / 0.06)',
      },

      transitionTimingFunction: {
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      maxWidth: {
        app: '1360px',
      },
    },
  },
  plugins: [],
}
