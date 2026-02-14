
import React from 'react';

const Header: React.FC = () => (
  <header className="w-full py-6 px-8 flex justify-between items-center border-b border-white/5 bg-slate-950/80 backdrop-blur-xl fixed top-0 z-[100]">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center border border-white/10">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-2xl tracking-tighter text-white uppercase italic leading-none">
          ClipMantra<span className="text-blue-500">.</span>
        </span>
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1 ml-0.5">Free Edition</span>
      </div>
    </div>
    <div className="hidden md:flex items-center gap-6">
      <nav className="flex items-center gap-8 mr-8">
        <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Zero-Cost Workflow</a>
        <a href="https://github.com" target="_blank" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Open Source</a>
      </nav>
      <div className="px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mono">Engine v21.0-F</span>
      </div>
    </div>
  </header>
);

export default Header;
