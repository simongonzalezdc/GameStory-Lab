/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic color tokens using CSS variables
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-card': 'var(--color-surface-card)',
        'surface-strong': 'var(--color-surface-strong)',
        'surface-muted': 'var(--color-surface-muted)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        // Brand colors: Fireopal orange primary scale
        brand: {
          50: '#fef3ed',
          100: '#fde4d6',
          200: '#fbc7ad',
          300: '#f8a179',
          400: '#f47a4a',
          500: '#d26a3a', // fireopal primary
          600: '#b85a2f',
          700: '#9a4a28',
          800: '#7d3d22',
          900: '#5a3324',
        },
        // Secondary colors: Topaz accent
        mint: {
          400: '#e6b65a',
          500: '#d89e32', // topaz secondary
        },
      },
      backgroundColor: {
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-card': 'var(--color-surface-card)',
        'surface-strong': 'var(--color-surface-strong)',
        'surface-muted': 'var(--color-surface-muted)',
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        muted: 'var(--color-text-muted)',
      },
      borderColor: {
        subtle: 'var(--color-border-subtle)',
        strong: 'var(--color-border-strong)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgb(0 0 0 / 0.04)',
        'medium': '0 4px 12px 0 rgb(0 0 0 / 0.08)',
        'large': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
        'glow': '0 0 0 1px rgba(210, 106, 58, 0.2), 0 12px 40px -18px rgba(216, 158, 50, 0.45)',
      },
    },
  },
  plugins: [],
}
