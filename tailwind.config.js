/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        idayal: {
          green: '#5DCAA5',
          orange: '#EF9F27',
          blue: '#4A90D9',
          bg: '#F8F9FA',
          'bg-dark': '#1A1A2E',
          text: '#2D3436',
          'text-secondary': '#636E72',
        },
      },
      borderRadius: {
        row: '12px',
        bar: '20px',
        phone: '28px',
      },
      maxWidth: {
        phone: '430px',
      },
      keyframes: {
        slideInUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(120%)', opacity: '0' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-up': 'slideInUp 0.25s ease-out',
        'slide-out-right': 'slideOutRight 0.25s ease-in forwards',
        'check-pop': 'checkPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
