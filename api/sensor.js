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
    device_id: row.device_id ?? 'ESP32_001',
    temperature: toNumber(row.temperature, 0),
    humidity: toNumber(row.humidity, 0),
    soil_moisture: toNumber(row.soil_moisture ?? row.soil, 0),
    rain: toNumber(row.rain, 0),
    score: toNumber(row.score ?? row.score_total, 0),
    soil_score: toNumber(row.soil_score ?? row.skor_tanah, null),
    vdp_score: toNumber(row.vdp_score ?? row.skor_vdp, null),
    rain_score: toNumber(row.rain_score ?? row.skor_hujan, null),
    vpd: toNumber(row.vpd, null),
    duration_estimate: toNumber(row.duration_estimate ?? row.duration ?? row.durasi, null),
    pump_status: toBoolean(row.pump_status, false),
    led_status: toBoolean(row.led_status ?? row.feeder_status, false),
    device_mode: row.device_mode === 'auto' || row.device_mode === 'manual' ? row.device_mode : null,
    wifi_status: row.wifi_status ?? 'unknown',
    threshold_kritis: toNumber(row.threshold_kritis, null),
    threshold_atas: toNumber(row.threshold_atas, null),
    threshold_bawah: toNumber(row.threshold_bawah, null),
    watering_time: typeof row.watering_time === 'string' ? row.watering_time : null,
    watering_duration: toNumber(row.watering_duration, null),
    schedule_enabled: toBoolean(row.schedule_enabled, true),
    formula_name: typeof row.formula_name === 'string' && row.formula_name.trim() ? row.formula_name.trim() : null,
    formula_soil: typeof row.formula_soil === 'string' && row.formula_soil.trim() ? row.formula_soil.trim() : null,
    formula_vpd: typeof row.formula_vpd === 'string' && row.formula_vpd.trim() ? row.formula_vpd.trim() : null,
    formula_score: typeof row.formula_score === 'string' && row.formula_score.trim() ? row.formula_score.trim() : null,
    soil_raw_dry: toNumber(row.soil_raw_dry, null),
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
      const body = req.body || {};
      
      const deviceId = body.node_id ? `node_${body.node_id}` : (body.device_id || 'ESP32_001');
      
      const payload = {
        device_id: deviceId,
        temperature: toNumber(body.temperature, 0),
        humidity: toNumber(body.humidity, 0),
        soil_moisture: toNumber(body.soil_moisture ?? body.soil, 0),
        rain: toNumber(body.rain, 0),
        score: toNumber(body.score ?? body.score_total, 0),
        soil_score: toNumber(body.soil_score, null),
        vdp_score: toNumber(body.vdp_score, null),
        rain_score: toNumber(body.rain_score, null),
        vpd: toNumber(body.vpd, null),
        duration_estimate: toNumber(body.duration_estimate ?? body.duration, null),
        pump_status: toBoolean(body.pump_status, false),
        wifi_status: body.wifi_status || 'connected',
        device_mode: body.device_mode === 'auto' || body.device_mode === 'manual' ? body.device_mode : null,
        threshold_kritis: toNumber(body.threshold_kritis, null),
        threshold_atas: toNumber(body.threshold_atas, null),
        threshold_bawah: toNumber(body.threshold_bawah, null),
        watering_time: typeof body.watering_time === 'string' ? body.watering_time : null,
        watering_duration: toNumber(body.watering_duration, null),
        schedule_enabled: toBoolean(body.schedule_enabled, true),
        formula_name: typeof body.formula_name === 'string' && body.formula_name.trim() ? body.formula_name.trim() : null,
        formula_soil: typeof body.formula_soil === 'string' && body.formula_soil.trim() ? body.formula_soil.trim() : null,
        formula_vpd: typeof body.formula_vpd === 'string' && body.formula_vpd.trim() ? body.formula_vpd.trim() : null,
        formula_score: typeof body.formula_score === 'string' && body.formula_score.trim() ? body.formula_score.trim() : null,
        soil_raw_dry: toNumber(body.soil_raw_dry, null),
      };

      const { data, error } = await supabase
        .from('sensor_data')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Publish to MQTT to update Web UI in real-time
      try {
        const brokerUrl = process.env.VITE_BROKER_URL || 'wss://a4e9379a555f47669c90f4c69b75eeda.s1.eu.hivemq.cloud:8884/mqtt';
        // Vercel serverless function can use Secure WebSockets (wss://) or mqtts:// (port 8883)
        // Here we use the WSS URL since it's already in env, but mqtts on 8883 is better for server-side
        // Let's use mqtts to be safe on backend
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
            const mqttPayload = { ...payload, node_id: body.node_id || undefined };
            client.publish('sproutai/sensor/data', JSON.stringify(mqttPayload), { qos: 0 }, finish);
          });

          client.on('error', (err) => {
            console.error('[MQTT Publish Error]', err);
            finish();
          });
          
          setTimeout(finish, 5000); // 5 seconds timeout
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
