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
      // Professional Financial App Design System (Light Theme)
      colors: {
        // Core semantic colors for financial data
        positive: '#059669',   // emerald-600 - Income, positive trends
        negative: '#DC2626',   // red-600 - Expenses, negative trends
        neutral: '#2563EB',    // blue-600 - Informational
        warning: '#D97706',    // amber-600 - Alerts
        accent: '#4F46E5',     // indigo-600 - Actions, links
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Professional KPI sizes - maximum text-3xl for largest values
        'kpi-lg': ['1.875rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em' }],  // 30px
        'kpi-md': ['1.5rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],    // 24px
        'kpi-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],                             // 20px
      },
    },
  },
  plugins: [],
}
