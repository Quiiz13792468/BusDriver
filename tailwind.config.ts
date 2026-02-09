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
          50: '#ecf5f2',
          100: '#d5ece6',
          200: '#a8d7cc',
          300: '#76c1b1',
          400: '#3ea68f',
          500: '#12806e',
          600: '#0f6d5d',
          700: '#0d564a',
          800: '#0b443b',
          900: '#0a3530'
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
