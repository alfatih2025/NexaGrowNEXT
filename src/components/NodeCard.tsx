import { Thermometer, Droplets, Activity } from 'lucide-react';
import type { NodeSensorData } from '../hooks/useMultiNodeSensorData';

interface NodeCardProps {
  nodeName: string;
  data: NodeSensorData | null;
  status: 'online' | 'offline';
}

function formatOneDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toFixed(1);
}

export function NodeCard({ nodeName, data, status }: NodeCardProps) {
  const isOnline = status === 'online';

  return (
    <div className="glass-card p-6 flex flex-col relative overflow-hidden group">
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
          <h2 className="text-xl font-bold tracking-tight">{nodeName}</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${isOnline ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10'}`}>
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        {/* Temperature */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Thermometer className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium">Suhu</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{formatOneDecimal(data?.temperature)}</span>
            <span className="text-sm font-semibold text-slate-400">°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Droplets className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium">Kelembapan</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{formatOneDecimal(data?.humidity)}</span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Soil Moisture with Progress Bar */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 relative z-10">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Kelembapan Tanah</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{formatOneDecimal(data?.soil_moisture)}</span>
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(Math.max(data?.soil_moisture || 0, 0), 100)}%` }}
          />
        </div>
      </div>
      
      {/* Last Update */}
      <div className="mt-4 text-right text-xs text-slate-400 dark:text-slate-500 relative z-10">
        {data?.created_at ? `Diperbarui: ${new Date(data.created_at).toLocaleTimeString('id-ID')}` : 'Menunggu data...'}
      </div>
    </div>
  );
}
