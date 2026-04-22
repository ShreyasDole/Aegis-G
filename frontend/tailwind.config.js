/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#050505',
        'neon-cyan': '#00f2ff',
        'neon-magenta': '#ff00e5',
        'neon-lime': '#adff00',
        'glass-bg': 'rgba(255, 255, 255, 0.02)',
        'glass-border': 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'sans-serif'],
        sans: ['Satoshi', 'sans-serif'],
        mono: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 30px -10px #00f2ff',
        'neon-magenta': '0 0 30px -10px #ff00e5',
        'neon-lime': '0 0 30px -10px #adff00',
      }
    },
  },
  plugins: [],
}
