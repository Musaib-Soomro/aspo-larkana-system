import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function TopBar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <header className="fixed top-0 left-0 right-0 md:left-60 z-40 h-14 flex items-center px-4 shadow-topbar"
      style={{ background: 'linear-gradient(135deg, #C0121E 0%, #E8192C 50%, #D41525 100%)' }}>

      {/* Mobile hamburger */}
      <button
        className="md:hidden mr-3 p-1.5 rounded-lg hover:bg-black/10 transition-colors focus:outline-none"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* App Identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="hidden sm:block min-w-0">
          <p className="font-display font-semibold text-white text-sm leading-tight tracking-wide truncate">
            {t('appName')}
          </p>
          <p className="text-white/50 text-[10px] leading-tight uppercase tracking-[0.12em]">
            Larkana Sub Division
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase border border-white/25 rounded-md text-white/75 hover:bg-white/12 hover:border-white/45 hover:text-white transition-all"
        >
          {lang === 'en' ? 'اردو' : 'EN'}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/20 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((p) => !p)}
            className="flex items-center gap-2 hover:bg-black/10 px-2 py-1 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[11px] font-extrabold text-white tracking-wide">
              {initials}
            </div>
            <span className="hidden md:inline text-sm text-white/90 font-semibold max-w-32 truncate">
              {user?.full_name}
            </span>
            <svg className="hidden md:block w-3 h-3 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 bg-white dark:bg-dark-card rounded-xl shadow-modal border border-border dark:border-dark-border py-1.5 min-w-44 z-50">
              <div className="px-4 py-2.5 border-b border-border dark:border-dark-border mb-1">
                <p className="text-xs font-bold text-gray-900 dark:text-dark-text truncate">{user?.full_name}</p>
                <p className="text-[10px] text-gray-400 dark:text-dark-muted capitalize font-semibold tracking-wide mt-0.5">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
