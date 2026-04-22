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
        // core-engine neon palette
        'bg-base': '#050505',
        'neon-cyan': '#00f2ff',
        'neon-magenta': '#ff00e5',
        'neon-lime': '#adff00',
        'glass-bg': 'rgba(255, 255, 255, 0.02)',
        'glass-border': 'rgba(255, 255, 255, 0.05)',
        // P2 legacy palette (keeps existing pages rendering)
        'bg-primary': '#050505',
        'bg-secondary': '#0d1117',
        'text-primary': '#00f2ff',
        'text-secondary': '#ffffff99',
        'primary': '#00f2ff',
        'secondary': '#ff00e5',
        'success': '#adff00',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'border-subtle': 'rgba(255,255,255,0.05)',
        'border-medium': 'rgba(255,255,255,0.10)',
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
        'glow-cyan': '0 0 20px rgba(0,242,255,0.4)',
        'glow-violet': '0 0 20px rgba(255,0,229,0.4)',
        'glow-red': '0 0 20px rgba(239,68,68,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      }
    },
  },
  plugins: [],
}
