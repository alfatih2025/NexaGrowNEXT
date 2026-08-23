import { Calendar, TrendingUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DailyHistory } from '../hooks/useDailyHistory';

interface DailyHistorySummaryProps {
  history: DailyHistory | null;
  isLoading?: boolean;
}

export function DailyHistorySummary({ history, isLoading = false }: DailyHistorySummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!history) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">Belum ada riwayat dari hari sebelumnya</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-200 pb-3 dark:border-amber-500/30">
        <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Riwayat Kemarin</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">{history.date}</p>
        </div>
      </div>

      {/* Metrics Summary */}
      {history.metrics && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">📊 Kondisi Perangkat</h5>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MetricCard
              label="Suhu"
              value={`${history.metrics.temperature?.min}°C`}
              unit={`max ${history.metrics.temperature?.max}°C`}
              icon="🌡️"
            />
            <MetricCard
              label="Kelembapan"
              value={`${history.metrics.humidity?.min}%`}
              unit={`max ${history.metrics.humidity?.max}%`}
              icon="💧"
            />
            <MetricCard
              label="Tanah"
              value={`${history.metrics.soil_moisture?.min}%`}
              unit={`max ${history.metrics.soil_moisture?.max}%`}
              icon="🌱"
            />
            <MetricCard
              label="Pesan"
              value={history.messageCount.toString()}
              unit="total"
              icon="💬"
            />
          </div>
        </div>
      )}

      {/* Insights */}
      {history.insights && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Analisis AI Kemarin</h5>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {history.insights.length > 300 ? `${history.insights.substring(0, 300)}...` : history.insights}
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {history.recommendations && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Saran untuk Hari Ini</h5>
          </div>
          <div className="space-y-1 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-500/30 dark:bg-green-500/10">
            {history.recommendations.split('\n').map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {rec.trim().startsWith('1.') || rec.trim().startsWith('2.') || rec.trim().startsWith('3.') || rec.trim().startsWith('4.') ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{rec.replace(/^\d\.\s/, '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Text */}
      {history.summary && (
        <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {history.summary}
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  icon: string;
}

function MetricCard({ label, value, unit, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-2xl">{icon}</div>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-500">{unit}</p>
    </div>
  );
}
