module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shilaBlack: '#050505',
        shilaCharcoal: '#111111',
        shilaCard: '#151515',
        shilaSilver: '#b8b8b8',
        shilaGold: '#d6a928',
        shilaGoldLight: '#f0c94c',
        shilaAccent: '#d6a928'
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(214,169,40,.35), 0 18px 45px rgba(0,0,0,.45)'
      }
    }
  },
  plugins: [],
}
