import { useState, useEffect, useCallback } from 'react';
import { buildApiHeaders } from '../lib/apiAuth';

export interface DailyHistory {
  date: string;
  summary: string;
  metrics: any;
  insights: string;
  recommendations: string;
  messageCount: number;
}

export function useDailyHistory() {
  const [yesterdayHistory, setYesterdayHistory] = useState<DailyHistory | null>(null);
  const [todayHistory, setTodayHistory] = useState<DailyHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ambil history untuk tanggal tertentu
   */
  const fetchHistory = useCallback(async (target: 'yesterday' | 'today' = 'today') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chat-daily-history?target=${target}`, {
        headers: buildApiHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Gagal mengambil riwayat');
        return null;
      }

      const history = result.data as DailyHistory;

      if (target === 'yesterday') {
        setYesterdayHistory(history);
      } else {
        setTodayHistory(history);
      }

      return history;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Simpan atau generate daily history
   */
  const saveHistory = useCallback(async (date?: string, overrideData?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/chat-daily-history', {
        method: 'POST',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ date, overrideData }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Gagal menyimpan riwayat');
        return null;
      }

      return result.data as DailyHistory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update history tertentu
   */
  const updateHistory = useCallback(
    async (date: string, updates: Partial<DailyHistory>) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/chat-daily-history', {
          method: 'PUT',
          headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            date,
            summary_text: updates.summary,
            recommendations: updates.recommendations,
            ai_insights: updates.insights,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Gagal mengupdate riwayat');
          return null;
        }

        return result.data as DailyHistory;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Hapus history tertentu
   */
  const deleteHistory = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chat-daily-history?date=${date}`, {
        method: 'DELETE',
        headers: buildApiHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Gagal menghapus riwayat');
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load yesterday history on mount
   */
  useEffect(() => {
    fetchHistory('yesterday');
  }, [fetchHistory]);

  return {
    yesterdayHistory,
    todayHistory,
    loading,
    error,
    fetchHistory,
    saveHistory,
    updateHistory,
    deleteHistory,
  };
}
