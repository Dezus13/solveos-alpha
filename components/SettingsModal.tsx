import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Check,
  Database,
  Download,
  Globe,
  KeyRound,
  Palette,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { concreteLanguageOptions, type UiCopy } from '@/lib/i18n';
import type { ProductSettings } from '@/lib/settings';
import type { ConversationTurn } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProductSettings;
  onSettingsChange: (settings: ProductSettings) => void;
  copy: UiCopy;
  conversations: ConversationTurn[];
  onDeleteHistory: () => void;
}

type TabId = 'general' | 'language' | 'appearance' | 'notifications' | 'data' | 'security';
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
        active ? 'border-[rgba(var(--accent-rgb),0.45)] bg-[rgba(var(--accent-rgb),0.14)] text-white' : 'border-white/10 bg-white/[0.025] text-slate-400 hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  copy,
  conversations,
  onDeleteHistory,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [exported, setExported] = useState(false);

  const navItems = useMemo(() => [
    { id: 'general' as const, label: copy.general, icon: Settings },
    { id: 'language' as const, label: copy.language, icon: Globe },
    { id: 'appearance' as const, label: copy.appearance, icon: Palette },
    { id: 'notifications' as const, label: copy.notifications, icon: Bell },
    { id: 'data' as const, label: copy.data, icon: Database },
    { id: 'security' as const, label: copy.security, icon: Shield },
  ], [copy]);

  const update = (next: DeepPartial<ProductSettings>) => {
    onSettingsChange({
      ...settings,
      ...next,
      general: { ...settings.general, ...next.general },
      language: { ...settings.language, ...next.language },
      appearance: { ...settings.appearance, ...next.appearance },
      notifications: { ...settings.notifications, ...next.notifications },
      data: { ...settings.data, ...next.data },
      security: { ...settings.security, ...next.security },
    });
  };

  const exportConversations = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), conversations }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'solveos-conversations.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 1400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.18 }}
            className="relative flex max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1020]/95 shadow-2xl"
          >
            <aside className="hidden w-56 flex-shrink-0 border-r border-white/10 p-4 sm:block">
              <div className="mb-5 px-2 text-sm font-semibold text-white">{copy.settings}</div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      activeTab === item.id ? 'bg-[rgba(var(--accent-rgb),0.14)] text-white' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            <section className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-white">{navItems.find((item) => item.id === activeTab)?.label}</div>
                  <div className="mt-1 text-sm text-slate-500">Preferences are saved on this device.</div>
                </div>
                <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-white/[0.05] hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto sm:hidden">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs ${activeTab === item.id ? 'bg-[rgba(var(--accent-rgb),0.14)] text-white' : 'bg-white/[0.03] text-slate-500'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {activeTab === 'general' && (
                <div className="space-y-4">
                  <SettingRow title="Auto-save decisions" desc="Keep decision threads in local history.">
                    <Toggle checked={settings.general.autoSave} onChange={(autoSave) => update({ general: { autoSave } })} />
                  </SettingRow>
                  <SettingRow title="Show starter suggestions" desc="Display example prompts on the empty chat screen.">
                    <Toggle checked={settings.general.showSuggestions} onChange={(showSuggestions) => update({ general: { showSuggestions } })} />
                  </SettingRow>
                  <SettingRow title="Open advanced analysis by default" desc="Show the analysis drawer after each decision.">
                    <Toggle checked={settings.general.advancedByDefault} onChange={(advancedByDefault) => update({ general: { advancedByDefault } })} />
                  </SettingRow>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-7">
                  <SettingGroup label="UI Language">
                    {concreteLanguageOptions.map((language) => (
                      <OptionButton
                        key={language.id}
                        active={settings.language.uiLanguage === language.id}
                        onClick={() => update({ language: { uiLanguage: language.id } })}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{language.nativeLabel}</span>
                          {settings.language.uiLanguage === language.id && <Check className="h-4 w-4" />}
                        </span>
                      </OptionButton>
                    ))}
                  </SettingGroup>

                  <SettingGroup label="Decision Language">
                    <OptionButton
                      active={settings.language.decisionMode === 'detected'}
                      onClick={() => update({ language: { decisionMode: 'detected' } })}
                    >
                      Auto-detect from user message
                    </OptionButton>
                    <OptionButton
                      active={settings.language.decisionMode === 'ui'}
                      onClick={() => update({ language: { decisionMode: 'ui' } })}
                    >
                      Always use UI language
                    </OptionButton>
                    <OptionButton
                      active={settings.language.decisionMode === 'custom'}
                      onClick={() => update({ language: { decisionMode: 'custom' } })}
                    >
                      Custom language
                    </OptionButton>
                  </SettingGroup>

                  {settings.language.decisionMode === 'custom' && (
                    <SettingGroup label="Custom Decision Language">
                      {concreteLanguageOptions.map((language) => (
                        <OptionButton
                          key={language.id}
                          active={settings.language.customDecisionLanguage === language.id}
                          onClick={() => update({ language: { customDecisionLanguage: language.id } })}
                        >
                          {language.nativeLabel}
                        </OptionButton>
                      ))}
                    </SettingGroup>
                  )}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  <SettingGroup label="Theme">
                    {(['system', 'dark', 'midnight'] as const).map((theme) => (
                      <OptionButton key={theme} active={settings.appearance.theme === theme} onClick={() => update({ appearance: { theme } })}>{theme}</OptionButton>
                    ))}
                  </SettingGroup>
                  <SettingGroup label="Accent">
                    {(['purple', 'blue', 'emerald', 'rose'] as const).map((accent) => (
                      <OptionButton key={accent} active={settings.appearance.accent === accent} onClick={() => update({ appearance: { accent } })}>
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full accent-swatch-${accent}`} />
                          {accent}
                        </span>
                      </OptionButton>
                    ))}
                  </SettingGroup>
                  <SettingGroup label="Density">
                    {(['compact', 'balanced', 'calm'] as const).map((density) => (
                      <OptionButton key={density} active={settings.appearance.density === density} onClick={() => update({ appearance: { density } })}>{density}</OptionButton>
                    ))}
                  </SettingGroup>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <SettingGroup label="Notification level">
                    {(['none', 'critical', 'all'] as const).map((level) => (
                      <OptionButton key={level} active={settings.notifications.level === level} onClick={() => update({ notifications: { level, enabled: level !== 'none' } })}>{level}</OptionButton>
                    ))}
                  </SettingGroup>
                  <SettingRow title="Review reminders" desc="Notify when 30/60/90 checkpoints are due.">
                    <Toggle checked={settings.notifications.reviewReminders} onChange={(reviewReminders) => update({ notifications: { reviewReminders } })} />
                  </SettingRow>
                  <SettingRow title="Outcome prompts" desc="Prompt for outcome logging after a decision.">
                    <Toggle checked={settings.notifications.outcomePrompts} onChange={(outcomePrompts) => update({ notifications: { outcomePrompts } })} />
                  </SettingRow>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-4">
                  <SettingRow title="Store local history" desc="Keep conversation history on this device.">
                    <Toggle checked={settings.data.storeHistory} onChange={(storeHistory) => update({ data: { storeHistory } })} />
                  </SettingRow>
                  <SettingRow title="Use decision memory" desc="Allow past decisions to inform calibration.">
                    <Toggle checked={settings.data.includeMemory} onChange={(includeMemory) => update({ data: { includeMemory } })} />
                  </SettingRow>
                  <SettingRow title="Private mode" desc="Reduce local retention for new sessions.">
                    <Toggle checked={settings.data.privateMode} onChange={(privateMode) => update({ data: { privateMode } })} />
                  </SettingRow>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" onClick={exportConversations} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.07]">
                      {exported ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {exported ? 'Exported' : 'Export conversations'}
                    </button>
                    <button type="button" onClick={onDeleteHistory} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/[0.1]">
                      <Trash2 className="h-4 w-4" />
                      Delete history
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-5">
                  <SettingRow title="Session lock" desc="Require a fresh session after inactivity.">
                    <Toggle checked={settings.security.sessionLock} onChange={(sessionLock) => update({ security: { sessionLock } })} />
                  </SettingRow>
                  <SettingRow title="Mask API keys" desc="Hide provider credentials in the interface.">
                    <Toggle checked={settings.security.maskApiKeys} onChange={(maskApiKeys) => update({ security: { maskApiKeys } })} />
                  </SettingRow>
                  <SettingGroup label="Model provider">
                    {(['openai', 'anthropic', 'local'] as const).map((provider) => (
                      <OptionButton key={provider} active={settings.security.provider === provider} onClick={() => update({ security: { provider } })}>{provider}</OptionButton>
                    ))}
                  </SettingGroup>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">API key label</span>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <KeyRound className="h-4 w-4 text-slate-500" />
                      <input
                        value={settings.security.apiKeyLabel}
                        onChange={(event) => update({ security: { apiKeyLabel: event.target.value } })}
                        placeholder="Production key"
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </label>
                </div>
              )}
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-300">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
