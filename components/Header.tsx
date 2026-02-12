import React from 'react';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="w-full py-6 px-10 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur-xl fixed top-0 z-[100]">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 gradient-blue rounded-2xl shadow-xl flex items-center justify-center border border-white/10">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" /></svg>
        </div>
        <span className="font-extrabold text-2xl tracking-tighter text-white">
          ClipMantra<span className="text-blue-500 opacity-80">.</span>
        </span>
      </div>
      
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-8">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white cursor-pointer transition-colors mono">Engine</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white cursor-pointer transition-colors mono">Archive</span>
        </nav>
        <button
          onClick={toggleDarkMode}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
          aria-label="Toggle Theme"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        </button>
      </div>
    </header>
  );
};

export default Header;