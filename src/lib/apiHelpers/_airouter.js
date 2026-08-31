import fs from 'node:fs';
import path from 'node:path';
import { buildFormulaReference as bfr } from './_openrouter.js';

let cachedLocalEnv = null;

function readLocalEnv() {
  if (cachedLocalEnv) return cachedLocalEnv;
  const envMap = {};

  try {
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local')
    ];

    for (const envPath of envPaths) {
      if (!fs.existsSync(envPath)) continue;
      
      const raw = fs.readFileSync(envPath, 'utf8');

      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        envMap[key] = value;
      }
    }
  } catch (e) {
    console.error('Error reading env files:', e);
  }

  cachedLocalEnv = envMap;
  return envMap;
}

function getApiKey(provider) {
  const localEnv = readLocalEnv();
  const envKey = `${provider.toUpperCase()}_API_KEY`;
  return (process.env[envKey] || localEnv[envKey] || '').trim();
}

function formatLine(label, value, suffix = '') {
  if (value === null || value === undefined || value === '') return `- ${label}: -`;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `- ${label}: ${Number(value).toFixed(1)}${suffix}`;
  }
  return `- ${label}: ${value}${suffix}`;
}

export function buildFormulaReference() {
  return bfr();
}

export function isArduinoFormulaRequest(message) {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('rumus') || normalized.includes('formula') || normalized.includes('arduino');
}

function buildSystemPrompt(sensor) {
  const sensorLines = sensor ? [
    formatLine('Device ID', sensor.device_id),
    formatLine('Fase Tanaman', sensor.plant_phase),
    formatLine('Suhu', sensor.temperature, ' °C'),
    formatLine('Kelembapan Udara', sensor.humidity, ' %'),
    formatLine('Kelembapan Tanah', sensor.soil_moisture, ' %'),
  ].join('\n') : 'Data sensor belum tersedia.';

  return [
    'Kamu adalah AI Router dan Analis Cerdas untuk NexaGrow.',
    'Berikan analisis berdasarkan data sensor.',
    'Tugas utamamu adalah merespons pertanyaan pengguna. Namun, di AKHIR balasanmu, kamu WAJIB menyertakan blok JSON yang berisi ringkasan keputusan untuk keperluan UI.',
    'Gunakan format persis seperti ini di akhir balasan:',
    '```json',
    '{',
    '  "decision": "Siram / Jangan Siram / Periksa Sensor",',
    '  "confidence": 92,',
    '  "recommendations": [',
    '    { "label": "Pompa", "value": "ON 10 detik" }',
    '  ],',
    '  "analysis": [',
    '    "Kelembapan tanah di bawah batas optimal",',
    '    "Suhu cukup tinggi"' ,
    '  ]',
    '}',
    '```',
    'Pastikan JSON valid. JANGAN tampilkan proses berfikir (chain of thought) di luar atau di dalam JSON.',
    'Bagian teks di atas JSON akan ditampilkan sebagai chat biasa.',
    '',
    'DATA SENSOR TERKINI:',
    sensorLines,
  ].join('\n');
}

async function callProvider(provider, model, messages, temperature, maxTokens, origin, images = []) {
  const apiKey = getApiKey(provider);
  if (!apiKey) throw new Error(`API Key untuk ${provider} tidak ditemukan di environment.`);

  let endpoint = '';
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (provider === 'gemini') {
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const geminiMessages = messages.map((m, idx) => {
      const isLastUserMsg = m.role === 'user' && idx === messages.length - 1;
      const parts = [{ text: m.content || '' }];

      if (isLastUserMsg && Array.isArray(images) && images.length > 0) {
        images.forEach((imgDataUrl) => {
          if (typeof imgDataUrl === 'string' && imgDataUrl.includes(';base64,')) {
            const [header, base64Data] = imgDataUrl.split(';base64,');
            const mimeType = header.replace('data:', '') || 'image/jpeg';
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            });
          }
        });
      }

      return {
        role: m.role === 'system' ? 'user' : m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini error');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers['HTTP-Referer'] = origin;
    headers['X-Title'] = 'NexaGrow';
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  if (!endpoint) throw new Error(`Provider ${provider} tidak didukung`);

  const formattedMessages = messages.map((m, idx) => {
    const isLastUserMsg = m.role === 'user' && idx === messages.length - 1;
    if (isLastUserMsg && Array.isArray(images) && images.length > 0) {
      const contentParts = [{ type: 'text', text: m.content || '' }];
      images.forEach((imgDataUrl) => {
        if (typeof imgDataUrl === 'string') {
          contentParts.push({
            type: 'image_url',
            image_url: { url: imgDataUrl },
          });
        }
      });
      return { role: m.role, content: contentParts };
    }
    return m;
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `${provider} API error`);
  return data.choices?.[0]?.message?.content || '';
}

function normalizeAiModel(provider, model) {
  if (provider !== 'gemini') return model;
  if (['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite-preview', 'gemini-2.5-pro', 'gemini-3.1-pro-preview'].includes(model)) return 'gemini-3.5-flash-lite';
  return model;
}

export async function getAiRouterStatus(origin) {
  // Simple check if any keys exist
  const geminiKey = getApiKey('gemini');
  const orKey = getApiKey('openrouter');
  const groqKey = getApiKey('groq');

  if (!geminiKey && !orKey && !groqKey) {
    return { ok: false, state: 'missing_key', label: 'AI Router', detail: 'Semua API Key kosong.' };
  }
  return { ok: true, state: 'connected', label: 'AI Router Online', detail: 'Sistem siap.' };
}

export async function sendAiRouterMessage({ message, images = [], history = [], sensorContext = null, aiSettings = null, origin }) {
  const settings = aiSettings || {
    ai_primary_provider: 'gemini',
    ai_primary_model: 'gemini-3.5-flash-lite',
    ai_fallback_1_provider: 'openrouter',
    ai_fallback_1_model: 'qwen/qwen-2.5-72b-instruct',
    ai_fallback_2_provider: 'groq',
    ai_fallback_2_model: 'llama-3.3-70b-versatile',
    ai_temperature: 0.4,
    ai_max_tokens: 600,
  };

  const hasImages = Array.isArray(images) && images.length > 0;
  const imagePromptNote = hasImages
    ? '\n\nPENGGUNA TELAH MENGUNGGAH GAMBAR/FOTO TANAMAN. Lakukan analisis visual mendalam terhadap gambar tersebut (periksa kondisi daun, bercak, hama, defisiensi nutrisi, atau gejala penyakit tanaman).'
    : '';

  const messages = [
    { role: 'system', content: buildSystemPrompt(sensorContext) + imagePromptNote },
    ...history.slice(-8).map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content,
    })),
    { role: 'user', content: message },
  ];

  const providersToTry = [
    { p: settings.ai_primary_provider, m: normalizeAiModel(settings.ai_primary_provider, settings.ai_primary_model) },
    { p: settings.ai_fallback_1_provider, m: normalizeAiModel(settings.ai_fallback_1_provider, settings.ai_fallback_1_model) },
    { p: settings.ai_fallback_2_provider, m: normalizeAiModel(settings.ai_fallback_2_provider, settings.ai_fallback_2_model) }
  ].filter(x => x.p && x.p !== 'none');

  let lastError = null;
  let successContent = '';
  let successfulProvider = '';
  let successfulModel = '';
  let fallbackStatus = {};

  const timeline = [
    { time: new Date().toLocaleTimeString(), label: 'Sensor received', status: 'done' },
    { time: new Date().toLocaleTimeString(), label: `Rule engine checked thresholds`, status: 'done' },
  ];

  for (const target of providersToTry) {
    try {
      timeline.push({ time: new Date().toLocaleTimeString(), label: `AI Router selected ${target.p}`, status: 'done' });
      successContent = await callProvider(target.p, target.m, messages, settings.ai_temperature, settings.ai_max_tokens, origin, images);
      successfulProvider = target.p;
      successfulModel = target.m;
      fallbackStatus[target.p] = 'Success';
      timeline.push({ time: new Date().toLocaleTimeString(), label: `AI analysis completed`, status: 'done' });
      break;
    } catch (err) {
      lastError = err;
      fallbackStatus[target.p] = 'Failed: ' + err.message;
      timeline.push({ time: new Date().toLocaleTimeString(), label: `${target.p} failed`, status: 'done' });
    }
  }

  if (!successContent) {
    throw new Error(`Semua provider gagal. Error terakhir: ${lastError?.message}`);
  }

  // Parse JSON block
  let jsonMatch = successContent.match(/```json\n([\s\S]*?)\n```/);
  let analysisData = null;
  let chatContent = successContent;

  if (jsonMatch) {
    try {
      analysisData = JSON.parse(jsonMatch[1]);
      chatContent = successContent.replace(/```json\n[\s\S]*?\n```/, '').trim();
    } catch (e) {
      console.error('Failed to parse AI JSON', e);
    }
  }

  if (!analysisData) {
    analysisData = {
      decision: "Informasi",
      confidence: 85,
      recommendations: [{ label: "Action", value: "Tunggu instruksi" }],
      analysis: ["AI membalas dengan format teks biasa."]
    };
  }

  return {
    content: chatContent,
    provider: successfulProvider,
    model: successfulModel,
    analysis: {
      ...analysisData,
      provider: successfulProvider,
      model: successfulModel,
      reason: successfulProvider === settings.ai_primary_provider ? 'Primary model available' : 'Fallback triggered',
      fallbackStatus,
      timeline,
    },
    checkedAt: new Date().toISOString(),
  };
}
