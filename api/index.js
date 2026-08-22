// Unified API Router — satu-satunya Serverless Function di Vercel
// Semua logic handler ada di src/api-routes/

import sensorHandler from '../src/api-routes/sensor.js';
import alertsHandler from '../src/api-routes/alerts.js';
import chatHandler from '../src/api-routes/chat.js';
import controlHandler from '../src/api-routes/control.js';
import deviceStatusHandler from '../src/api-routes/device-status.js';
import exportHandler from '../src/api-routes/export.js';
import logsHandler from '../src/api-routes/logs.js';
import openrouterHandler from '../src/api-routes/openrouter.js';
import airouterHandler from '../src/api-routes/airouter.js';
import settingsHandler from '../src/api-routes/settings.js';
import weatherHandler from '../src/api-routes/weather.js';
import weatherLocationsHandler from '../src/api-routes/weather-locations.js';

const routes = {
  'sensor': sensorHandler,
  'sensor-data': sensorHandler,
  'alerts': alertsHandler,
  'chat': chatHandler,
  'control': controlHandler,
  'device-status': deviceStatusHandler,
  'export': exportHandler,
  'logs': logsHandler,
  'openrouter': openrouterHandler,
  'airouter': airouterHandler,
  'settings': settingsHandler,
  'weather': weatherHandler,
  'weather-locations': weatherLocationsHandler,
};

export default async function handler(req, res) {
  // Parse route name from URL: /api/sensor -> "sensor", /api/device-status -> "device-status"
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathSegments = url.pathname.replace(/^\/api\/?/, '').split('/');
  const routeName = pathSegments[0] || '';

  const routeHandler = routes[routeName];

  if (!routeHandler) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(404).json({ error: `API route /api/${routeName} not found` });
  }

  // Ensure query params are parsed (Vercel usually provides req.query already)
  if (!req.query || Object.keys(req.query).length === 0) {
    const query = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    req.query = query;
  }

  try {
    await routeHandler(req, res);
  } catch (err) {
    console.error(`[API Router] Error in /api/${routeName}:`, err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' });
    }
  }
}
