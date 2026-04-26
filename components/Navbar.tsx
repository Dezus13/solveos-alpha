import React from 'react';
import { Globe, ChevronDown, Settings, Shield } from 'lucide-react';

interface NavbarProps {
  currentLanguage: string;
  onOpenSettings: () => void;
}

export default function Navbar({ currentLanguage, onOpenSettings }: NavbarProps) {

  return (
    <nav className="fixed top-0 left-0 right-0 z-[80] p-6 flex justify-between items-center pointer-events-none">
      <div className="flex items-center space-x-4 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-neutral-900/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
          <Shield className="w-4 h-4 text-purple-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Secure Node</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 pointer-events-auto">
        <div className="relative">
          <button 
            onClick={onOpenSettings}
            className="flex items-center space-x-3 bg-neutral-900/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl hover:bg-white/5 transition-all group"
          >
            <Globe className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
            <span className="text-xs font-bold text-white/90">{currentLanguage === 'auto' ? 'Auto Detect' : currentLanguage}</span>
            <ChevronDown className="w-4 h-4 text-neutral-600 group-hover:text-white transition-all" />
          </button>
        </div>

        <button 
          onClick={onOpenSettings}
          className="w-10 h-10 flex items-center justify-center bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/5 hover:border-purple-500/30 transition-all group"
        >
          <Settings className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 group-hover:rotate-90 transition-all duration-500" />
        </button>
      </div>
    </nav>
  );
}
