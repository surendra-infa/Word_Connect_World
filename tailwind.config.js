/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        fly: {
          '0%': {
            transform: 'translate(-50%, 0) scale(1) rotate(0deg)',
            opacity: '1',
          },
          '70%': { opacity: '0.9' },
          '100%': {
            transform: 'translate(-50%, 360px) scale(0.35) rotate(-4deg)',
            opacity: '0',
          },
        },
        'bg-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'float-orb': {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-24px) scale(1.12)' },
          '66%': { transform: 'translate(-22px,18px) scale(0.92)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
        'float-orb-2': {
          '0%': { transform: 'translate(0,0) scale(0.95)' },
          '25%': { transform: 'translate(-34px,20px) scale(1.15)' },
          '50%': { transform: 'translate(18px,34px) scale(0.9)' },
          '75%': { transform: 'translate(36px,-18px) scale(1.08)' },
          '100%': { transform: 'translate(0,0) scale(0.95)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        aurora: {
          '0%': { transform: 'translate(-12%, -4%) rotate(-3deg) scale(1)' },
          '50%': { transform: 'translate(12%, 6%) rotate(3deg) scale(1.15)' },
          '100%': { transform: 'translate(-12%, -4%) rotate(-3deg) scale(1)' },
        },
        rise: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '12%': { opacity: '0.9' },
          '85%': { opacity: '0.35' },
          '100%': { transform: 'translateY(-110vh) translateX(24px)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'gradient-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'complete-glow': {
          '0%, 100%': {
            boxShadow:
              'inset 0 2px 5px rgba(0,0,0,0.5), 0 0 18px 2px var(--bar-glow), 0 0 40px 6px var(--bar-glow)',
          },
          '50%': {
            boxShadow:
              'inset 0 2px 5px rgba(0,0,0,0.5), 0 0 28px 6px var(--bar-glow), 0 0 70px 14px var(--bar-glow)',
          },
        },
        'spark-burst': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '40%': { opacity: '1' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'chip-land': {
          '0%': { transform: 'translateY(14px) scale(0.5)', opacity: '0' },
          '55%': { transform: 'translateY(-5px) scale(1.1)', opacity: '1' },
          '75%': { transform: 'translateY(2px) scale(0.97)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'emoji-float': {
          '0%': { transform: 'translateY(6px) scale(0.4)', opacity: '0' },
          '25%': { transform: 'translateY(0) scale(1.15)', opacity: '1' },
          '70%': { transform: 'translateY(-4px) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-14px) scale(0.9)', opacity: '0' },
        },
      },
      animation: {
        pop: 'pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        shake: 'shake 500ms ease-in-out',
        fly: 'fly 700ms cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards',
        'bg-shift': 'bg-shift 24s ease-in-out infinite',
        'float-orb': 'float-orb 18s ease-in-out infinite',
        'float-orb-2': 'float-orb-2 22s ease-in-out infinite',
        'spin-slow': 'spin-slow 60s linear infinite',
        aurora: 'aurora 26s ease-in-out infinite',
        rise: 'rise linear infinite',
        'pulse-soft': 'pulse-soft 5s ease-in-out infinite',
        'gradient-flow': 'gradient-flow 6s ease-in-out infinite',
        'complete-glow': 'complete-glow 2.4s ease-in-out infinite',
        'spark-burst': 'spark-burst 900ms ease-out forwards',
        shimmer: 'shimmer 2.2s linear infinite',
        'chip-land': 'chip-land 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'emoji-float': 'emoji-float 1400ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
