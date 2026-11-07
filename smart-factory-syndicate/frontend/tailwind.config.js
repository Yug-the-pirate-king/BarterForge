/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        factory: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#3b82f6',
          warning: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
        }
      }
    },
  },
  plugins: [],
};

