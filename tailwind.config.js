/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF9F6',
        warmgrey: '#F0EDE8',
        terracotta: '#E8735A',
        'terracotta-light': '#F4A492',
        'terracotta-pale': '#FDF0EC',
        charcoal: '#1C1C1E',
        muted: '#9CA3AF',
        'card-white': '#FFFFFF',
        'border-soft': '#F0EDE8',
        'green-soft': '#D1FAE5',
        'green-text': '#065F46',
        'red-soft': '#FEE2E2',
        'red-text': '#991B1B',
        'yellow-soft': '#FEF3C7',
        'yellow-text': '#92400E',
        'lavender-soft': '#EDE9FE',
        'lavender-text': '#5B21B6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-md': '0 4px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        'card-lg': '0 8px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
        'dock': '0 -1px 0 rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.12)',
        'inner-soft': 'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.01em',
        widest: '0.12em',
      },
    },
  },
  plugins: [],
}
