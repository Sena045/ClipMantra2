import React from 'react';

const Footer: React.FC = () => {
  const upiId = "arindamsen.1991@oksbi";
  const upiName = "ClipMantraPro";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`)}`;

  return (
    <footer className="w-full pt-32 pb-12 px-8 border-t border-white/5 bg-slate-950 relative overflow-hidden">
      <div className="max-w-md mx-auto mb-32 p-1 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-[3.5rem]">
        <div className="glass-card rounded-[3.4rem] p-12 flex flex-col items-center text-center space-y-8 border-none">
          <div className="space-y-3">
            <div className="inline-block px-4 py-1 bg-blue-500/10 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 mono">
              Community Access
            </div>
            <h4 className="text-3xl font-black text-white tracking-tighter uppercase leading-[0.9]">
              Fuel the <br /> <span className="text-blue-500">Free AI</span> Engine
            </h4>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-6 bg-blue-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative p-5 bg-white rounded-[2rem] shadow-2xl border border-white/10">
              <img 
                src={qrUrl} 
                alt="Support QR"
                className="w-44 h-44 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mono">Direct Node Funding</p>
            <p className="text-sm font-mono font-bold text-blue-400">{upiId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 opacity-30 pt-12 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 gradient-blue rounded-lg"></div>
            <span className="font-black text-sm text-white uppercase tracking-tighter">ClipMantra</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mono text-center">
            &copy; {new Date().getFullYear()} PROMETHEUS PROTOCOL • NODAL AI v3.0
          </p>
          <div className="flex gap-10">
            <span className="text-[10px] font-black uppercase text-slate-400 hover:text-white cursor-pointer transition-colors mono">Logs</span>
            <span className="text-[10px] font-black uppercase text-slate-400 hover:text-white cursor-pointer transition-colors mono">API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;