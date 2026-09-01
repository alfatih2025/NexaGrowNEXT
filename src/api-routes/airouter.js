import { requireApiAuth } from '../lib/apiHelpers/_auth.js';
import { getAiRouterStatus, sendAiRouterMessage, isArduinoFormulaRequest, buildFormulaReference } from '../lib/apiHelpers/_airouter.js';
import supabase from '../lib/apiHelpers/_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiAuth(req, res)) return;

  if (req.method === 'GET') {
    const status = await getAiRouterStatus(req.headers.origin);
    return res.status(status.ok ? 200 : 503).json(status);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, images = [], history = [], sensorContext = null, aiSettings = null } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (isArduinoFormulaRequest(message)) {
      const formulaContent = [
        '## Rumus Arduino NexaGrow',
        '',
        buildFormulaReference(),
      ].join('\n');
      return res.status(200).json({
        content: formulaContent,
        model: 'local-formula-response',
        provider: 'local',
        checkedAt: new Date().toISOString(),
      });
    }

    const result = await sendAiRouterMessage({
      message,
      images,
      history,
      sensorContext,
      aiSettings,
      origin: req.headers.origin,
    });

    try {
      const user_id = req.body?.user_id || 'user_001';
      await supabase.from('chat_messages').insert({
        user_id,
        role: 'user',
        content: message,
        metadata: { role: 'user', sensor_snapshot: sensorContext, settings_snapshot: aiSettings }
      });
      await supabase.from('chat_messages').insert({
        user_id: 'assistant_001',
        role: 'assistant',
        content: result.content || '',
        metadata: { role: 'assistant', analysis: result.analysis }
      });
    } catch (dbError) {
      console.error('Failed to save message to Supabase:', dbError);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown AI Router error',
    });
  }
}
