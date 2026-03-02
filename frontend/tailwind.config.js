/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      brand: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      defaultWhite: '#ffffff',
      defaultGrey: 'rgb(141, 141, 141)',
      defaultBlack: '#000000',
      defaultRed: '#ea580c', // Updated to Brand Orange
      primaryBlue: '#111827', // Updated to Gray-900
      primaryCyan: '#26C6DA',
      secondaryBlue: '#0892D0',

      // Sage green/teal colors from the image
      sage: {
        50: '#f0f5f4',
        100: '#dce8e6',
        200: '#b9d1cd',
        300: '#8fb5af',
        400: '#6b968f',
        500: '#5a8880', // Main sage color from image
        600: '#4a6f69',
        700: '#3d5a55',
        800: '#334946',
        900: '#2d3e3b',
      },

      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#ea580c',
        600: '#c2410c',
        700: '#9a3412',
        800: '#7c2d12',
        900: '#431407',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      accent: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#a1020a',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#8d8d8d',
        600: '#737373',
        700: '#525252',
        800: '#404040',
        900: '#262626',
      }
    },
    fontFamily: {
      gilroyHeavy: ['Gilroy Heavy', 'sans-serif'],
      gilroyBold: ['Gilroy Bold', 'sans-serif'],
      gilroyRegular: ['Gilroy Regular', 'sans-serif'],
      gilroyMedium: ['Gilroy Medium', 'sans-serif'],
      gilroyLight: ['Gilroy Light', 'sans-serif']
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
      popIn: {
        '0%': { opacity: 0, transform: 'scale(0.95)' },
        '100%': { opacity: 1, transform: 'scale(1)' },
      },
      slideIn: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(0)' },
      },
    },
    animation: {
      'fade-in': 'fadeIn 1s ease-out',
      'pop-in': 'popIn 0.5s cubic-bezier(0.4,0,0.2,1)',
      'slide-in': 'slideIn 0.25s ease-out',
    },
  },
  plugins: [],
}