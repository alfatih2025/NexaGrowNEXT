import { useState, useEffect, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { SensorChart } from '../components/SensorChart';
import type { NodeSensorData } from '../hooks/useMultiNodeSensorData';

export function Monitoring() {
  const [activeNode, setActiveNode] = useState<number>(1);
  const [history, setHistory] = useState<NodeSensorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (nodeId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://192.168.40.17:8000/api/sensor-data?node_id=${nodeId}&limit=60`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(activeNode);
    const interval = setInterval(() => fetchHistory(activeNode), 30000);
    return () => clearInterval(interval);
  }, [activeNode]);

  const latest = history.length > 0 ? history[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-emerald-600 dark:text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Monitoring Real-time</h2>
          </div>
        </div>

        {/* Node Toggle */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setActiveNode(1)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeNode === 1
                ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-950 dark:text-cyan-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Node 1
          </button>
          <button
            onClick={() => setActiveNode(2)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeNode === 2
                ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-950 dark:text-cyan-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Node 2
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <SensorChart data={history} type="temperature" title="Tren Suhu" color="#10b981" />
        <SensorChart data={history} type="humidity" title="Tren Kelembapan" color="#0ea5e9" />
        <SensorChart data={history} type="soil_moisture" title="Tren Kelembapan Tanah" color="#f59e0b" />
      </div>

      {/* Tabel Data History */}
      <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Riwayat Data (Node {activeNode})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Waktu</th>
                <th className="px-6 py-3 font-medium">Suhu (°C)</th>
                <th className="px-6 py-3 font-medium">Kelembapan (%)</th>
                <th className="px-6 py-3 font-medium">Suhu Tanah (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/50">
              {loading && history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada data sensor untuk node ini
                  </td>
                </tr>
              ) : (
                history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {new Date(row.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {row.temperature?.toFixed(1) || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {row.humidity?.toFixed(1) || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {row.soil_moisture?.toFixed(1) || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
