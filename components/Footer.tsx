
import React from 'react';

const Footer: React.FC = () => (
  <footer className="w-full py-20 px-8 border-t border-white/5 bg-slate-950">
    {/* Support Section - Primary Content */}
    <div className="max-w-7xl mx-auto p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-red-500 text-sm">❤️</span>
            </div>
            <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-tighter italic">Support ClipMantra <span className="text-slate-500 text-xs font-bold not-italic tracking-normal">(Voluntary)</span></h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">For Indian Donors (UPI)</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-blue-400 font-mono text-sm md:text-base break-all">arindamsen.1991@oksbi</code>
                <button 
                  onClick={() => navigator.clipboard.writeText('arindamsen.1991@oksbi')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-widest transition-all active:scale-95"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              Thank you for helping keep ClipMantra free & improving! Your voluntary contributions help cover infrastructure and maintain high-speed AI access for everyone.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Outside India / NRIs abroad?</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            You can send easily using these services — enter the UPI ID above + your name:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Wise', url: 'https://wise.com/gb/send-money/send-money-to-india' },
              { name: 'Remitly', url: 'https://www.remitly.com/us/en/india' },
              { name: 'Xoom', url: 'https://www.xoom.com/india/send-money' },
              { name: 'Western Union', url: 'https://www.westernunion.com/us/en/send-money-to-india.html' }
            ].map((service) => (
              <a 
                key={service.name}
                href={service.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group/link"
              >
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{service.name}</span>
                <svg className="w-3 h-3 text-slate-500 group-hover/link:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
