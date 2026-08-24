import { buildApiHeaders } from '../lib/apiAuth';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SensorSnapshotContext } from '../services/openrouter';
import type { DailyHistory } from './useDailyHistory';

export interface ChatMessage {
  id: number;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const STORAGE_KEY = 'nexaGrow-chat-messages';

function readLocalMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    user_id: role === 'user' ? 'user_001' : 'assistant_001',
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

async function fetchApiMessages(): Promise<ChatMessage[]> {
  const response = await fetch('/api/chat', { headers: buildApiHeaders() });
  if (!response.ok) {
    throw new Error(`Chat API tidak merespons (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Format riwayat chat dari API tidak valid.');
  }
  return data;
}

function normalizeSensorContext(sensorContext?: Partial<SensorSnapshotContext> | null) {
  if (!sensorContext || typeof sensorContext !== 'object') return null;
  return sensorContext;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [yesterdayHistory, setYesterdayHistory] = useState<DailyHistory | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    state: 'checking',
    label: 'Memeriksa AI Router',
    detail: 'Menghubungkan chatbot ke sistem...',
  });

  // Track initialization untuk prevent multiple fetches
  const isInitializedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const persistMessages = useCallback((nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMessages));
    }
  }, []);

  const refreshConnectionStatus = useCallback(async () => {
    setConnectionStatus({
      state: 'checking',
      label: 'Memeriksa AI Router',
      detail: 'Menghubungkan chatbot ke sistem...',
    });
    try {
      const res = await fetch('/api/airouter', { headers: buildApiHeaders() });
      if (res.ok) {
        setConnectionStatus({ state: 'connected', label: 'AI Router Aktif', detail: 'Sistem siap.' });
      } else {
        setConnectionStatus({ state: 'error', label: 'AI Router Error', detail: 'Periksa API Keys' });
      }
    } catch {
      setConnectionStatus({ state: 'error', label: 'AI Router Offline', detail: 'Gagal menghubungi server' });
    }
  }, []);

  /**
   * Load yesterday's history untuk konteks AI
   */
  const loadYesterdayHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/chat-daily-history?target=yesterday', {
        headers: buildApiHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        setYesterdayHistory(result.data as DailyHistory);
      }
    } catch (err) {
      // Silently fail - history tidak wajib
      console.warn('Failed to load yesterday history:', err);
    }
  }, []);

  /**
   * Initialize hook - hanya sekali saat mount
   * Gunakan useRef untuk track initialization state
   */
  useEffect(() => {
    // Jangan jalankan initialization dua kali
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Step 1: Load dari localStorage terlebih dahulu
    const localMessages = readLocalMessages();
    if (localMessages.length > 0) {
      persistMessages(localMessages);
    }

    // Step 2: Coba sync dengan API (tapi jangan overwrite local jika API kosong)
    fetchMessages();

    // Step 3: Check connection status
    refreshConnectionStatus();

    // Step 4: Load yesterday history untuk AI context
    loadYesterdayHistory();
  }, []); // Empty dependency array - hanya jalankan sekali saat mount
    persistMessages([]);
    setAnalysisData(null);
    try {
      await fetch('/api/chat', {
        method: 'DELETE',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
      });
    } catch {
      // Ignore errors for remote clear
    }
  }, [persistMessages]);

  const fetchMessages = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const apiMessages = await fetchApiMessages();
      // Prioritas: API messages jika ada, fallback ke localStorage
      if (apiMessages && apiMessages.length > 0) {
        persistMessages(apiMessages);
      } else {
        // Jika API kosong, gunakan localStorage
        const localMessages = readLocalMessages();
        if (localMessages.length > 0) {
          persistMessages(localMessages);
        }
      }
      setError(null);
    } catch (err) {
      // Jika API error, fallback ke localStorage
      const localMessages = readLocalMessages();
      persistMessages(localMessages);
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil riwayat chat';
      // Jangan set error jika localStorage ada
      if (localMessages.length === 0) {
        setError(errorMsg);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [persistMessages]);

  const sendMessage = useCallback(
    async (message: string, sensorContext?: Partial<SensorSnapshotContext> | null, settings?: any) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      setLoading(true);
      setError(null);

      const userMessage = createMessage('user', trimmedMessage);
      const optimisticMessages = [...messages, userMessage];
      persistMessages(optimisticMessages);

      try {
        const response = await fetch('/api/airouter', {
          method: 'POST',
          headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            message: trimmedMessage,
            history: optimisticMessages.map(m => ({ role: m.role, content: m.content })),
            sensorContext: normalizeSensorContext(sensorContext),
            aiSettings: settings,
            yesterdayHistory: yesterdayHistory ? {
              summary: yesterdayHistory.summary,
              insights: yesterdayHistory.insights,
              recommendations: yesterdayHistory.recommendations,
            } : null,
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gagal menghubungi AI Router');

        const assistantMessage = createMessage('assistant', data.content || 'Maaf, jawaban kosong.');
        persistMessages([...optimisticMessages, assistantMessage]);
        
        if (data.analysis) {
          setAnalysisData(data.analysis);
        }

        setConnectionStatus({
          state: 'connected',
          label: 'AI Router Aktif',
          detail: `Respons diterima via ${data.provider} (${data.model})`,
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Unknown chat error';
        setError(detail);
        setConnectionStatus({
          state: 'error',
          label: 'AI Router Error',
          detail,
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, persistMessages, yesterdayHistory],
  );

  return {
    messages,
    loading,
    error,
    analysisData,
    yesterdayHistory,
    sendMessage,
    refetch: fetchMessages,
    clearMessages,
    connectionStatus,
    refreshConnectionStatus,
  };
}
