/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8192C',
          light: '#FF3347',
          dark: '#C0121E',
          subtle: '#FEF2F3',
        },
        sidebar: {
          DEFAULT: '#100810',
          hover: '#1E1020',
          active: '#E8192C',
          border: '#2A1230',
        },
        dark: {
          surface: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        gold: {
          DEFAULT: '#B8872A',
          light: '#D4A84B',
          subtle: '#FBF4E6',
        },
        alert: '#D97706',
        danger: '#DC2626',
        success: '#067034',
        surface: '#F8F5F1',
        border: '#E0D4C8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        urdu: ['"Jameel Noori Nastaleeq"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(28, 10, 10, 0.05), 0 4px 16px rgba(28, 10, 10, 0.06)',
        'card-hover': '0 4px 8px rgba(28, 10, 10, 0.07), 0 8px 28px rgba(28, 10, 10, 0.10)',
        'topbar': '0 2px 12px rgba(20, 4, 4, 0.25)',
        'sidebar': '4px 0 24px rgba(0, 0, 0, 0.35)',
        'modal': '0 8px 40px rgba(28, 10, 10, 0.18)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
