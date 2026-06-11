/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FFFFFF',            // pure white background
          section: '#FFFFFF',       // pure white for cards and containers
          surface: '#E8F5EE',       // light mint-green surface for badges
          green: '#10B981',         // premium mint/emerald green
          'green-deep': '#059669',  // deeper emerald green for contrast
          text: '#1F2E26',          // dark forest-slate for text
          secondary: '#5A7064',     // medium forest-gray text
          dark: '#0A3C22',          // very dark green-forest text for active highlights
          border: '#E5F4EB',        // light mint-green borders
          error: '#EF4444',          // modern red
          success: '#10B981',        // emerald success
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
        pulseSlow: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
