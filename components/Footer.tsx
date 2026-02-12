import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Configuration - replace with your actual ID
  const UPI_ID = "arindamsen.1991@oksbi"; 
  const MERCHANT_NAME = "ClipMantra Project";
  const UPI_LINK = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&cu=INR`;
  const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(UPI_LINK)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full py-20 px-6 border-t border-slate-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm relative">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-6 h-6 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 text-white dark:text-slate-900 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] dark:text-white uppercase">
              Clip<span className="text-blue-600">Mantra</span> Engine
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
            A community-first AI project. Built to democratize viral content creation. No subscriptions, just code.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-6">
          <button 
            onClick={() => setShowQRModal(true)}
            className="group relative flex items-center gap-4 bg-slate-950 dark:bg-white text-white dark:text-black px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.15em] text-[10px] transition-all hover:scale-105 active:scale-95 shadow-2xl outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Support Project
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">All Systems Operational</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-20 pt-10 border-t border-slate-50 dark:border-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} ClipMantra. Not affiliated with Google or YouTube.
        </p>
        <div className="flex items-center gap-4">
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-default hover:text-blue-600 transition-colors">Privacy</span>
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-default hover:text-blue-600 transition-colors">Terms</span>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setShowQRModal(false)}
        >
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"></div>
          <div 
            className="relative bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center space-y-8 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Scan to Contribute</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Open any UPI App to Support</p>
            </div>
            
            <div className="aspect-square bg-white p-6 rounded-[2.5rem] shadow-inner border-4 border-slate-50 dark:border-slate-800 relative group overflow-hidden">
              <img 
                src={QR_URL} 
                alt="UPI QR Code" 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <button 
              onClick={handleCopy}
              className={`w-full py-5 rounded-2xl border transition-all text-[9px] font-black uppercase tracking-widest ${
                copied 
                ? 'bg-emerald-500 border-emerald-400 text-white' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600'
              }`}
            >
              {copied ? '✓ ID Copied' : `Copy: ${UPI_ID}`}
            </button>

            <button 
              onClick={() => setShowQRModal(false)}
              className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;