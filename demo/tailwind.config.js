/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fff8ea',
        paper: '#fffdf5',
        mint: '#97d8b2',
        tomato: '#ef6b5b',
        saffron: '#f6bd4f',
        ink: '#2e2a27',
        cocoa: '#8a5a44',
        skyglass: '#d7ecf5',
      },
      boxShadow: {
        pixel: '0 5px 0 #2e2a27',
        soft: '0 18px 45px rgba(138, 90, 68, 0.16)',
      },
      fontFamily: {
        display: ['"Trebuchet MS"', '"Noto Sans SC"', 'sans-serif'],
        body: ['"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
