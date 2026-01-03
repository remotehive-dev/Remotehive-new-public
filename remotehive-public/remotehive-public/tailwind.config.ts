export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neu: {
          base: '#FFFFFF', // White base for components
          'base-glass': 'rgba(255, 255, 255, 0.6)', // Glassy background
          accent: '#A0F1EA', // Pastel Cyan
          'accent-hover': '#EAD6EE', // Pastel Purple hover
          text: '#333333', // Dark Gray text
        }
      },
      boxShadow: {
        // Deep Blue (#0D2750) tinted shadows for "Magic Color" effect
        'neu-flat': '8px 8px 16px rgba(13, 39, 80, 0.16), -8px -8px 16px rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 6px 6px 12px rgba(13, 39, 80, 0.16), inset -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neu-button': '6px 6px 12px rgba(13, 39, 80, 0.16), -6px -6px 12px rgba(255, 255, 255, 0.9)',
        'neu-button-active': 'inset 4px 4px 8px rgba(13, 39, 80, 0.16), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'neu-icon': '4px 4px 8px rgba(13, 39, 80, 0.12), -4px -4px 8px rgba(255, 255, 255, 0.8)',
        'neu-glow': '0 0 15px rgba(160, 241, 234, 0.5), 0 0 30px rgba(234, 214, 238, 0.3)', // Glow for magic borders
      },
      borderRadius: {
        'neu': '1rem',
      }
    }
  },
  plugins: []
};

