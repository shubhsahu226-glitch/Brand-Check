/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          lime: '#d4ff32',
          limeHover: '#bfe818',
          obsidian: '#0f140f',
          obsidianCard: '#151c15',
          surface: '#f7f8f3',
          sage: '#d8e6db',
          sageLight: '#eef5ee',
          coral: '#f07153',
          charcoal: '#212a22',
          muted: '#637060',
        },
      },
      boxShadow: {
        'glow-lime': '0 0 25px -5px rgba(212, 255, 50, 0.45)',
        'glow-obsidian': '0 20px 40px -15px rgba(15, 20, 15, 0.35)',
      },
    },
  },
  plugins: [],
};
