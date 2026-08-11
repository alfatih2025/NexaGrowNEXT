import { useState, useEffect } from 'react';
import { subscribeMqttStatus, getMqttStatusSnapshot, type MqttSensorSnapshot } from '../services/mqtt';

export interface NodeSensorData {
  node_id: number;
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  created_at: string;
}

export function useMultiNodeSensorData() {
  const [node1, setNode1] = useState<NodeSensorData | null>(null);
  const [node2, setNode2] = useState<NodeSensorData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial fetch from Laravel API
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const apiUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://192.168.43.105:8000';
        const res = await fetch(`${apiUrl}/api/sensor-data/latest`);
        if (res.ok) {
          const data = await res.json();
          if (data.node1) setNode1(data.node1);
          if (data.node2) setNode2(data.node2);
        }
      } catch (e) {
        console.error('Failed to fetch node data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  // 2. Real-time updates from MQTT
  useEffect(() => {
    const unsubscribe = subscribeMqttStatus(() => {
      const status = getMqttStatusSnapshot();
      const snap = status.sensorSnapshot;
      if (snap && snap.node_id) {
        const newData: NodeSensorData = {
          node_id: snap.node_id,
          temperature: snap.temperature,
          humidity: snap.humidity,
          soil_moisture: snap.soil_moisture,
          created_at: new Date().toISOString()
        };

        if (snap.node_id === 1) {
          setNode1((prev) => ({ ...prev, ...newData }));
        } else if (snap.node_id === 2) {
          setNode2((prev) => ({ ...prev, ...newData }));
        }
      }
    });

    return () => { unsubscribe(); };
  }, []);

  return { node1, node2, loading };
}
