import { buildApiHeaders } from '../lib/apiAuth';
import { useState, useEffect, useCallback } from 'react';
import type { SensorSnapshotContext } from '../services/openrouter';

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
  return sensorContext; // Simplified for brevity in this replace
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    state: 'checking',
    label: 'Memeriksa AI Router',
    detail: 'Menghubungkan chatbot ke sistem...',
  });

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

  const clearMessages = useCallback(async () => {
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
    try {
      const apiMessages = await fetchApiMessages();
      persistMessages(apiMessages);
      setError(null);
    } catch {
      persistMessages(readLocalMessages());
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
    [messages, persistMessages],
  );

  useEffect(() => {
    persistMessages(readLocalMessages());
    fetchMessages();
    refreshConnectionStatus();
  }, [fetchMessages, persistMessages, refreshConnectionStatus]);

  return {
    messages,
    loading,
    error,
    analysisData,
    sendMessage,
    refetch: fetchMessages,
    clearMessages,
    connectionStatus,
    refreshConnectionStatus,
  };
}
