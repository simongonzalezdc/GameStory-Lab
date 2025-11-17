/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nature-inspired palette
        forest: {
          50: '#f0f9f4',
          100: '#dbf0e4',
          200: '#b9e0cb',
          300: '#8bcaac',
          400: '#5bab88',
          500: '#3a8f6b',
          600: '#2a7256',
          700: '#235c46',
          800: '#1f4a39',
          900: '#1a3d30',
        },
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        earth: {
          50: '#faf8f3',
          100: '#f5f0e6',
          200: '#e8dcc5',
          300: '#d9c59f',
          400: '#c9ab77',
          500: '#b8925c',
          600: '#a07849',
          700: '#85603e',
          800: '#6d4f37',
          900: '#5a4230',
        },
      },
    },
  },
  plugins: [],
};
