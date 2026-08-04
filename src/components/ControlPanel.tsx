import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Droplets, Settings2, Clock3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useControl } from '../hooks/useControl';
import { SensorData } from '../hooks/useSensorData';

interface ControlPanelProps {
  sensorData: SensorData | null;
}

// getAutoControlDetails removed; logic implemented inside component to use runtime refs

export function ControlPanel({ sensorData }: ControlPanelProps) {
  const { sendCommand, loading } = useControl();
  const [activeMode, setActiveMode] = useState<'manual' | 'auto'>('manual');

  useEffect(() => {
    if (sensorData?.device_mode === 'auto' || sensorData?.device_mode === 'manual') {
      setActiveMode(sensorData.device_mode);
    }
  }, [sensorData?.device_mode]);

  const scheduleText = useMemo(() => {
    if (!sensorData?.schedule_enabled) return 'Nonaktif';
    if (!sensorData?.watering_time) return 'Aktif';
    const duration = sensorData.watering_duration != null ? `${sensorData.watering_duration} detik` : 'durasi belum diatur';
    return `Aktif • ${sensorData.watering_time} • ${duration}`;
  }, [sensorData?.schedule_enabled, sensorData?.watering_time, sensorData?.watering_duration]);

  const autoState = sensorData?.auto_state ?? 'unknown';
  const autoReason = sensorData?.auto_reason ?? 'Status otomatis belum tersedia';

  const handleCommand = async (action: string, duration?: number, data?: Record<string, any>) => {
    try {
      await sendCommand(action, duration, data);
      if (action === 'mode_auto') setActiveMode('auto');
      if (action === 'mode_manual') setActiveMode('manual');
    } catch (err) {
      console.error('Command failed:', err);
    }
  };

  // Web no longer issues automatic pump_on/pump_off — Arduino handles `controlPompa()`.

  function ControlButton({
    onClick,
    icon: Icon,
    label,
    variant = 'primary',
    disabled = false,
  }: {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    variant?: 'primary' | 'danger' | 'warning' | 'success';
    disabled?: boolean;
  }) {
    const variants = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
      danger: 'bg-red-500 hover:bg-red-600 shadow-red-200',
      warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
      success: 'bg-slate-700 hover:bg-slate-800 shadow-slate-200',
    } as const;

    return (
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          flex w-full items-center gap-3 rounded-2xl px-5 py-4 font-medium text-white shadow-lg transition-all`}
      >
        <Icon size={20} />
        <span>{label}</span>
        {loading && <motion.div className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      </motion.button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mode Operasi</h3>
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCommand('mode_manual')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeMode === 'manual'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-950 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Manual
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCommand('mode_auto')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeMode === 'auto'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-950 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Otomatis
            </motion.button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border-2 p-4 transition-all ${
            sensorData?.pump_status
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
              : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${
                sensorData?.pump_status ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                <Droplets size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pompa Air</p>
                <p className={`text-lg font-bold ${
                  sensorData?.pump_status ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-300'
                }`}>
                  {sensorData?.pump_status ? 'ON' : 'OFF'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-200 p-3 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <Clock3 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal Penyiraman</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-100">{scheduleText}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-200 p-3 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <Settings2 size={24} />
            </div>
            <div>
              <p className={`text-lg font-bold ${sensorData?.pump_status ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-100'}`}>
                {sensorData?.pump_status ? 'POMPA MENYALA' : 'POMPA MATI'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <Timer className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pompa</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ControlButton
            onClick={() => handleCommand('pump_on')}
            icon={Timer}
            label="Pompa ON"
            variant="success"
            disabled={sensorData?.pump_status === true}
          />
          <ControlButton
            onClick={() => handleCommand('pump_off')}
            icon={Timer}
            label="Pompa OFF"
            variant="danger"
            disabled={sensorData?.pump_status === false}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3 mb-3">
            <Timer className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Pompa Otomatis 10 Detik</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <ControlButton
              onClick={() => handleCommand('pump_10s', 10)}
              icon={Timer}
              label="Jalankan Pompa 10 Detik"
              variant="primary"
              disabled={sensorData?.pump_status === true}
            />
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Saat di set, pompa akan menyala selama 10 detik lalu otomatis mati.
          </p>
        </div>
      </div>
    </div>
  );
}
