module.exports = {
  content: ['./**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#22D3EE',
        dark: '#0F172A',
        'text-primary': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
   plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
