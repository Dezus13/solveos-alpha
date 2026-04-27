import React from 'react';
import { Settings } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  isLoading?: boolean;
}

export default function Navbar({ onOpenSettings, isLoading }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[80] p-6 flex justify-between items-center pointer-events-none">
      {/* Left: System Identity */}
      <div className="flex items-center space-x-6 pointer-events-auto">
        <div className="flex items-center space-x-3 bg-[#0B1020]/72 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
           <span className="text-[10px] font-black uppercase text-slate-300">Alpha Decision OS</span>
           <div className="w-[1px] h-3 bg-white/10" />
           <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.9)]' : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'}`} />
              <span className="text-[9px] font-black uppercase text-slate-400">
                System Status <span className="text-slate-600">•</span> {isLoading ? 'Processing' : 'Live'}
              </span>
           </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-3 pointer-events-auto">
        <button 
          onClick={onOpenSettings}
          className="w-10 h-10 flex items-center justify-center bg-[#0B1020]/72 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/5 transition-all group"
        >
          <Settings className="w-4 h-4 text-slate-400 group-hover:text-[#F8FAFF] transition-all duration-700" />
        </button>
      </div>
    </nav>
  );
}
