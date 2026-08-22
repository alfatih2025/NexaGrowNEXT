import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ChevronRight, Activity, Cpu, Bot, Route, Zap, Droplets, ThermometerSun, Leaf } from 'lucide-react';
import type { SensorData } from '../hooks/useSensorData';

interface AiDecision {
  decision: string;
  confidence: number;
  recommendations: Array<{ label: string; value: string; icon?: any }>;
  analysis: string[];
  provider: string;
  model: string;
  reason: string;
  fallbackStatus: Record<string, string>;
  timeline: Array<{ time: string; label: string; status: 'done' | 'active' | 'pending' }>;
}

export function AiAnalysisView({ data, sensorData }: { data: AiDecision | null, sensorData: SensorData | null }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none">
          <Cpu className="w-64 h-64 text-green-500" />
        </div>
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <ShieldCheck className="w-7 h-7 text-green-400" />
          <h2 className="text-2xl font-bold tracking-tight">AI Analysis & Routing</h2>
          <div className="ml-auto flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-medium text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Decision Made
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Input Sensor
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                  <span className="text-slate-300 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /> Soil Moisture</span>
                  <span className="font-semibold">{sensorData?.soil_moisture ?? '-'}%</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                  <span className="text-slate-300 flex items-center gap-2"><ThermometerSun className="w-4 h-4 text-orange-400" /> Temperature</span>
                  <span className="font-semibold">{sensorData?.temperature ?? '-'}°C</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2">
                  <span className="text-slate-300 flex items-center gap-2"><Leaf className="w-4 h-4 text-green-400" /> Humidity</span>
                  <span className="font-semibold">{sensorData?.humidity ?? '-'}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4 flex items-center gap-2">
                <Route className="w-4 h-4 text-purple-400" /> AI Router
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-500">Provider</span>
                  <div className="text-sm font-semibold flex items-center justify-between">
                    {data.provider}
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500">Model</span>
                  <div className="text-sm font-medium text-slate-300">{data.model}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500">Reason</span>
                  <div className="text-xs text-slate-400 italic">{data.reason}</div>
                </div>
                
                {Object.keys(data.fallbackStatus).length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-500 mb-2 block">Fallback Status</span>
                    {Object.entries(data.fallbackStatus).map(([provider, status]) => (
                      <div key={provider} className="flex justify-between items-center text-xs text-slate-400 mb-1">
                        <span>{provider}</span>
                        <span className={status === 'Ready' ? 'text-green-500' : 'text-slate-500'}>{status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-slate-700/50">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-green-400 font-semibold mb-2">Final Decision</h3>
                  <div className="text-xl md:text-2xl font-bold text-white">{data.decision}</div>
                </div>
                <div className="text-right">
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Confidence</h3>
                  <div className="text-3xl font-bold text-green-400">{data.confidence}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Analysis</h3>
                  <ul className="space-y-3">
                    {data.analysis.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-4">Recommendation</h3>
                  <div className="space-y-3">
                    {data.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center gap-3">
                        {rec.icon ? <rec.icon className="w-5 h-5 text-blue-400" /> : <Zap className="w-5 h-5 text-blue-400" />}
                        <div>
                          <div className="text-[10px] uppercase text-slate-400">{rec.label}</div>
                          <div className="text-sm font-semibold">{rec.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/30">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-slate-400" /> Decision Timeline
              </h3>
              <div className="flex flex-col space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {data.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-slate-900 ${step.status === 'done' ? 'bg-green-500' : step.status === 'active' ? 'bg-blue-500' : 'bg-slate-700'} text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                      {step.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {step.status === 'active' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl bg-slate-800/80 border border-slate-700 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-medium ${step.status === 'active' ? 'text-blue-400' : 'text-slate-400'}`}>{step.time}</span>
                      </div>
                      <div className={`text-sm ${step.status === 'pending' ? 'text-slate-500' : 'text-slate-200'}`}>{step.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
