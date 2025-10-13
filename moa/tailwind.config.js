/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      moa: '#3F72AF',
    },
    boxShadow: {
      card: '0 10px 20px rgba(0,0,0,0.08)',
    },
  },
  plugins: [],
}
