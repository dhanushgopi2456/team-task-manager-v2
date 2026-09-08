/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Outfit', 'sans-serif'],
      },
      colors: {
        base: {
          950: '#05070f',
          900: '#0a0d1a',
          850: '#0e1226',
          800: '#131832',
          700: '#1c2242',
        },
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#5457ea',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 6, 23, 0.35)',
        'glass-lg': '0 24px 60px -12px rgba(2, 6, 23, 0.55), 0 8px 24px rgba(2, 6, 23, 0.35)',
        'card-hover': '0 28px 60px -12px rgba(79, 70, 229, 0.28), 0 12px 28px rgba(2, 6, 23, 0.45)',
        glow: '0 0 40px -10px rgba(99, 102, 241, 0.45)',
        'inner-hi': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(30px,-20px,0) scale(1.06)' },
          '66%': { transform: 'translate3d(-24px,16px,0) scale(0.97)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'float-y': 'floatY 7s ease-in-out infinite',
        drift: 'drift 26s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
