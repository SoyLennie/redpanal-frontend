/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-900': '#0a1628',
        'secondary': '#94a3b8',
        'tertiary': '#64748b',
        'accent-cyan': '#00d4ff',
        'accent-lime': '#a8e063',
        'error': '#f87171',
        'border-subtle': 'rgba(255,255,255,0.08)',
        'border-default': 'rgba(255,255,255,0.15)',
      },
      borderRadius: {
        'token-sm': '6px',
        'token-md': '12px',
        'token-lg': '20px',
        'token-xl': '28px',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
