import mqtt, { type MqttClient } from 'mqtt';

const DEFAULT_BROKER_URL = 'wss://083ac0ac0dbf4e78877e4a5cd24d426d.s1.eu.hivemq.cloud:8884/mqtt';
const DEFAULT_MQTT_USERNAME = 'NexaGrow';
const DEFAULT_MQTT_PASSWORD = 'Nexa12345678';

const BROKER_URL = (import.meta.env.VITE_BROKER_URL as string | undefined)?.trim() || DEFAULT_BROKER_URL;
const MQTT_USERNAME = (import.meta.env.VITE_MQTT_USERNAME as string | undefined)?.trim() || DEFAULT_MQTT_USERNAME;
const MQTT_PASSWORD = (import.meta.env.VITE_MQTT_PASSWORD as string | undefined)?.trim() || DEFAULT_MQTT_PASSWORD;

const WEB_STATUS_TOPIC = 'sproutai/web/status';
const DEVICE_STATUS_TOPIC = 'sproutai/esp32/status';
const SYSTEM_STATUS_TOPIC = 'sproutai/system/status';

const TOPIC_POMPA_CMD = 'sproutai/pompa/cmd';
const TOPIC_POMPA_STATUS = 'sproutai/pompa/status';
const TOPIC_LAMPU_CMD = 'sproutai/lampu/cmd';
const TOPIC_LAMPU_STATUS = 'sproutai/lampu/status';
const TOPIC_MODE_CMD = 'sproutai/mode/cmd';
const TOPIC_MODE_STATUS = 'sproutai/mode/status';
const TOPIC_WIFI_CMD = 'sproutai/wifi/cmd';
const TOPIC_WIFI_STATUS = 'sproutai/wifi/status';
const TOPIC_SETTINGS_CMD = 'sproutai/settings/cmd';
const TOPIC_SETTINGS_STATUS = 'sproutai/settings/status';
const TOPIC_SCHEDULE_CMD = 'sproutai/schedule/cmd';
const TOPIC_SCHEDULE_STATUS = 'sproutai/schedule/status';
const TOPIC_SENSOR_JSON = 'sproutai/sensor/data';
const TOPIC_RAIN_CHANCE = 'sproutai/weather/rain_chance';
const TOPIC_SOIL = 'sproutai/sensor/soil';
const TOPIC_TEMP = 'sproutai/sensor/temp';
const TOPIC_HUMIDITY = 'sproutai/sensor/humidity';
const TOPIC_SCORE = 'sproutai/sensor/score';
const TOPIC_SYSTEM_FAULT = 'sproutai/system/fault';

const SUBSCRIBE_TOPICS = [
  DEVICE_STATUS_TOPIC,
  SYSTEM_STATUS_TOPIC,
  TOPIC_SENSOR_JSON,
  TOPIC_SOIL,
  TOPIC_TEMP,
  TOPIC_HUMIDITY,
  TOPIC_SCORE,
  TOPIC_POMPA_STATUS,
  TOPIC_LAMPU_STATUS,
  TOPIC_MODE_STATUS,
  TOPIC_WIFI_STATUS,
  TOPIC_SETTINGS_CMD,
  TOPIC_SETTINGS_STATUS,
  TOPIC_SCHEDULE_STATUS,
  TOPIC_SYSTEM_FAULT,
];

const ESP_ONLINE_TIMEOUT_MS = 60_000;
const HISTORY_LIMIT = 120;
const SENSOR_PERSIST_INTERVAL_MS = 30_000;
const SETTINGS_EVENT = 'nexagrow:settings-updated';

let lastPersistedSensorJson: string | null = null;
let lastPersistedSensorAt = 0;

export interface MqttSensorSnapshot {
  device_id: string | null;
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  rain: number | null;
  score: number | null;
  soil_score: number | null;
  vdp_score: number | null;
  rain_score: number | null;
  vpd: number | null;
  duration_estimate: number | null;
  pump_status: boolean;
  led_status: boolean;
  device_mode: 'manual' | 'auto' | null;
  plant_phase: 'vegetatif' | 'generatif' | null;
  wifi_status: string | null;
  threshold_kritis: number | null;
  threshold_atas: number | null;
  threshold_bawah: number | null;
  watering_time: string | null;
  watering_duration: number | null;
  watering_active: boolean | null;
  auto_state: string | null;
  auto_reason: string | null;
  schedule_enabled: boolean;
  formula_name: string | null;
  formula_soil: string | null;
  formula_vpd: string | null;
  formula_score: string | null;
  soil_raw_dry: number | null;
  dht_error: boolean;
  soil_error: boolean;
  updatedAt: string | null;
  sourceTopic: string | null;
}



export interface MqttStatusSnapshot {
  brokerUrl: string;
  browserOnline: boolean;
  mqttConnected: boolean;
  mqttConnecting: boolean;
  mqttReconnecting: boolean;
  mqttError: string | null;
  espOnline: boolean;
  espLastSeenAt: string | null;
  systemOnline: boolean;
  systemLabel: string;
  systemDetail: string;
  lastTopic: string | null;
  lastPayload: string | null;
  lastMessageAt: string | null;
  webPublishedAt: string | null;
  subscribedTopics: string[];
  sensorSnapshot: MqttSensorSnapshot | null;
}

type SensorDelta = Partial<Omit<MqttSensorSnapshot, 'updatedAt' | 'sourceTopic'>>;

interface MqttAckWaiter {
  topic: string;
  matcher: (topic: string, payload: string) => boolean;
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: number;
}

const pendingMqttAcks = new Set<MqttAckWaiter>();

let client: MqttClient | null = null;
const listeners = new Set<() => void>();

const emptySensorSnapshot: MqttSensorSnapshot = {
  device_id: null,
  temperature: null,
  humidity: null,
  soil_moisture: null,
  rain: null,
  score: null,
  soil_score: null,
  vdp_score: null,
  rain_score: null,
  vpd: null,
  duration_estimate: null,
  pump_status: false,
  watering_active: null,
  auto_state: null,
  auto_reason: null,
  led_status: false,
  device_mode: null,
  wifi_status: null,
  threshold_kritis: null,
  threshold_atas: null,
  threshold_bawah: null,
  watering_time: null,
  watering_duration: null,
  schedule_enabled: true,
  formula_name: null,
  formula_soil: null,
  formula_vpd: null,
  formula_score: null,
  soil_raw_dry: null,
  dht_error: false,
  soil_error: false,
  plant_phase: null,
  updatedAt: null,
  sourceTopic: null,
};

const defaultSnapshot = (): MqttStatusSnapshot => ({
  brokerUrl: BROKER_URL,
  browserOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  mqttConnected: false,
  mqttConnecting: Boolean(BROKER_URL),
  mqttReconnecting: false,
  mqttError: BROKER_URL ? null : 'VITE_BROKER_URL belum diisi',
  espOnline: false,
  espLastSeenAt: null,
  systemOnline: false,
  systemLabel: 'Sistem Offline',
  systemDetail: 'Koneksi belum tersedia',
  lastTopic: null,
  lastPayload: null,
  lastMessageAt: null,
  webPublishedAt: null,
  subscribedTopics: SUBSCRIBE_TOPICS,
  sensorSnapshot: null,
});

let snapshot: MqttStatusSnapshot = defaultSnapshot();
let sensorSnapshot: MqttSensorSnapshot | null = null;
let sensorHistory: MqttSensorSnapshot[] = [];
let reconnectTimer: number | null = null;

function emit() {
  const now = Date.now();
  
  // ESP32 online jika: ada data dalam 60 detik, ATAU ada espLastSeenAt yang valid
  let espOnline = false;
  if (snapshot.espOnline && snapshot.espLastSeenAt) {
    const elapsed = now - new Date(snapshot.espLastSeenAt).getTime();
    espOnline = elapsed <= ESP_ONLINE_TIMEOUT_MS;
  }
  
  // Update espOnline jika sudah off tapi masih punya lastSeenAt yang valid
  if (!snapshot.espOnline && espOnline) {
    snapshot = { ...snapshot, espOnline: true };
  }

  const browserOnline = snapshot.browserOnline;
  const mqttConnected = snapshot.mqttConnected;
  
  // System online jika web + mqtt aktif (ESP32 sensor timeout tidak membuat web offline)
  const systemOnline = browserOnline && mqttConnected;
  
  const reasonParts: string[] = [];

  if (!browserOnline) reasonParts.push('Web offline');
  if (!mqttConnected) reasonParts.push(snapshot.mqttError || 'MQTT belum terhubung');
  
  // ESP32 offline hanya dijadikan informasi, tidak membuat sistem offline
  const espLastSeen = snapshot.espLastSeenAt ? new Date(snapshot.espLastSeenAt) : null;
  const espLastSeenMs = espLastSeen ? now - espLastSeen.getTime() : null;
  if (!espOnline && espLastSeenMs !== null) {
    reasonParts.push(`Data sensor: ${espLastSeenMs > 60000 ? 'lama' : 'terbaru'}`);
  }

  snapshot = {
    ...snapshot,
    espOnline,
    systemOnline,
    systemLabel: systemOnline ? 'Sistem Online' : 'Sistem Offline',
    systemDetail: systemOnline
      ? 'Web & MQTT aktif' + (espOnline ? ', ESP32 aktif' : ', menunggu data sensor')
      : reasonParts.filter(Boolean).join(' • ') || 'Sistem belum siap',
    sensorSnapshot,
  };

  listeners.forEach((listener) => listener());
}

function setSnapshot(next: Partial<MqttStatusSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function pushHistory(entry: MqttSensorSnapshot) {
  sensorHistory = [...sensorHistory, entry].slice(-HISTORY_LIMIT);
}

function setSensorSnapshot(next: SensorDelta, sourceTopic: string, force = false) {
  const now = new Date().toISOString();
  const base = sensorSnapshot ?? emptySensorSnapshot;
  const merged: MqttSensorSnapshot = {
    ...base,
    ...next,
    updatedAt: now,
    sourceTopic,
  };

  const comparableBase = {
    ...base,
    updatedAt: null,
    sourceTopic: null,
  };

  const comparableNext = {
    ...merged,
    updatedAt: null,
    sourceTopic: null,
  };

  const changed = force || JSON.stringify(comparableBase) !== JSON.stringify(comparableNext);
  if (!changed) {
    snapshot = {
      ...snapshot,
      espOnline: true,
      lastTopic: sourceTopic,
      lastPayload: null,
      lastMessageAt: now,
      espLastSeenAt: now,
    };
    emit();
    return;
  }

  sensorSnapshot = merged;
  pushHistory(merged);
  snapshot = {
    ...snapshot,
    espOnline: true,
    lastTopic: sourceTopic,
    lastPayload: JSON.stringify(merged),
    lastMessageAt: now,
    espLastSeenAt: now,
    sensorSnapshot,
  };
  emit();
}


function dispatchSettingsEvent(detail: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail }));
  } catch {
    // ignore dispatch failures
  }
}

export function parseMqttJsonPayload(payload: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function persistSensorDataToApi(payload: string, parsed: SensorDelta) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const normalized = JSON.stringify({
    device_id: parsed.device_id ?? undefined,
    temperature: parsed.temperature ?? undefined,
    humidity: parsed.humidity ?? undefined,
    soil_moisture: parsed.soil_moisture ?? undefined,
    rain: parsed.rain ?? undefined,
    score: parsed.score ?? undefined,
    soil_score: parsed.soil_score ?? undefined,
    vdp_score: parsed.vdp_score ?? undefined,
    rain_score: parsed.rain_score ?? undefined,
    vpd: parsed.vpd ?? undefined,
    duration_estimate: parsed.duration_estimate ?? undefined,
    pump_status: parsed.pump_status ?? undefined,
    led_status: parsed.led_status ?? undefined,
    device_mode: parsed.device_mode ?? undefined,
    wifi_status: parsed.wifi_status ?? undefined,
    threshold_kritis: parsed.threshold_kritis ?? undefined,
    threshold_atas: parsed.threshold_atas ?? undefined,
    threshold_bawah: parsed.threshold_bawah ?? undefined,
    watering_time: parsed.watering_time ?? undefined,
    watering_duration: parsed.watering_duration ?? undefined,
    schedule_enabled: parsed.schedule_enabled ?? undefined,
    formula_name: parsed.formula_name ?? undefined,
    formula_soil: parsed.formula_soil ?? undefined,
    formula_vpd: parsed.formula_vpd ?? undefined,
    formula_score: parsed.formula_score ?? undefined,
    soil_raw_dry: parsed.soil_raw_dry ?? undefined,
    dht_error: parsed.dht_error ?? undefined,
    soil_error: parsed.soil_error ?? undefined,
  });

  if (lastPersistedSensorJson === normalized && now - lastPersistedSensorAt < SENSOR_PERSIST_INTERVAL_MS) {
    return;
  }

  lastPersistedSensorJson = normalized;
  lastPersistedSensorAt = now;

  try {
    await fetch('/api/sensor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: normalized,
    });
  } catch (err) {
    console.warn('[SENSOR PERSIST] Gagal simpan ke API sensor:', err);
  }
}

function consumePendingMqttAcks(topic: string, payload: string) {
  for (const waiter of Array.from(pendingMqttAcks)) {
    try {
      if (waiter.matcher(topic, payload)) {
        pendingMqttAcks.delete(waiter);
        window.clearTimeout(waiter.timeoutId);
        waiter.resolve();
      }
    } catch {
      // ignore matcher failures
    }
  }
}

function applySettingsSnapshot(detail: Record<string, unknown>, sourceTopic: string) {
  // Update sensor snapshot for the fields used by dashboard/control (thresholds + schedule).
  const nextSensorDelta: SensorDelta = {
    threshold_kritis: parseNumeric(detail.threshold_kritis ?? detail.soil_threshold_critical),
    threshold_atas: parseNumeric(detail.threshold_atas ?? detail.soil_threshold_high),
    threshold_bawah: parseNumeric(detail.threshold_bawah ?? detail.soil_threshold_low),
    watering_time: typeof detail.watering_time === 'string' ? detail.watering_time : undefined,
    watering_duration: parseNumeric(detail.watering_duration),
    schedule_enabled: detail.watering_enabled === undefined
      ? (detail.schedule_enabled === undefined ? undefined : parseBoolean(detail.schedule_enabled))
      : Boolean(detail.watering_enabled),

    // Extra fields are dispatched via dispatchSettingsEvent (useSettings),
    // not stored in MqttSensorSnapshot because the type doesn't include them.
  };


  setSensorSnapshot(nextSensorDelta, sourceTopic, true);

  // IMPORTANT: dispatch full settings payload so every page re-renders with latest values.
  // Payload shape should match what useSettings.normalizeSettings expects.
  const settingsDetail = {
    ...(detail as Record<string, unknown>),

    // Normalize keys to common web settings keys
    plant_phase:
      typeof detail.plant_phase === 'string'
        ? detail.plant_phase
        : typeof detail.crop_mode === 'string'
          ? detail.crop_mode
          : undefined,

    location:
      typeof detail.location === 'string'
        ? detail.location
        : typeof detail.weather_location === 'string'
          ? detail.weather_location
          : undefined,

    watering_time:
      typeof detail.watering_time === 'string' ? detail.watering_time : undefined,

    watering_duration: parseNumeric(detail.watering_duration),

    watering_enabled:
      detail.watering_enabled === undefined
        ? detail.schedule_enabled === undefined
          ? undefined
          : parseBoolean(detail.schedule_enabled)
        : Boolean(detail.watering_enabled),

    // thresholds: support both ESP32 web payload keys and sensor-derived keys
    temp_threshold_low: parseNumeric(detail.temp_threshold_low ?? detail.threshold_bawah),
    temp_threshold_high: parseNumeric(detail.temp_threshold_high ?? detail.threshold_atas),
    humidity_threshold_low: parseNumeric(detail.humidity_threshold_low ?? detail.h_low ?? detail.humidity_low),
    humidity_threshold_high: parseNumeric(detail.humidity_threshold_high ?? detail.h_high ?? detail.humidity_high),
    soil_threshold_low: parseNumeric(detail.soil_threshold_low ?? detail.threshold_bawah),
    soil_threshold_high: parseNumeric(detail.soil_threshold_high ?? detail.threshold_atas),
    soil_threshold_critical: parseNumeric(detail.soil_threshold_critical ?? detail.threshold_kritis),

    auto_report:
      detail.auto_report === undefined ? undefined : Boolean(detail.auto_report),
    report_time:
      typeof detail.report_time === 'string' ? detail.report_time : undefined,

    // user_name & user_email dihapus
    user_name: undefined,
    user_email: undefined,

    // keep compatibility with some pages that use crop_mode
    crop_mode:
      typeof detail.crop_mode === 'string'
        ? detail.crop_mode
        : undefined,
  } as Record<string, unknown>;

  dispatchSettingsEvent(settingsDetail);
}


function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  }
  return undefined;
}

function parseMode(value: unknown): 'manual' | 'auto' | null | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'manual' || normalized === 'auto') return normalized;
  return undefined;
}

function normalizeJsonSensorPayload(payload: string): SensorDelta | null {
  try {
    const obj = JSON.parse(payload);
    if (!obj || typeof obj !== 'object') return null;

    return {
      device_id: typeof obj.device_id === 'string' ? obj.device_id : undefined,
      temperature: parseNumeric(obj.temperature ?? obj.suhu),
      humidity: parseNumeric(obj.humidity ?? obj.kelembapan_udara),
      soil_moisture: parseNumeric(obj.soil_moisture ?? obj.soil ?? obj.tanah),
      rain: parseNumeric(obj.rain ?? obj.hujan),
      // support Arduino field names: score_total(score), vpd, soil_score, vdp_score, rain_score
      score: parseNumeric(obj.score ?? obj.score_total ?? obj.skor),
      soil_score: parseNumeric(obj.soil_score ?? obj.skor_tanah),
      vdp_score: parseNumeric(obj.vdp_score ?? obj.skor_vdp),
      rain_score: parseNumeric(obj.rain_score ?? obj.skor_hujan),
      vpd: parseNumeric(obj.vpd ?? obj.vdp_value ?? obj.vapor_pressure_deficit),

      duration_estimate: parseNumeric(obj.duration_estimate ?? obj.duration ?? obj.durasi),
      pump_status: parseBoolean(obj.pump_status ?? obj.relay_state),
      led_status: parseBoolean(obj.led_status ?? obj.led_state ?? obj.feeder_status),
      device_mode: parseMode(obj.device_mode ?? (obj.auto_mode === true ? 'auto' : obj.auto_mode === false ? 'manual' : undefined)),
      wifi_status: typeof obj.wifi_status === 'string' ? obj.wifi_status : undefined,
      threshold_kritis: parseNumeric(obj.threshold_kritis),
      threshold_atas: parseNumeric(obj.threshold_atas),
      threshold_bawah: parseNumeric(obj.threshold_bawah),
      watering_time: typeof obj.watering_time === 'string' ? obj.watering_time : undefined,
      watering_duration: parseNumeric(obj.watering_duration),
      watering_active: parseBoolean(obj.watering_active),
      auto_state: typeof obj.auto_state === 'string' ? obj.auto_state : undefined,
      auto_reason: typeof obj.auto_reason === 'string' ? obj.auto_reason : undefined,
      schedule_enabled: parseBoolean(obj.schedule_enabled ?? obj.watering_enabled),
      formula_name: typeof obj.formula_name === 'string' ? obj.formula_name : undefined,
      formula_soil: typeof obj.formula_soil === 'string' ? obj.formula_soil : undefined,
      formula_vpd: typeof obj.formula_vpd === 'string' ? obj.formula_vpd : undefined,
      formula_score: typeof obj.formula_score === 'string' ? obj.formula_score : undefined,
      soil_raw_dry: parseNumeric(obj.soil_raw_dry),
      dht_error: parseBoolean(obj.dht_error) ?? false,
      soil_error: parseBoolean(obj.soil_error) ?? false,
    };
  } catch {
    return null;
  }
}

function parseStatusValue(payload: string): boolean | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (['online', 'connected', 'true', '1', 'on', 'ready', 'active'].includes(lower)) return true;
  if (['offline', 'disconnected', 'false', '0', 'off', 'inactive', 'error'].includes(lower)) return false;

  try {
    const obj = JSON.parse(trimmed);
    if (!obj || typeof obj !== 'object') return null;
    const candidate =
      (obj as Record<string, unknown>).status ??
      (obj as Record<string, unknown>).state ??
      (obj as Record<string, unknown>).online ??
      (obj as Record<string, unknown>).connected;
    if (typeof candidate === 'boolean') return candidate;
    if (typeof candidate === 'number') return candidate !== 0;
    if (typeof candidate === 'string') return parseStatusValue(candidate);
  } catch {
    return null;
  }

  return null;
}

function updateFromTopic(topic: string, payload: string) {
  const now = new Date().toISOString();
  const trimmed = payload.trim();

  if (topic === SYSTEM_STATUS_TOPIC || topic === DEVICE_STATUS_TOPIC) {
    const parsedStatus = parseStatusValue(trimmed);
    const isOnline = parsedStatus ?? true;
    
    if (!isOnline && sensorSnapshot) {
      sensorSnapshot = { ...sensorSnapshot, pump_status: false, led_status: false };
    }
    
    setSnapshot({
      espOnline: isOnline,
      espLastSeenAt: isOnline ? now : null,
      lastTopic: topic,
      lastPayload: payload,
      lastMessageAt: now,
    });
    return;
  }

  if (topic === TOPIC_SENSOR_JSON) {
    const parsed = normalizeJsonSensorPayload(payload);
    if (parsed) {
      setSensorSnapshot(parsed, topic, true);
      setSnapshot({
        lastTopic: topic,
        lastPayload: payload,
        lastMessageAt: now,
      });
      persistSensorDataToApi(payload, parsed).catch(() => {});
    }
    return;
  }

  if (topic === TOPIC_SOIL) {
    const value = parseNumeric(trimmed);
    if (value !== null) setSensorSnapshot({ soil_moisture: value }, topic);
  } else if (topic === TOPIC_TEMP) {
    const value = parseNumeric(trimmed);
    if (value !== null) setSensorSnapshot({ temperature: value }, topic);
  } else if (topic === TOPIC_HUMIDITY) {
    const value = parseNumeric(trimmed);
    if (value !== null) setSensorSnapshot({ humidity: value }, topic);
  } else if (topic === TOPIC_SCORE) {
    const value = parseNumeric(trimmed);
    if (value !== null) setSensorSnapshot({ score: value }, topic);
  } else if (topic === TOPIC_POMPA_STATUS) {
    const value = parseBoolean(trimmed);
    if (value !== undefined) setSensorSnapshot({ pump_status: value }, topic);
  } else if (topic === TOPIC_LAMPU_STATUS) {
    const value = parseBoolean(trimmed);
    if (value !== undefined) setSensorSnapshot({ led_status: value }, topic);
  } else if (topic === TOPIC_MODE_STATUS) {
    const mode = parseMode(trimmed);
    if (mode !== undefined) setSensorSnapshot({ device_mode: mode }, topic);
  } else if (topic === TOPIC_WIFI_STATUS) {
    setSensorSnapshot({ wifi_status: trimmed || null }, topic);
  } else if (topic === TOPIC_SETTINGS_CMD || topic === TOPIC_SETTINGS_STATUS) {
    const parsed = parseMqttJsonPayload(trimmed);
    if (parsed) {
      applySettingsSnapshot(parsed, topic);
    }
  } else if (topic === TOPIC_SCHEDULE_STATUS) {
    const parsed = parseMqttJsonPayload(trimmed);
    if (parsed) {
      const normalizedSchedule = {
        watering_time: typeof parsed.watering_time === 'string' ? parsed.watering_time : undefined,
        watering_duration: parseNumeric(parsed.watering_duration),
        watering_enabled: parseBoolean(parsed.schedule_enabled ?? parsed.watering_enabled),
        schedule_enabled: parseBoolean(parsed.schedule_enabled ?? parsed.watering_enabled),
      };

      setSensorSnapshot({
        watering_time: normalizedSchedule.watering_time,
        watering_duration: normalizedSchedule.watering_duration,
        schedule_enabled: normalizedSchedule.schedule_enabled,
      }, topic);
      dispatchSettingsEvent(normalizedSchedule);
    }
  } else if (topic === TOPIC_SYSTEM_FAULT) {
    const parsed = parseMqttJsonPayload(trimmed);
    if (parsed) {
      const device = parsed.device as string;
      const status = parsed.status as string;
      const isFault = status === 'fault';
      
      if (device === 'DHT22') {
        setSensorSnapshot({ dht_error: isFault }, topic);
      } else if (device === 'SOIL') {
        setSensorSnapshot({ soil_error: isFault }, topic);
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexagrow:sensor_fault', {
          detail: { device, status, isFault }
        }));
      }
    }
  }

  if (
    topic.startsWith('sproutai/sensor/') ||
    topic.startsWith('sproutai/pompa/') ||
    topic.startsWith('sproutai/lampu/') ||
    topic.startsWith('sproutai/mode/') ||
    topic.startsWith('sproutai/wifi/') ||
    topic.startsWith('sproutai/settings/') ||
    topic.startsWith('sproutai/schedule/') ||
    topic.startsWith('sproutai/esp32/') ||
    topic.startsWith('sproutai/system/')
  ) {
    setSnapshot({
      lastTopic: topic,
      lastPayload: payload,
      lastMessageAt: now,
      espLastSeenAt: now,
    });
  }
}

function connectOnce() {
  if (client || !BROKER_URL) return client;

  if (!isWebSocketBroker(BROKER_URL)) {
    console.error('[MQTT] invalid broker URL', BROKER_URL);
    setSnapshot({
      mqttError: 'VITE_BROKER_URL harus ws:// atau wss:// untuk browser.',
      mqttConnecting: false,
    });
    return null;
  }

  client = mqtt.connect(BROKER_URL, {
    username: MQTT_USERNAME || undefined,
    password: MQTT_PASSWORD || undefined,
    reconnectPeriod: 1000,
    connectTimeout: 6000,
    clean: true,
    keepalive: 15,
    clientId: `nexagrow_web_${Math.random().toString(16).slice(2, 10)}`,
  });

  client.on('connect', () => {
    console.debug('[MQTT] connected to broker', BROKER_URL);
    setSnapshot({
      mqttConnected: true,
      mqttConnecting: false,
      mqttReconnecting: false,
      mqttError: null,
    });

    for (const topic of SUBSCRIBE_TOPICS) {
      client?.subscribe(topic, { qos: 1 });
    }

    announceWebPresence('online').catch(() => {});
    setSnapshot({ webPublishedAt: new Date().toISOString() });
  });

  client.on('reconnect', () => {
    console.debug('[MQTT] reconnecting');
    setSnapshot({
      mqttConnected: false,
      mqttConnecting: true,
      mqttReconnecting: true,
    });
  });

  client.on('offline', () => {
    console.warn('[MQTT] offline');
    setSnapshot({
      mqttConnected: false,
      mqttConnecting: false,
      mqttReconnecting: false,
    });
  });

  client.on('close', () => {
    console.warn('[MQTT] connection closed');
    setSnapshot({
      mqttConnected: false,
      mqttConnecting: false,
    });
  });

  client.on('error', (err: Error) => {
    console.error('[MQTT] error', err.message);
    setSnapshot({
      mqttConnected: false,
      mqttConnecting: false,
      mqttError: err.message,
    });
  });

  client.on('message', (topic: string, message: Buffer) => {
    const payload = message.toString();
    updateFromTopic(topic, payload);
    consumePendingMqttAcks(topic, payload);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (client?.connected) {
        client.publish(
          WEB_STATUS_TOPIC,
          JSON.stringify({
            device: 'sprout-web',
            status: 'offline',
            at: new Date().toISOString(),
          }),
          { retain: true, qos: 0 },
        );
      }
    });
  }

  return client;
}

function isWebSocketBroker(url: string) {
  return /^wss?:\/\//i.test(url);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setSnapshot({ browserOnline: true }));
  window.addEventListener('offline', () => setSnapshot({ browserOnline: false }));
  window.setInterval(() => emit(), 3000);
}

export function getMqttClient() {
  return connectOnce();
}

export function getMqttStatusSnapshot() {
  return snapshot;
}

export function getSensorSnapshot() {
  return snapshot.sensorSnapshot;
}

export function getSensorHistorySnapshot() {
  return sensorHistory.slice();
}

export function subscribeMqttStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishMqtt(
  topic: string,
  payload: string,
  options: Record<string, unknown> = {},
) {
  const currentClient = connectOnce();
  if (!currentClient) {
    console.error('[MQTT] client unavailable for publish', topic, payload);
    return Promise.reject(new Error('MQTT client belum tersedia'));
  }

  console.debug('[MQTT] publish', {
    topic,
    payload,
    connected: currentClient.connected,
    options,
  });

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('MQTT publish timeout'));
    }, 7000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      currentClient.off('connect', onConnect);
      currentClient.off('error', onError);
    };

    const onError = (err: Error) => {
      cleanup();
      console.error('[MQTT] publish failed', topic, payload, err.message);
      reject(err);
    };

    const onConnect = () => {
      currentClient.publish(
        topic,
        payload,
        { qos: 1, retain: false, ...options },
        (err: Error | null | undefined) => {
          cleanup();
          if (err) {
            console.error('[MQTT] publish callback error', topic, payload, err.message);
            reject(err);
            return;
          }

          console.debug('[MQTT] publish success', topic, payload);
          snapshot = {
            ...snapshot,
            lastTopic: topic,
            lastPayload: payload,
            lastMessageAt: new Date().toISOString(),
          };
          emit();
          resolve();
        },
      );
    };

    if (currentClient.connected) {
      onConnect();
      return;
    }

    currentClient.once('connect', onConnect);
    currentClient.once('error', onError);
  });
}

export function publishMqttWithAck(
  topic: string,
  payload: string,
  ackTopic: string,
  matcher: (topic: string, payload: string) => boolean,
  timeoutMs = 12000,
  options: Record<string, unknown> = {},
) {
  const currentClient = connectOnce();
  if (!currentClient) {
    return Promise.reject(new Error('MQTT client belum tersedia'));
  }

  console.debug('[MQTT] publishWithAck', { topic, payload, ackTopic, options });

  return new Promise<void>((resolve, reject) => {
    let timeoutId = 0;
    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      pendingMqttAcks.delete(waiter);
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for MQTT ACK on ${ackTopic}`));
    }, timeoutMs);

    const waiter: MqttAckWaiter = {
      topic: ackTopic,
      matcher,
      resolve: () => {
        cleanup();
        resolve();
      },
      reject: (error: Error) => {
        cleanup();
        reject(error);
      },
      timeoutId,
    };

    pendingMqttAcks.add(waiter);

    publishMqtt(topic, payload, options).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

function applyLocalSnapshot(action: string, duration?: number, data?: Record<string, any>) {
  const now = new Date().toISOString();

  switch (action) {
    case 'pump_on':
      setSensorSnapshot({ pump_status: true }, TOPIC_POMPA_STATUS, true);
      break;
    case 'pump_off':
      setSensorSnapshot({ pump_status: false }, TOPIC_POMPA_STATUS, true);
      break;
    case 'pump_10s':
      setSensorSnapshot({ pump_status: true }, TOPIC_POMPA_STATUS, true);
      break;
    case 'led_on':
      setSensorSnapshot({ led_status: true }, TOPIC_LAMPU_STATUS, true);
      break;
    case 'led_off':
      setSensorSnapshot({ led_status: false }, TOPIC_LAMPU_STATUS, true);
      break;
    case 'mode_auto':
      setSensorSnapshot({ device_mode: 'auto' }, TOPIC_MODE_STATUS, true);
      break;
    case 'mode_manual':
      setSensorSnapshot({ device_mode: 'manual' }, TOPIC_MODE_STATUS, true);
      break;
    case 'settings_sync': {
      const nextSettings = {
        plant_phase: String(data?.plant_phase ?? data?.crop_mode ?? '').trim() || undefined,
        location: String(data?.location ?? '').trim() || undefined,
        temperature_high: parseNumeric(data?.temp_threshold_high),
        temperature_low: parseNumeric(data?.temp_threshold_low),
        humidity_high: parseNumeric(data?.humidity_threshold_high),
        humidity_low: parseNumeric(data?.humidity_threshold_low),
        soil_threshold_critical: parseNumeric(data?.soil_threshold_critical),
        soil_threshold_high: parseNumeric(data?.soil_threshold_high),
        soil_threshold_low: parseNumeric(data?.soil_threshold_low),
        watering_time: typeof data?.watering_time === 'string' ? data.watering_time : undefined,
        watering_duration: parseNumeric(data?.watering_duration),
        watering_enabled: data?.watering_enabled === undefined ? undefined : Boolean(data.watering_enabled),
        auto_report: data?.auto_report === undefined ? undefined : Boolean(data.auto_report),
        report_time: typeof data?.report_time === 'string' ? data.report_time : undefined,
        user_name: typeof data?.user_name === 'string' ? data.user_name : undefined,
        user_email: typeof data?.user_email === 'string' ? data.user_email : undefined,
      } as Record<string, unknown>;

      setSensorSnapshot({
        threshold_kritis: parseNumeric(data?.soil_threshold_critical),
        threshold_atas: parseNumeric(data?.soil_threshold_high),
        threshold_bawah: parseNumeric(data?.soil_threshold_low),
        watering_time: typeof data?.watering_time === 'string' ? data.watering_time : undefined,
        watering_duration: parseNumeric(data?.watering_duration),
        schedule_enabled: data?.watering_enabled === undefined ? undefined : Boolean(data.watering_enabled),
      }, TOPIC_SETTINGS_CMD, true);
      dispatchSettingsEvent(nextSettings);
      break;
    }
    case 'schedule_set':
      setSensorSnapshot({
        watering_time: typeof data?.watering_time === 'string' ? data.watering_time : undefined,
        watering_duration: parseNumeric(data?.watering_duration),
        schedule_enabled: data?.schedule_enabled === undefined
          ? (data?.watering_enabled === undefined ? undefined : Boolean(data.watering_enabled))
          : Boolean(data.schedule_enabled),
      }, TOPIC_SCHEDULE_STATUS, true);
      break;
    default:
      break;
  }

  setSnapshot({
    lastTopic: action,
    lastPayload: data ? JSON.stringify(data) : duration != null ? String(duration) : action,
    lastMessageAt: now,
  });
}

export function syncLocalControlState(action: string, duration?: number, data?: Record<string, any>) {
  applyLocalSnapshot(action, duration, data);
}

/**
 * Publish rain chance data to MQTT for ESP32 consumption.
 * This is called automatically every 3 hours (or when value changes)
 * from App.tsx so it works without opening Settings page.
 */
export function publishRainChance(rainChance: number) {
  const currentClient = connectOnce();
  if (!currentClient) return Promise.resolve(false);

  const payload = JSON.stringify({
    rainChance: Math.round(rainChance),
    timestamp: new Date().toISOString(),
  });

  return new Promise<boolean>((resolve) => {
    currentClient.publish(
      TOPIC_RAIN_CHANCE,
      payload,
      { retain: true, qos: 1 },
      (err?: Error | null) => {
        if (err) {
          console.warn('[RAIN] publish rainChance failed', err.message);
          resolve(false);
          return;
        }
        console.debug('[RAIN] published rainChance', rainChance, '%');
        resolve(true);
      },
    );
  });
}

export function announceWebPresence(status: 'online' | 'offline' = 'online') {
  const currentClient = connectOnce();
  if (!currentClient) return Promise.resolve(false);

  const payload = JSON.stringify({
    device: 'sprout-web',
    status,
    at: new Date().toISOString(),
  });

  return new Promise<boolean>((resolve) => {
    currentClient.publish(
      WEB_STATUS_TOPIC,
      payload,
      { retain: true, qos: 0 },
      () => {
        setSnapshot({
          webPublishedAt: new Date().toISOString(),
          lastTopic: WEB_STATUS_TOPIC,
          lastPayload: payload,
          lastMessageAt: new Date().toISOString(),
        });
        resolve(true);
      },
    );
  });
}

export default getMqttClient();
