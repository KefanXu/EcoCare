/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          component: '#f4a896',
          stakeholder: '#f6d36b',
          practice: '#f1948a',
          information: '#86c5d8',
          conflict: '#fb7185',
        },
        ring_fill: {
          microsystem: '#fdf2e9',
          mesosystem: '#e8f5e9',
          exosystem: '#dceefb',
          macrosystem: '#cfe6f5',
          chronosystem: '#bcd9ee',
        },
      },
    },
  },
  plugins: [],
};
