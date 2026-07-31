import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, type PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Monitoring } from './pages/Monitoring';
import { ChatPage } from './pages/ChatPage';
import { ControlPage } from './pages/ControlPage';
import { WeatherPage } from './pages/WeatherPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { useSensorData } from './hooks/useSensorData';
import { useDeviceStatus } from './hooks/useDeviceStatus';


import { useWeather } from './hooks/useWeather';
import { useSettings } from './hooks/useSettings';
import { useAlerts } from './hooks/useAlerts';
import { useMqttStatus } from './hooks/useMqttStatus';
import { getPlantHealthSummary } from './lib/plantPhase';
import { getSensorHistorySnapshot, publishRainChance } from './services/mqtt';
import { recordActivity } from './lib/activityLog';

import './index.css';

function resolvePageFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  switch (normalized) {
    case 'dashboard':
    case 'monitoring':
    case 'chat':
    case 'control':
    case 'weather':
    case 'logs':
    case 'settings':
    case 'about':
      return normalized;
    default:
      return 'dashboard';
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return resolvePageFromPath(window.location.pathname) as PageId;
  });
  const { data: sensorData, history, loading: sensorLoading } = useSensorData(3000);

  const { status: deviceStatus } = useDeviceStatus(5000);

  const { settings, updateSettings } = useSettings();
  const { data: weatherData } = useWeather(settings?.location);
  const { createAlert } = useAlerts();

  const mqttStatus = useMqttStatus();
  const lastAlertSignatureRef = useRef<string>('');

  useEffect(() => {
    const pageName =
      currentPage === 'dashboard'
        ? 'Dashboard'
        : currentPage === 'monitoring'
          ? 'Monitoring'
          : currentPage === 'chat'
            ? 'AI Chat'
            : currentPage === 'control'
              ? 'Control'
              : currentPage === 'weather'
                ? 'Cuaca'
                : currentPage === 'logs'
                  ? 'Log & Analitik'
                  : currentPage === 'settings'
                    ? 'Setting'
                    : 'About';

    recordActivity({
      source: 'navigation',
      type: 'page_view',
      title: `Membuka halaman ${pageName}`,
      message: `Membuka halaman ${pageName}`,
      details: {
        page: currentPage,
        title: pageName,
      },
    });
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = currentPage === 'dashboard' ? '/' : `/${currentPage}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
    }
  }, [currentPage]);

  const liveSensorData = useMemo(() => {
    const live = mqttStatus.sensorSnapshot;
    const fallback = sensorData ?? null;
    if (!fallback && !live) return null;

    return {
      ...(fallback ?? {
        device_id: 'ESP32_001',
        temperature: 0,
        humidity: 0,
        soil_moisture: 0,
        pump_status: false,
        led_status: false,
        device_mode: null,
        wifi_status: 'unknown',
        created_at: new Date().toISOString(),
      }),
      temperature: live?.temperature ?? fallback?.temperature ?? 0,
      humidity: live?.humidity ?? fallback?.humidity ?? 0,
      soil_moisture: live?.soil_moisture ?? fallback?.soil_moisture ?? 0,
      rain: live?.rain ?? fallback?.rain ?? 0,
      score: live?.score ?? fallback?.score ?? 0,
      soil_score: live?.soil_score ?? fallback?.soil_score ?? 0,
      vdp_score: live?.vdp_score ?? fallback?.vdp_score ?? 0,
      rain_score: live?.rain_score ?? fallback?.rain_score ?? 0,
      vpd: live?.vpd ?? fallback?.vpd ?? 0,
      duration_estimate: live?.duration_estimate ?? fallback?.duration_estimate ?? 0,
      pump_status: live?.pump_status ?? fallback?.pump_status ?? false,
      led_status: live?.led_status ?? fallback?.led_status ?? false,
      device_mode: live?.device_mode ?? fallback?.device_mode ?? null,
      wifi_status: live?.wifi_status ?? fallback?.wifi_status ?? 'unknown',
      threshold_kritis: live?.threshold_kritis ?? fallback?.threshold_kritis ?? null,
      threshold_atas: live?.threshold_atas ?? fallback?.threshold_atas ?? null,
      threshold_bawah: live?.threshold_bawah ?? fallback?.threshold_bawah ?? null,
      watering_time: live?.watering_time ?? fallback?.watering_time ?? settings?.watering_time ?? null,
      watering_duration: live?.watering_duration ?? fallback?.watering_duration ?? settings?.watering_duration ?? null,
      schedule_enabled: live?.schedule_enabled ?? fallback?.schedule_enabled ?? settings?.watering_enabled ?? true,
      formula_name: live?.formula_name ?? fallback?.formula_name ?? null,
      formula_soil: live?.formula_soil ?? fallback?.formula_soil ?? null,
      formula_vpd: live?.formula_vpd ?? fallback?.formula_vpd ?? null,
      formula_score: live?.formula_score ?? fallback?.formula_score ?? null,
      soil_raw_dry: live?.soil_raw_dry ?? fallback?.soil_raw_dry ?? null,
      created_at: live?.updatedAt ?? fallback?.created_at ?? new Date().toISOString(),
    };
  }, [sensorData, mqttStatus.sensorSnapshot, settings]);

  const health = useMemo(() => {
    if (!settings) return null;
    return getPlantHealthSummary({
      phase: settings.plant_phase,
      soilMoisture: liveSensorData?.soil_moisture,
      temperature: liveSensorData?.temperature,
      weatherLabel: weatherData?.current.weather,
      rainChance: weatherData?.current.rain_chance,
      soilLow: settings.soil_threshold_low,
      soilHigh: settings.soil_threshold_high,
      soilCritical: settings.soil_threshold_critical,
      tempLow: settings.temp_threshold_low,
      tempHigh: settings.temp_threshold_high,
    });
  }, [settings, liveSensorData, weatherData]);

  useEffect(() => {
    const checkThresholds = async () => {
      if (!liveSensorData || !settings || !health) return;

      const alerts = health.alerts.filter((item) => item.severity !== 'info' || item.type !== 'phase');
      const signature = alerts.map((item) => item.key).join('|');
      if (!signature) {
        lastAlertSignatureRef.current = '';
        return;
      }

      if (signature === lastAlertSignatureRef.current) return;
      lastAlertSignatureRef.current = signature;

      for (const item of alerts) {
        await createAlert(item.type, item.message, item.severity, {
          sendEmail: false,
          recipientEmail: undefined as any,
          metadata: item.metadata,
        });
      }
    };

    checkThresholds();
  }, [liveSensorData, settings, health, createAlert]);

  useEffect(() => {
    const handleSensorFault = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { device, isFault } = customEvent.detail;
      if (isFault) {
        const sensorName = device === 'DHT22' ? 'Suhu & Kelembapan (DHT22)' : 'Kelembapan Tanah (Soil)';
        createAlert(
          'sensor_fault',
          `⚠️ Sensor ${sensorName} tidak terdeteksi atau rusak! Periksa koneksi sensor.`,
          'danger'
        );
      }
    };
    
    window.addEventListener('nexagrow:sensor_fault', handleSensorFault);
    return () => window.removeEventListener('nexagrow:sensor_fault', handleSensorFault);
  }, [createAlert]);

  // ============================================================
  // AUTO-PUBLISH RAIN CHANCE KE ESP32 (setiap 3 jam)
  // ============================================================
  const lastRainPublishRef = useRef<number>(0);
  const RAIN_PUBLISH_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 jam
  const lastRainValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (!weatherData?.current?.rain_chance) return;

    const rainChance = weatherData.current.rain_chance;
    const now = Date.now();
    const lastPublish = lastRainPublishRef.current;
    const lastValue = lastRainValueRef.current;

    // Publish jika: pertama kali, nilai berubah, atau sudah 3 jam
    const shouldPublish =
      lastPublish === 0 ||
      (rainChance !== lastValue) ||
      (now - lastPublish >= RAIN_PUBLISH_INTERVAL_MS);

    if (shouldPublish) {
      lastRainPublishRef.current = now;
      lastRainValueRef.current = rainChance;
      publishRainChance(rainChance).catch(() => {});
    }
  }, [weatherData?.current?.rain_chance]);

  const mqttHistory = useMemo(() => getSensorHistorySnapshot(), [mqttStatus.lastMessageAt, mqttStatus.sensorSnapshot?.updatedAt]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            sensorData={liveSensorData}
            deviceStatus={deviceStatus}
            settings={settings}
            weatherData={weatherData}
            health={health}
          />
        );
      case 'monitoring':
        return <Monitoring history={history} sensorData={liveSensorData} mqttHistory={mqttHistory} />;
      case 'chat':
        return <ChatPage sensorData={liveSensorData} settings={settings} weatherData={weatherData} />;
      case 'control':
        return <ControlPage sensorData={liveSensorData} />;
      case 'weather':
        return <WeatherPage locationCode={settings?.location} settings={settings} updateSettings={updateSettings} />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return (
          <Dashboard
            sensorData={liveSensorData}
            deviceStatus={deviceStatus}
            settings={settings}
            weatherData={weatherData}
            health={health}
          />
        );
    }
  };

  if (sensorLoading && !sensorData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-screen flex-col items-center justify-center text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="mb-6 h-20 w-20 rounded-full border-4 border-emerald-200 border-t-emerald-500"
          />
          <div>
            <h2 className="mb-2 text-2xl font-bold text-emerald-800">NexaGrow</h2>
            <p className="text-emerald-600">Memuat data sensor...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const handlePageChange = (page: PageId) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen text-slate-800">
      <div className="flex min-h-screen">
        <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />

        <div className="flex min-h-screen flex-1 flex-col">
          <Header mqttStatus={mqttStatus} currentPage={currentPage} health={health} />

          <main className="flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
