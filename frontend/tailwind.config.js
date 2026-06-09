/** ACE Studio — 暖調工作室（tinted darks + amber accent；參考 impeccable 規則） */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#14110E', // 暖調近黑
        panel: '#1C1814', // 暖炭面板（比 base 亮一階，靠色階分層）
        input: '#252019', // 輸入/抬升層
        edge: '#322B23', // 細描邊（暖，謹慎使用）
        primary: '#E8A24C', // 琥珀（取代 AI 薄荷綠）
        secondary: '#C98A3E',
        danger: '#E5736B',
        txt: { DEFAULT: '#ECE6DD', sec: '#A79C8E', dim: '#6E6457' },
      },
      fontFamily: {
        ui: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Hanken Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 10px 30px -12px rgba(232, 162, 76, 0.4)',
      },
    },
  },
  plugins: [],
}
