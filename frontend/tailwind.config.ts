import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 900: '#1E3A5F' },
        surface: { 50: '#111827', 100: '#4B5563', 700: '#9CA3AF', 800: '#DFE1E5', 850: '#E8EAED', 900: '#F0F2F5', 950: '#F8F9FA' },
      }
    }
  },
  plugins: []
} satisfies Config;
