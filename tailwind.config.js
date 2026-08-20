module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shilaBlack: '#0b0f14',
        shilaCharcoal: '#111821',
        shilaCard: '#151d27',
        shilaSilver: '#b9c4d0',
        shilaGold: '#168bff',
        shilaGoldLight: '#67b7ff',
        shilaAccent: '#168bff'
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(22,139,255,.30), 0 18px 45px rgba(0,0,0,.42)'
      }
    }
  },
  plugins: [],
}
