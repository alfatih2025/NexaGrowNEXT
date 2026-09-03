import { requireApiAuth, authError } from '../lib/apiHelpers/_auth.js';
import {
  getDailyHistory,
  getYesterdayHistory,
  saveDailyHistory,
  formatHistoryForDisplay,
  getMessagesForDate,
} from '../lib/apiHelpers/chatDailyHistory.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!requireApiAuth(req, res)) return;

  try {
    // GET /api/chat-daily-history
    // Get history untuk tanggal tertentu atau hari ini
    if (req.method === 'GET') {
      const { date, target = 'today' } = req.query;
      // Normalize target — strip any suffix like ":1" (e.g. "yesterday:1" → "yesterday")
      const normalizedTarget = (target || 'today').split(':')[0].trim().toLowerCase();

      let history = null;

      if (normalizedTarget === 'yesterday') {
        history = await getYesterdayHistory();
      } else if (date) {
        history = await getDailyHistory(date);
      } else {
        history = await getDailyHistory();
      }

      if (!history) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'Belum ada history untuk tanggal ini',
        });
      }

      const formattedHistory = formatHistoryForDisplay(history);

      return res.status(200).json({
        success: true,
        data: formattedHistory,
        raw: history, // Jika ingin data mentah
      });
    }

    // POST /api/chat-daily-history
    // Simpan atau generate daily history
    if (req.method === 'POST') {
      const { date, overrideData } = req.body || {};

      const savedHistory = await saveDailyHistory(date, overrideData);

      if (!savedHistory) {
        return res.status(400).json({
          error: 'Gagal menyimpan daily history',
          data: null,
        });
      }

      const formattedHistory = formatHistoryForDisplay(savedHistory);

      return res.status(201).json({
        success: true,
        message: 'Daily history berhasil disimpan',
        data: formattedHistory,
      });
    }

    // PUT /api/chat-daily-history
    // Update history tertentu
    if (req.method === 'PUT') {
      const { date, summary_text, recommendations, ai_insights } = req.body || {};

      if (!date) {
        return res.status(400).json({ error: 'Date diperlukan' });
      }

      // Ambil history yang ada
      const existingHistory = await getDailyHistory(date);
      if (!existingHistory) {
        return res.status(404).json({ error: 'History untuk tanggal tersebut tidak ditemukan' });
      }

      // Update data
      const updatedData = {
        ...existingHistory,
        summary_text: summary_text || existingHistory.summary_text,
        recommendations: recommendations || existingHistory.recommendations,
        ai_insights: ai_insights || existingHistory.ai_insights,
      };

      const savedHistory = await saveDailyHistory(date, updatedData);

      if (!savedHistory) {
        return res.status(400).json({
          error: 'Gagal mengupdate daily history',
          data: null,
        });
      }

      const formattedHistory = formatHistoryForDisplay(savedHistory);

      return res.status(200).json({
        success: true,
        message: 'Daily history berhasil diupdate',
        data: formattedHistory,
      });
    }

    // DELETE /api/chat-daily-history
    // Hapus history tertentu
    if (req.method === 'DELETE') {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date parameter diperlukan' });
      }

      // Di Supabase, gunakan delete
      const dateStr = new Date(date).toISOString().split('T')[0];

      const supabase = (await import('../lib/apiHelpers/_supabase.js')).default;
      const { error } = await supabase
        .from('chat_daily_history')
        .delete()
        .eq('history_date', dateStr);

      if (error) {
        return res.status(400).json({
          error: 'Gagal menghapus daily history',
          details: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Daily history berhasil dihapus',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in chat-daily-history handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
