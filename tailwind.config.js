/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        romantic: {
          50: '#fff5f7',
          100: '#ffe4ea',
          200: '#fecdde',
          300: '#fba5c3',
          400: '#f66d9f',
          500: '#ec3e7d',
          600: '#d71f63',
          700: '#b7134f',
          800: '#971343',
          900: '#7e143c',
          950: '#46051d',
        },
        blush: {
          light: '#fff1f2',
          DEFAULT: '#ffe4e6',
          soft: '#fce7eb',
          deep: '#f43f5e',
        },
        cream: {
          50: '#fffdfa',
          100: '#fdfbf7',
          200: '#f9f5ed',
          300: '#f2ece0',
        },
        burgundy: {
          light: '#831843',
          DEFAULT: '#701a35',
          deep: '#4a041c',
        },
        gold: {
          light: '#fef08a',
          DEFAULT: '#eab308',
          subtle: '#ca8a04',
          champagne: '#f7e7ce',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Dancing Script"', '"Great Vibes"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 7s ease-in-out infinite',
        'float-reverse': 'floatReverse 8s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-4deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      boxShadow: {
        'romantic': '0 10px 30px -10px rgba(225, 29, 72, 0.15)',
        'romantic-lg': '0 20px 40px -15px rgba(225, 29, 72, 0.22)',
        'romantic-glow': '0 0 25px rgba(244, 63, 94, 0.35)',
      }
    },
  },
  plugins: [],
}
