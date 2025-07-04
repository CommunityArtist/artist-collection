/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'deep-bg': '#111327', // Deep Background
        'card-bg': '#1A1F35', // Card Background
        'cosmic-purple': '#7B3FEE', // Cosmic Purple
        'electric-cyan': '#00E5FF', // Electric Cyan
        'soft-lavender': '#E2D7F4', // Soft Lavender
        
        // Supporting Colors
        'neon-pink': '#FF3D8A', // Neon Pink
        'starlight-silver': '#E9ECEF', // Starlight Silver
        'success-green': '#0DCA88', // Success Green
        'alert-orange': '#FF8A48', // Alert Orange
        'error-red': '#F9345E', // Error Red
        
        // Border Color
        'border-color': 'rgba(123, 63, 238, 0.2)', // Border Color
        
        // Text Colors
        'text-secondary': 'rgba(226, 215, 244, 0.7)', // Text Secondary
      },
      boxShadow: {
        'glow': '0 0 20px rgba(123, 63, 238, 0.3)',
        'cyan-glow': '0 0 20px rgba(0, 229, 255, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(45deg, #7B3FEE, #FF3D8A)',
        'cyan-gradient': 'linear-gradient(45deg, #00E5FF, #7B3FEE)',
      },
    },
  },
  plugins: [],
};