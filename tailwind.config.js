module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shilaBlack: '#050607',
        shilaCharcoal: '#111418',
        shilaCard: '#1b2026',
        shilaSilver: '#aeb6c0',
        shilaGold: '#c9d0d8',
        shilaGoldLight: '#f4f6f8',
        shilaAccent: '#d7dde4'
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(201,208,216,.28), 0 18px 45px rgba(0,0,0,.42)'
      }
    }
  },
  plugins: [],
}
