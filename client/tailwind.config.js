/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        mint: '#2fbf71',
        coral: '#f25f5c'
      }
    }
  },
  plugins: []
};
