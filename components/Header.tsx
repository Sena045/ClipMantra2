
import React from 'react';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-blue-500/20">
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span className="text-sm font-black tracking-widest dark:text-white uppercase">
              Clip <span className="text-blue-600">Pro</span>
            </span>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
          >
            {darkMode ? (
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 18v1m9-9h1M4 9h1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="h-4 w-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
