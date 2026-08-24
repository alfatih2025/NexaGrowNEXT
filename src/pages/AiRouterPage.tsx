import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Bot, Settings2, Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useSettings, Settings as SettingsType } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { recordActivity } from '../lib/activityLog';

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'groq', name: 'Groq' },
  { id: 'none', name: 'Tidak ada (None)' }
];

const MODELS: Record<string, string[]> = {
  gemini: ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  openrouter: ['qwen/qwen-2.5-72b-instruct', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  none: ['-']
};

const STRATEGIES = [
  { id: 'priority', name: 'Priority (Sesuai Urutan)' },
  { id: 'fastest', name: 'Fastest (Tercepat)' },
  { id: 'cheapest', name: 'Cheapest (Termurah)' },
  { id: 'best_quality', name: 'Best Quality (Kualitas Terbaik)' },
  { id: 'automatic', name: 'Automatic (Otomatis)' },
];

export function AiRouterPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { settings, loading, updateSettings } = useSettings();

  const [formData, setFormData] = useState<Partial<SettingsType>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (settings && !isDirty) {
      setFormData(settings);
    }
  }, [settings, isDirty]);

  const updateField = (field: keyof SettingsType, value: unknown) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProviderChange = (field: keyof SettingsType, modelField: keyof SettingsType, value: string) => {
    setIsDirty(true);
    setFormData((prev) => ({ 
      ...prev, 
      [field]: value,
      [modelField]: MODELS[value]?.[0] || '-'
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaveStatus('saving');
    
    try {
      await updateSettings(formData);
      recordActivity({
        source: 'settings',
        type: 'ai_router_updated',
        title: 'Konfigurasi AI Router diubah',
        message: `Mode AI diubah menjadi ${formData.ai_mode === 'expert' ? 'Expert' : 'Default'}.`,
        details: { mode: formData.ai_mode, provider: formData.ai_primary_provider }
      });
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('idle');
    }
  };

  if (loading && !settings) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Memuat konfigurasi AI...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p>Halaman ini hanya dapat diakses oleh Administrator.</p>
      </div>
    );
  }

  const isExpert = formData.ai_mode === 'expert';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Network className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Router</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Orkestrasi dan konfigurasi provider AI</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={!isDirty || saveStatus === 'saving'} 
          className={`rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors ${isDirty ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"}`} 
        >
          {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'saved' ? 'Tersimpan ✓' : 'Simpan Konfigurasi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 cursor-pointer" onClick={() => updateField('ai_mode', 'default')}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border-2 transition-colors ${!isExpert ? 'bg-purple-50 border-purple-500 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400 dark:bg-slate-800'}`}>
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${!isExpert ? 'text-purple-900 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>Mode Normal (Default)</h3>
              <p className="text-sm text-slate-500 mt-1">
                Semua pengguna langsung mendapat jawaban. Sistem secara otomatis mengatur provider dan routing tanpa intervensi.
              </p>
            </div>
            {!isExpert && <CheckCircle2 className="h-6 w-6 text-purple-500 ml-auto" />}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 cursor-pointer" onClick={() => updateField('ai_mode', 'expert')}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border-2 transition-colors ${isExpert ? 'bg-purple-50 border-purple-500 text-purple-600' : 'bg-slate-50 border-transparent text-slate-400 dark:bg-slate-800'}`}>
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isExpert ? 'text-purple-900 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>Mode Expert</h3>
              <p className="text-sm text-slate-500 mt-1">
                Menu khusus untuk mengonfigurasi provider primer, fallback, dan model LLM secara manual.
              </p>
            </div>
            {isExpert && <CheckCircle2 className="h-6 w-6 text-purple-500 ml-auto" />}
          </div>
        </motion.div>
      </div>

      {isExpert && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-500" />
              Routing Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                  <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-300 mb-3">Primary Provider</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Provider</label>
                      <select 
                        value={formData.ai_primary_provider || 'gemini'} 
                        onChange={(e) => handleProviderChange('ai_primary_provider', 'ai_primary_model', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                      >
                        {PROVIDERS.filter(p => p.id !== 'none').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Model</label>
                      <select 
                        value={formData.ai_primary_model || ''} 
                        onChange={(e) => updateField('ai_primary_model', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                      >
                        {MODELS[formData.ai_primary_provider as string || 'gemini']?.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Fallback #1</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Provider</label>
                      <select 
                        value={formData.ai_fallback_1_provider || 'openrouter'} 
                        onChange={(e) => handleProviderChange('ai_fallback_1_provider', 'ai_fallback_1_model', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                      >
                        {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {formData.ai_fallback_1_provider !== 'none' && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Model</label>
                        <select 
                          value={formData.ai_fallback_1_model || ''} 
                          onChange={(e) => updateField('ai_fallback_1_model', e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                        >
                          {MODELS[formData.ai_fallback_1_provider as string || 'openrouter']?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Fallback #2</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Provider</label>
                      <select 
                        value={formData.ai_fallback_2_provider || 'groq'} 
                        onChange={(e) => handleProviderChange('ai_fallback_2_provider', 'ai_fallback_2_model', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                      >
                        {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {formData.ai_fallback_2_provider !== 'none' && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Model</label>
                        <select 
                          value={formData.ai_fallback_2_model || ''} 
                          onChange={(e) => updateField('ai_fallback_2_model', e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm"
                        >
                          {MODELS[formData.ai_fallback_2_provider as string || 'groq']?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Sliders className="h-4 w-4" /> Routing Strategy
                  </h4>
                  <div className="space-y-2">
                    {STRATEGIES.map(strategy => (
                      <label key={strategy.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <input 
                          type="radio" 
                          name="ai_strategy" 
                          value={strategy.id}
                          checked={formData.ai_strategy === strategy.id}
                          onChange={(e) => updateField('ai_strategy', e.target.value)}
                          className="text-purple-600 focus:ring-purple-500 h-4 w-4" 
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{strategy.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-4">AI Parameters</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-500">Temperature</label>
                        <span className="text-xs font-semibold">{formData.ai_temperature}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="2" step="0.1" 
                        value={formData.ai_temperature || 0} 
                        onChange={(e) => updateField('ai_temperature', parseFloat(e.target.value))}
                        className="w-full accent-purple-600" 
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-slate-500">Max Tokens</label>
                        <span className="text-xs font-semibold">{formData.ai_max_tokens}</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" max="4000" step="100" 
                        value={formData.ai_max_tokens || 600} 
                        onChange={(e) => updateField('ai_max_tokens', parseInt(e.target.value))}
                        className="w-full accent-purple-600" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
