import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0fdf4', 100: '#dcfce7', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 900: '#14532d' },
        surface: { 50: '#fafafa', 100: '#f4f4f5', 700: '#3f3f46', 800: '#27272a', 850: '#1f1f22', 900: '#18181b', 950: '#09090b' }
      }
    }
  },
  plugins: []
} satisfies Config;
