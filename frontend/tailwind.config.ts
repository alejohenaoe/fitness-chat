import type { Config } from 'tailwindcss';

// Los colores viven como variables en src/index.css (canales RGB) para poder
// añadir un modo oscuro más adelante sin tocar los componentes.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Mismo interlineado que la maqueta (1,4) en toda la escala de texto.
      fontSize: {
        xs: ['0.75rem', '1.4'],
        sm: ['0.875rem', '1.4'],
        base: ['1rem', '1.4'],
        lg: ['1.125rem', '1.4'],
        xl: ['1.25rem', '1.4'],
      },
      fontFamily: {
        sans: ['Barlow', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        num: ['"Barlow Condensed"', '"Arial Narrow"', '"Roboto Condensed"', 'sans-serif'],
      },
      colors: {
        paper: token('paper'),
        card: token('card'),
        ink: { DEFAULT: token('ink'), 2: token('ink-2') },
        muted: token('muted'),
        line: { DEFAULT: token('line'), 2: token('line-2') },
        leader: token('leader'),
        volt: { DEFAULT: token('volt'), ink: token('volt-ink'), soft: token('volt-soft') },
        protein: token('protein'),
        carbs: token('carbs'),
        fat: token('fat'),
        danger: { DEFAULT: token('danger'), soft: token('danger-soft'), ink: token('danger-ink') },
        // Superficie oscura del marcador del día
        night: {
          text: token('night-text'),
          muted: token('night-muted'),
          track: token('night-track'),
          rule: token('night-rule'),
        },
        // Alias temporales de la paleta anterior: las pantallas que aún no se
        // rediseñan (fases 3 y 4) los usan. Se eliminan al terminar la fase 4.
        brand: { 400: token('ink-2'), 500: token('ink'), 600: token('ink'), 900: token('ink') },
        surface: {
          50: token('ink'), 100: token('ink-2'), 700: token('muted'), 800: token('line'),
          850: token('line-2'), 900: token('line-2'), 950: token('paper'),
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
