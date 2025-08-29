'use client'

import { useTheme } from './ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-4 right-4 z-50
        px-4 py-3 
        rounded-xl 
        transition-all duration-300
        text-sm font-semibold
        shadow-lg hover:shadow-xl
        backdrop-blur-md
        hover:scale-105 active:scale-95
        bg-card border border-brand text-brand
      "
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
