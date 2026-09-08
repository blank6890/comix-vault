/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#08090d',
          darker: '#040507',
          card: '#0f111a',
          cardHover: '#161926',
          border: '#1f2438',
          borderHover: '#323a59',
          muted: '#8f9bb3',
          text: '#f1f5f9'
        },
        sakura: {
          light: '#fb7185',
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
          glow: 'rgba(244, 63, 94, 0.4)'
        },
        violet: {
          light: '#a78bfa',
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
          glow: 'rgba(139, 92, 246, 0.4)'
        },
        cyan: {
          light: '#22d3ee',
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
          glow: 'rgba(6, 182, 212, 0.4)'
        },
        amber: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706'
        },
        emerald: {
          light: '#34d399',
          DEFAULT: '#10b981',
          dark: '#059669'
        }
      },
      boxShadow: {
        'glow-sakura': '0 0 25px -3px rgba(244, 63, 94, 0.45)',
        'glow-violet': '0 0 25px -3px rgba(139, 92, 246, 0.45)',
        'glow-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.45)',
        'glow-amber': '0 0 25px -3px rgba(245, 158, 11, 0.45)',
        'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)'
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        anime: ['Outfit', 'Space Grotesk', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s infinite linear'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        glow: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.8' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    },
  },
  plugins: [],
}
