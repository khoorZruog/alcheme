/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luminous Theme
        'lum-base': '#FAFAFA',
        'lum-surface': '#FFFFFF',

        // Alchemy Accents
        'alchemy-gold': '#C8A359',
        'alchemy-gold-light': '#FCEEB5',
        'magic-pink': '#FFB7C5',
        'magic-purple': '#E0BBE4',
        'neon-accent': '#7C3AED',

        // Text (Ink colors)
        'text-ink': '#1A1A1D',
        'text-muted': '#8E8E93',

        // Rarity
        'rarity-ssr': '#F59E0B',
        'rarity-sr': '#A855F7',
        'rarity-r': '#3B82F6',

        // Legacy compat (remapped to new palette)
        alcheme: {
          gold:       '#C8A359',
          rose:       '#7C3AED',   // → neon-accent (primary action)
          blush:      '#E0BBE4',
          cream:      '#FAFAFA',
          sand:       '#F0F0F0',
          charcoal:   '#1A1A1D',
          muted:      '#8E8E93',
          success:    '#7EB8A0',
          warning:    '#E8B85E',
          danger:     '#D97070',
          ssr:        '#F59E0B',
          sr:         '#A855F7',
          r:          '#3B82F6',
          n:          '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Zen Maru Gothic"', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Zen Maru Gothic"', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        button: '16px',
        badge: '9999px',
        input: '9999px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.06)',
        'soft-float': '0 10px 40px -10px rgba(200, 163, 89, 0.2)',
        'neon-glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        glow: '0 0 20px rgba(200, 163, 89, 0.25)',
      },
      animation: {
        blob: 'blob 10s infinite cubic-bezier(0.4, 0, 0.2, 1)',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
