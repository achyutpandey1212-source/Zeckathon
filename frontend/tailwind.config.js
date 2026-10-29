/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        anthropic: {
          dark: '#141413',
          light: '#faf9f5',
          midGray: '#b0aea5',
          lightGray: '#e8e6dc',
          orange: '#d97757',
          blue: '#6a9bcc',
          green: '#788c5d',
          crimson: '#b83a2d',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'Arial', 'sans-serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
