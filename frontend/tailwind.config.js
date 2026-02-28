/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        defaultWhite: '#ffffff',
        defaultGrey: 'rgb(141, 141, 141)',
        defaultBlack: '#000000',
        defaultRed: '#a1020a',
        primaryBlue: '#1E488F',
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
          50: '#f1f0ff',
          100: '#e5e3ff',
          200: '#ccc9ff',
          300: '#a8a1ff',
          400: '#7c6eff',
          500: '#48448c', 
          600: '#3d3975',
          700: '#332f61',
          800: '#2a2651',
          900: '#252143',
        },
        secondary: {
          50: '#e0fbff',
          100: '#b3f5ff',
          200: '#80efff',
          300: '#4de6ff',
          400: '#26dcff',
          500: '#26C6DA', 
          600: '#21a5b6',
          700: '#1c8491',
          800: '#17636d',
          900: '#124248',
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
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'pop-in': 'popIn 0.5s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
}