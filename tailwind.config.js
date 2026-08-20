module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shilaBlack: '#050505',
        shilaCharcoal: '#0f1012',
        shilaCard: '#151515',
        shilaSilver: '#c6c7ca',
        shilaGold: '#d59b15',
        shilaGoldLight: '#f2c14e',
        shilaAccent: '#e1aa28'
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(213,155,21,.32), 0 20px 55px rgba(0,0,0,.55)'
      }
    }
  },
  plugins: [],
}
