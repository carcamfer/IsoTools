// =============================================================================
// SOLO SI ESTAS EN TAILWIND v3. En v4 el tema vive en `index.css` (@theme) y
// este archivo sobra.
//
// Mismos valores que `index.css`, expresados como preset. Uno u otro, nunca los
// dos: dos fuentes de verdad para un color terminan divergiendo y entonces tu
// `ok` verde no es el `ok` verde del dashboard.
//
//   // tailwind.config.cjs
//   module.exports = {
//     presets: [require('./tailwind-preset.cjs')],
//     content: ['./index.html', './src/**/*.{ts,tsx}'],
//   };
// =============================================================================
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Superficies
        bg: '#0E1216', // pagina
        surface: '#161B21', // paneles / tarjetas
        surface2: '#1E242B', // hundidos: cabecera de tabla, hover, chips, inputs
        border: '#262D35',

        // Texto
        text: '#E6E9EC', // principal
        muted: '#9AA4AE', // secundario
        faint: '#6B7681', // terciario / pistas

        // Estado (cada uno significa algo — ver ui/README.md §3)
        brass: '#D6A23E', // marca / federado
        ok: '#3FB36B',
        warn: '#E0A93B',
        danger: '#E5604D',
        info: '#4C8FBF', // informativo y color primario de accion
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
    },
  },
};

// Si tu app usa shadcn/ui, mapea ADEMAS sus tokens semanticos a esta misma
// paleta, para que los componentes de `components/ui/` no traigan su propio gris:
//
//   :root, .dark {
//     --background: 210 22% 7%;    /* #0E1216 */
//     --foreground: 210 14% 91%;   /* #E6E9EC */
//     --card: 213 20% 11%;         /* #161B21 */
//     --secondary: 212 18% 14%;    /* #1E242B */
//     --muted: 212 18% 14%;
//     --muted-foreground: 210 11% 64%;  /* #9AA4AE */
//     --primary: 205 47% 52%;      /* #4C8FBF */
//     --destructive: 8 75% 60%;    /* #E5604D */
//     --border: 212 17% 20%;
//     --input: 212 17% 20%;
//     --ring: 205 47% 52%;
//     --radius: 0.5rem;
//   }
