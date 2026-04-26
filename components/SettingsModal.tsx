import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Globe, Palette, Bell, 
  Database, Shield, ChevronRight,
  Monitor, Languages, MessageSquare, Zap, Clock
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  locales: Record<string, Record<string, string>>;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentLanguage, 
  onLanguageChange,
  locales
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const t = locales[currentLanguage === 'auto' ? 'English' : currentLanguage] || locales.English;

  const handleLanguageSelect = (lang: string) => {
    setIsConfiguring(true);
    setTimeout(() => {
      onLanguageChange(lang);
      setIsConfiguring(false);
    }, 800); // Faster, more professional transition
  };

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'localization', label: 'Language', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[80vh] bg-neutral-900/50 border border-white/10 rounded-[32px] overflow-hidden flex shadow-2xl"
          >
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-black/20 p-6 flex flex-col">
              <div className="flex items-center space-x-3 mb-10 px-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-white">{t.settings || 'Settings'}</span>
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === item.id 
                        ? 'bg-white/10 text-white border border-white/10' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center space-x-3 px-4 py-2 opacity-40">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">System Ready</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 bg-neutral-900/20">
              <div className="flex justify-between items-start mb-10">
                <h2 className="text-3xl font-bold tracking-tighter text-white">
                  {navItems.find(i => i.id === activeTab)?.label}
                </h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {activeTab === 'localization' ? (
                <div className="space-y-8 max-w-2xl">
                   <div className="glass-module rounded-[32px] p-8 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-1">Primary Config</h4>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Interface & Simulation Language</p>
                        </div>
                        <div className="flex items-center space-x-2">
                           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-telemetry" />
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <button 
                          onClick={() => handleLanguageSelect('auto')}
                          className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 ${
                            currentLanguage === 'auto' 
                              ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]' 
                              : 'bg-black/40 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center space-x-5">
                            <div className={`p-3 rounded-xl ${currentLanguage === 'auto' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                               <Monitor className={`w-5 h-5 ${currentLanguage === 'auto' ? 'text-purple-400' : 'text-neutral-500'}`} />
                            </div>
                            <div className="text-left">
                               <p className="text-sm font-black text-white uppercase tracking-wider">Auto Detect</p>
                               <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight">Adaptive Neural Detection (Recommended)</p>
                            </div>
                          </div>
                          {currentLanguage === 'auto' && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />}
                        </button>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                           {[
                             { id: 'English', label: 'English' },
                             { id: 'Russian', label: 'Русский' },
                             { id: 'German', label: 'Deutsch' },
                             { id: 'Spanish', label: 'Español' },
                             { id: 'Arabic', label: 'العربية' },
                             { id: 'Chinese', label: '中文' }
                           ].map((lang) => (
                             <button 
                               key={lang.id}
                               onClick={() => handleLanguageSelect(lang.id)}
                               className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                                 currentLanguage === lang.id 
                                   ? 'bg-purple-500/10 border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.05)]' 
                                   : 'bg-black/40 border-white/5 hover:border-white/10 text-neutral-500 hover:text-neutral-300'
                               }`}
                             >
                               <span className="text-xs font-black uppercase tracking-widest">{lang.label}</span>
                               {currentLanguage === lang.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />}
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600 px-2">System Overrides</h4>
                      <div className="grid grid-cols-1 gap-3">
                         {[
                           { label: 'Interface Language', icon: Languages, status: 'Default' },
                           { label: 'Reasoning Engine', icon: MessageSquare, status: 'Native' },
                           { label: 'Auto Translation', icon: Zap, toggle: true, status: 'Active' },
                           { label: 'Regional Format', icon: Clock, status: 'UTC-0' }
                         ].map((opt, i) => (
                           <div key={i} className="flex items-center justify-between p-6 glass-module rounded-[24px] group transition-all">
                              <div className="flex items-center space-x-5">
                                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                                   <opt.icon className="w-5 h-5 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                                </div>
                                <div>
                                   <p className="text-xs font-black text-neutral-300 uppercase tracking-widest">{opt.label}</p>
                                   <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-tight">System {opt.status}</p>
                                </div>
                              </div>
                              {opt.toggle ? (
                                <div className="w-10 h-5 bg-purple-500 rounded-full relative p-1 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                   <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                </div>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-neutral-800 group-hover:text-neutral-500 transition-all" />
                              )}
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-6 px-4 border-t border-white/5">
                      <div className="flex items-center space-x-3 opacity-40 italic">
                         <Shield className="w-3 h-3 text-neutral-500" />
                         <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                           End-to-End Decision Encryption Active
                         </p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                   {[
                     { title: 'Appearance', desc: 'System-wide visual architecture', status: 'Dark Luxury' },
                     { title: 'Accent Color', desc: 'Decision core illumination color', status: 'Purple' },
                     { title: 'Notifications', desc: 'Critical alert telemetry settings', status: 'Critical Only' },
                     { title: 'Voice', desc: 'Neural synthesis and recognition', status: 'Disabled' },
                     { title: 'Data Controls', desc: 'Advanced simulation history & logs', status: 'Encrypted' },
                     { title: 'Security', desc: 'Identity verification & access', status: 'Biometric' }
                   ].map((item, i) => (
                     <div key={i} className="glass-module rounded-[32px] p-8 group transition-all cursor-pointer border border-white/5 hover:border-purple-500/20">
                        <div className="flex justify-between items-start mb-8">
                           <div className="w-14 h-14 rounded-[20px] bg-black/40 border border-white/5 flex items-center justify-center group-hover:border-purple-500/40 transition-all shadow-inner">
                              <Zap className="w-6 h-6 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                           </div>
                           <div className="flex flex-col items-end">
                              <div className="w-1 h-1 rounded-full bg-purple-500 animate-telemetry mb-2" />
                              <span className="text-[8px] font-black text-neutral-700 uppercase tracking-[0.2em]">{item.status}</span>
                           </div>
                        </div>
                        <h3 className="text-sm font-black text-white mb-2 uppercase tracking-[0.2em]">{item.title}</h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight leading-relaxed">
                          {item.desc}
                        </p>
                        <div className="mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Modify Module</span>
                           <ChevronRight className="w-4 h-4 text-purple-500" />
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Config Animation Overlay */}
            <AnimatePresence>
               {isConfiguring && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center"
                 >
                    <div className="w-8 h-8 border border-white/10 border-t-purple-500 rounded-full animate-spin mb-6" />
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] font-black uppercase tracking-[0.5em] text-neutral-500"
                    >
                      Applying System Configuration
                    </motion.p>
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
