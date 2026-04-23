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
        'bg-primary': '#191a1f',
        'bg-secondary': '#22252e',
        'bg-tertiary': '#2a2e38',
        'primary': '#3b82f6',
        'secondary': '#8b5cf6',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'info': '#06b6d4',
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'text-disabled': '#475569',
        'border-subtle': '#2a2e38',
        'border-medium': '#3d4450',

        // Landing / shell near-black (use bg-black-true, text-black-true — not bg-bg-*)
        'black-true': '#050505',
        'neon-cyan': '#00f2ff',
        'neon-magenta': '#ff00e5',
        'neon-lime': '#adff00',
      },
      fontFamily: {
        sans: ['"Google Sans Text"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
        
        // Brand new editorial typography for landing page
        cabinet: ['"Cabinet Grotesk"', 'sans-serif'],
        satoshi: ['Satoshi', 'sans-serif'],
        space: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.6)',
        
        // Landing Page Neon Glows
        'glow-cyan': '0 0 30px -10px #00f2ff',
        'glow-magenta': '0 0 30px -10px #ff00e5',
        'glow-lime': '0 0 30px -10px #adff00',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scanline-anim': 'scanline 8s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' } /* Scan across viewport */
        }
      },
    },
  },
  plugins: [],
}

