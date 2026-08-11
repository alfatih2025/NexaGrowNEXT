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
        const apiUrl = 'https://nexa-grow-next.vercel.app';
        const res = await fetch(`${apiUrl}/api/sensor?limit=20`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const node1Data = data.find((d: any) => d.device_id === 'node_1' || d.node_id === 1);
            const node2Data = data.find((d: any) => d.device_id === 'node_2' || d.node_id === 2);
            
            if (node1Data) setNode1({ ...node1Data, node_id: 1 });
            if (node2Data) setNode2({ ...node2Data, node_id: 2 });
          }
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
