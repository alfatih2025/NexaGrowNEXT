import { useCallback, useState, useEffect, useRef } from 'react';
import { subscribeMqttStatus, getNodeSensorSnapshot, type MqttSensorSnapshot } from '../services/mqtt';

export interface NodeSensorData {
  node_id: number;
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  created_at: string;
}

const REFRESH_INTERVAL_MS = 10000;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeNodeData(row: Record<string, unknown>): NodeSensorData | null {
  const nodeId = toNumber(row.node_id ?? String(row.device_id ?? '').replace('node_', ''));
  if (nodeId !== 1 && nodeId !== 2) return null;

  return {
    node_id: nodeId,
    temperature: toNumber(row.temperature),
    humidity: toNumber(row.humidity),
    soil_moisture: toNumber(row.soil_moisture),
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

function snapshotToNodeData(snap: MqttSensorSnapshot): NodeSensorData | null {
  if (snap.node_id !== 1 && snap.node_id !== 2) return null;

  return {
    node_id: snap.node_id,
    temperature: snap.temperature,
    humidity: snap.humidity,
    soil_moisture: snap.soil_moisture,
    created_at: snap.updatedAt || new Date().toISOString(),
  };
}

/** Bandingkan nilai sensor (tanpa timestamp) */
function isSameValues(a: NodeSensorData | null, b: NodeSensorData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.node_id === b.node_id &&
    a.temperature === b.temperature &&
    a.humidity === b.humidity &&
    a.soil_moisture === b.soil_moisture
  );
}

export function useMultiNodeSensorData() {
  const [node1, setNode1] = useState<NodeSensorData | null>(null);
  const [node2, setNode2] = useState<NodeSensorData | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref untuk perbandingan cepat tanpa re-render
  const node1Ref = useRef<NodeSensorData | null>(null);
  const node2Ref = useRef<NodeSensorData | null>(null);

  const applyNodeData = useCallback((next: NodeSensorData) => {
    if (next.node_id === 1) {
      // Hanya update state jika nilai sensor BENAR-BENAR berubah
      if (isSameValues(node1Ref.current, next)) return;
      node1Ref.current = next;
      setNode1(next);
    } else if (next.node_id === 2) {
      if (isSameValues(node2Ref.current, next)) return;
      node2Ref.current = next;
      setNode2(next);
    }
  }, []);

  // 1. Initial fetch + polling fallback dari Vercel/Supabase
  useEffect(() => {
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/sensor?latest=nodes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const row of data) {
              if (cancelled || !row || typeof row !== 'object') continue;
              const normalized = normalizeNodeData(row as Record<string, unknown>);
              if (normalized) applyNodeData(normalized);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch node data:', e instanceof Error ? e.message : e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLatest();
    const intervalId = window.setInterval(fetchLatest, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [applyNodeData]);

  // 2. Real-time MQTT — baca dari per-node snapshot (bukan snapshot tunggal)
  useEffect(() => {
    const unsubscribe = subscribeMqttStatus(() => {
      // Baca per-node snapshot langsung, bukan dari sensorSnapshot yang flip-flop
      const snap1 = getNodeSensorSnapshot(1);
      const snap2 = getNodeSensorSnapshot(2);

      if (snap1) {
        const data = snapshotToNodeData(snap1);
        if (data) applyNodeData(data);
      }
      if (snap2) {
        const data = snapshotToNodeData(snap2);
        if (data) applyNodeData(data);
      }
    });

    return () => { unsubscribe(); };
  }, [applyNodeData]);

  return { node1, node2, loading };
}
