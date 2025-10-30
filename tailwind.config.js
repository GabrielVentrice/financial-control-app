/** @type {import('tailwindcss').Config} */
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
        // Claude Dark Design System (Refined)
        background: {
          page: '#0C0C0C',
          sidebar: '#1A1A1A',
          card: '#1A1A1A',        // Mais integrado ao fundo
          section: '#1A1A1A',     // Uniforme com cards
          hover: '#2A2A2A',
          input: '#1A1A1A',
        },
        border: {
          base: '#2A2A2A',        // Borda sutil, quase imperceptível
          subtle: '#2E2E2E',
        },
        divider: '#333333',       // Separação mais sutil
        text: {
          primary: '#F3F3F3',
          secondary: '#B0B0B0',   // Aumenta legibilidade
          muted: '#888888',
          inverse: '#0A0A0A',
        },
        accent: {
          primary: '#FF8455',     // Levemente mais pastel
          'primary-hover': '#FF8C5E',
          info: '#7ACBD8',
          warning: '#D1B892',
          success: '#3DD68C',
          danger: '#E34D4D',
        },
        chart: {
          positive: '#3DD68C',
          negative: '#E34D4D',
          neutral: '#D1B892',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
      },
      lineHeight: {
        relaxed: '1.6',
      },
      letterSpacing: {
        tight: '-0.01em',
      },
    },
  },
  plugins: [],
}
