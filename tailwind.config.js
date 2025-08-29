/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Add safe area padding utilities for mobile devices
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      // Extend theme colors with Lebara brand colors and semantic tokens
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          700: 'var(--brand-primary-700)',
          navy: 'var(--brand-navy)',
          navy800: 'var(--brand-navy-800)',
          accent: 'var(--brand-accent)',
        },
        bg: 'var(--bg)',
        card: 'var(--card)',
        text: 'var(--text)',
        muted: 'var(--muted)',
      }
    },
  },
  plugins: [],
}
