/** ACE Studio DAW 深色配色（對應 docs/FRONTEND-SPEC.md §2） */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0E1014',
        panel: '#171A21',
        input: '#1F2430',
        edge: '#2A3140',
        primary: '#34D399',
        secondary: '#A78BFA',
        danger: '#F87171',
        txt: { DEFAULT: '#E5E7EB', sec: '#9CA3AF', dim: '#6B7280' },
      },
      fontFamily: {
        ui: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 10px 34px -8px rgba(52, 211, 153, 0.45)',
      },
    },
  },
  plugins: [],
}
