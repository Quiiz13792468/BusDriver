import type { Config } from 'tailwindcss';
import animatePlugin from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'sans-serif']
      },
      colors: {
        // Modern, high-contrast palette tuned for readability
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        },
        accent: {
          50: '#fff4ec',
          100: '#ffe4d1',
          200: '#ffc7a3',
          300: '#ff9f6c',
          400: '#ff7c42',
          500: '#f4612f',
          600: '#dc4e20',
          700: '#b83e19',
          800: '#8f2f13',
          900: '#6a220d'
        }
      }
    }
  },
  plugins: [animatePlugin]
};

export default config;
