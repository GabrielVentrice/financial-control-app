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
        // --- Flat semantic colors (financial data) ---
        positive: '#059669',   // emerald-600 - Income, positive trends
        negative: '#DC2626',   // red-600 - Expenses, negative trends
        neutral: '#2563EB',    // blue-600 - Informational
        warning: '#D97706',    // amber-600 - Alerts
        accent: '#4F46E5',     // indigo-600 - Actions, links

        // --- Text tokens ---
        'text-primary': '#111111',     // Headings, key values
        'text-secondary': '#4B5563',   // gray-600 - Body / descriptions (WCAG AA on white)
        'text-muted': '#6B7280',       // gray-500 - Captions, labels
        'text-inverse': '#FFFFFF',     // Text on accent surfaces

        // --- Background tokens ---
        'background-page': '#FAFBFC',     // App page background
        'background-card': '#FFFFFF',     // Cards, sheets
        'background-section': '#F9FAFB',  // gray-50 - Inset sections, inputs
        'background-hover': '#F3F4F6',    // gray-100 - Hover surfaces

        // --- Border tokens ---
        'border-base': '#E5E7EB',     // gray-200 - Default borders
        'border-subtle': '#F3F4F6',   // gray-100 - Hairline separators

        // --- Accent set (actions + status) ---
        'accent-primary': '#4F46E5',        // indigo-600
        'accent-primary-hover': '#4338CA',  // indigo-700
        'accent-success': '#059669',        // emerald-600
        'accent-warning': '#D97706',        // amber-600
        'accent-danger': '#DC2626',         // red-600
        'accent-info': '#2563EB',           // blue-600
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'kpi-lg': ['2.25rem', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.02em' }],   // 36px
        'kpi-md': ['1.75rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],   // 28px
        'kpi-sm': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],                             // 20px
      },
    },
  },
  plugins: [],
}
