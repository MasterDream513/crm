import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        profit: '#16a34a',
        loss:   '#dc2626',
        rank1:  '#94a3b8',
        rank2:  '#60a5fa',
        rank3:  '#34d399',
        rank4:  '#fbbf24',
        rank5:  '#f97316',
        rank6:  '#a855f7',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
