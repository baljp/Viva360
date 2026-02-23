/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './views/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f7f5',
          100: '#e3ebe7',
          200: '#c5dcd3',
          300: '#9dbfb2',
          400: '#759f90',
          500: '#558273',
          600: '#41665a',
          700: '#365249',
          800: '#2d423c',
          900: '#263732',
        },
        nature: {
          25: '#fcfdfc',
          50: '#fafbf9',
          100: '#f2f4f1',
          200: '#e4e8e1',
          300: '#d1d8cd',
          400: '#aab5a4',
          500: '#86947e',
          600: '#687561',
          700: '#545f4e',
          800: '#444c40',
          900: '#1a211d',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        breathe: 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
