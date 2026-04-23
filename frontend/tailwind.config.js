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
        // Base surfaces
        'bg-base':      '#0e0e0e',
        'bg-surface':   '#111113',
        'bg-elevated':  '#1a1a1c',
        'bg-overlay':   '#1e1e20',
        'bg-primary':   '#0e0e0e',
        'bg-secondary': '#111113',
        'bg-tertiary':  '#1a1a1c',

        // Accent — indigo-blue
        'accent':    '#5e6ad2',
        'accent-dim':'#4a54b8',
        'primary':   '#5e6ad2',
        'secondary': '#7c3aed',

        // Status
        'success': '#10b981',
        'warning': '#f97316',
        'danger':  '#ef4444',
        'info':    '#06b6d4',

        // Text hierarchy
        'text-primary':   '#f3f4f6',
        'text-secondary': '#9ca3af',
        'text-muted':     '#6b7280',
        'text-disabled':  '#4b5563',

        // Border
        'border-subtle': 'rgba(255,255,255,0.05)',
        'border-medium': 'rgba(255,255,255,0.10)',
        'border-strong': 'rgba(255,255,255,0.16)',
        'border-accent': 'rgba(94,106,210,0.4)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],   // 11px — labels
        'xs':  ['0.8125rem', { lineHeight: '1.25rem' }], // 13px — secondary UI
        'sm':  ['0.875rem',  { lineHeight: '1.375rem' }],// 14px — main text
        'base':['0.9375rem', { lineHeight: '1.5rem' }],  // 15px
      },
      height: {
        'row':    '44px',
        'header': '48px',
        'bar':    '32px',
      },
      width: {
        'sidebar': '240px',
        'detail':  '480px',
      },
      maxWidth: {
        'detail': '480px',
      },
      boxShadow: {
        'panel':        '0 4px 20px rgba(0,0,0,0.4)',
        'modal':        '0 20px 60px rgba(0,0,0,0.7)',
        'glow-accent':  '0 0 0 2px rgba(94,106,210,0.5)',
        'focus':        '0 0 0 2px #5e6ad2',
        'card':         '0 2px 8px rgba(0,0,0,0.3)',
        'glow-blue':    '0 0 0 2px rgba(94,106,210,0.5)',
        'glow-red':     '0 0 0 2px rgba(239,68,68,0.5)',
        'glow-green':   '0 0 0 2px rgba(16,185,129,0.5)',
        'glow-purple':  '0 0 0 2px rgba(124,58,237,0.4)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'fast':   'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-dot':     'pulseDot 2s ease-in-out infinite',
        'slide-in-right':'slideInRight 0.2s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':      'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':       'fadeIn 0.15s ease-in',
        'toast-in':      'toastIn 0.2s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.5', transform: 'scale(0.85)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        toastIn: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      letterSpacing: {
        'wider': '0.06em',
        'widest': '0.12em',
      },
    },
  },
  plugins: [],
}
