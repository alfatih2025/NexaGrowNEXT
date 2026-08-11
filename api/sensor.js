import supabase from '../src/lib/apiHelpers/_supabase.js';
import mqtt from 'mqtt';

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no', 'n'].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return null;

  return {
    id: row.id ?? undefined,
    node_id: toNumber(row.node_id, null),
    device_id: (row.node_id ?? row.device_id) ? `node_${row.node_id ?? row.device_id}` : 'ESP32_001',
    temperature: toNumber(row.temperature, null),
    humidity: toNumber(row.humidity, null),
    soil_moisture: toNumber(row.soil_moisture ?? row.soil, null),
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // run cleanup at most once per hour
let lastCleanupAt = 0;

async function cleanupOldSensorData() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('sensor_data')
    .delete()
    .lt('created_at', cutoff);

  if (error) throw error;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const now = Date.now();
    if (now - lastCleanupAt > CLEANUP_INTERVAL_MS) {
      await cleanupOldSensorData();
      lastCleanupAt = now;
    }
    if (req.method === 'GET') {
      const { limit = 100, latest } = req.query;

      if (latest === 'true') {
        const { data, error } = await supabase
          .from('sensor_data')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return res.status(200).json(row ? normalizeRow(row) : null);
      }

      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit, 10) || 100);

      if (error) throw error;
      return res.status(200).json(Array.isArray(data) ? data.map(normalizeRow).filter(Boolean) : []);
    }

    if (req.method === 'POST') {
      // Validate API Key
      const apiKey = String(req.headers['x-api-key'] || req.headers['X-Api-Key'] || req.headers['X-API-Key'] || '').trim();
      const validApiKey = String(process.env.SECRET_API_KEY || 'NexaGrow_SecretKey_2026').trim();

      if (apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
      }

      const body = req.body || {};

      const nodeId = Number(body.node_id);
      if (!Number.isInteger(nodeId) || (nodeId !== 1 && nodeId !== 2)) {
        return res.status(400).json({ error: 'node_id must be 1 or 2' });
      }

      const sensorPayload = {
        node_id: nodeId,
        temperature: toNumber(body.temperature, null),
        humidity: toNumber(body.humidity, null),
        soil_moisture: toNumber(body.soil_moisture, null),
      };

      const { data, error } = await supabase
        .from('sensor_data')
        .insert(sensorPayload)
        .select()
        .single();

      if (error) throw error;

      // Publish to MQTT to update Web UI in real-time
      try {
        const brokerUrl = process.env.VITE_BROKER_URL || 'wss://a4e9379a555f47669c90f4c69b75eeda.s1.eu.hivemq.cloud:8884/mqtt';
        const mqttUrl = brokerUrl.replace('wss://', 'mqtts://').replace(':8884/mqtt', ':8883');

        const client = mqtt.connect(mqttUrl, {
          username: process.env.VITE_MQTT_USERNAME || 'NexaGrowv2',
          password: process.env.VITE_MQTT_PASSWORD || 'NexaGrow12345',
          connectTimeout: 4000,
        });

        await new Promise((resolve) => {
          let resolved = false;
          const finish = () => {
            if (!resolved) {
              resolved = true;
              client.end();
              resolve();
            }
          };

          client.on('connect', () => {
            client.publish('sproutai/sensor/data', JSON.stringify(sensorPayload), { qos: 0 }, finish);
          });

          client.on('error', (err) => {
            console.error('[MQTT Publish Error]', err);
            finish();
          });

          setTimeout(finish, 5000);
        });
      } catch (err) {
        console.error('[MQTT Publish Exception]', err);
      }

      return res.status(201).json(normalizeRow(data));
    }

    if (req.method === 'DELETE') {
      const days = Number(req.query.olderThanDays ?? 3);
      if (!Number.isFinite(days) || days <= 0) {
        return res.status(400).json({ error: 'Invalid olderThanDays value' });
      }

      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('sensor_data')
        .delete()
        .lt('created_at', cutoff);

      if (error) throw error;
      return res.status(200).json({ deleted_before: cutoff });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sensor API error:', err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
