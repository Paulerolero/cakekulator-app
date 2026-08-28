import express from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { FirestoreService } from './firestore-service.js';
import { QuoteBotEngine } from './quote-bot-engine.js';
import { SessionManager } from './session-manager.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Inicialización de Servicios
const firestoreService = new FirestoreService();
const quoteBotEngine = new QuoteBotEngine(firestoreService);
const sessionManager = new SessionManager(quoteBotEngine);

// ----------------------------------------------------
// Endpoints de la API REST para Cakekulator
// ----------------------------------------------------

/**
 * Healthcheck
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cakekulator WhatsApp Bot Server',
    timestamp: new Date().toISOString()
  });
});

/**
 * Obtener estado de la sesión de WhatsApp de un usuario
 */
app.get('/api/whatsapp/status', (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    return res.status(400).json({ error: 'UID de usuario requerido' });
  }
  const status = sessionManager.getStatus(uid);
  res.json(status);
});

/**
 * Iniciar / Reconectar sesión de WhatsApp para un usuario
 */
app.post('/api/whatsapp/start', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID de usuario requerido' });
  }

  try {
    const result = await sessionManager.startSession(uid);
    res.json(result);
  } catch (error) {
    console.error(`[Server] Error al iniciar sesión para ${uid}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cerrar sesión y desvincular WhatsApp
 */
app.post('/api/whatsapp/logout', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID de usuario requerido' });
  }

  try {
    const result = await sessionManager.logout(uid);
    res.json(result);
  } catch (error) {
    console.error(`[Server] Error al cerrar sesión para ${uid}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activar o pausar auto-respuesta
 */
app.post('/api/whatsapp/toggle-auto-reply', (req, res) => {
  const { uid, enabled } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID de usuario requerido' });
  }

  const updated = sessionManager.setAutoReply(uid, enabled);
  res.json({ autoReply: updated });
});

/**
 * Sincronizar catálogo y ajustes locales desde la app web al servidor
 */
app.post('/api/whatsapp/sync-user-data', (req, res) => {
  const { uid, settings, recipes, quotes } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID de usuario requerido' });
  }

  firestoreService.updateUserCache(uid, { settings, recipes, quotes });
  res.json({ success: true, message: 'Datos sincronizados en el servidor de WhatsApp' });
});

/**
 * Simulador de chat / prueba de respuesta con IA
 */
app.post('/api/whatsapp/simulate-chat', async (req, res) => {
  const { uid, messageText, customerName } = req.body;
  if (!uid || !messageText) {
    return res.status(400).json({ error: 'UID y messageText son requeridos' });
  }

  try {
    const result = await quoteBotEngine.processIncomingMessage({
      uid,
      customerPhone: '56912345678',
      customerName: customerName || 'Cliente de Prueba',
      messageText
    });
    res.json(result);
  } catch (error) {
    console.error('[Server] Error en simulación:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Transmisión en tiempo real vía Server-Sent Events (SSE)
 * Envía QR codes, cambios de estado y registro de mensajes en vivo al navegador
 */
app.get('/api/whatsapp/events', (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    return res.status(400).send('UID requerido');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const unsubscribe = sessionManager.subscribe(uid, (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Iniciar Servidor
const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🍰 Cakekulator - WhatsApp Bot Multi-Usuario Iniciado`);
  console.log(`📡 Servidor escuchando en: http://localhost:${PORT}`);
  console.log(`🤖 Modelo IA: ${CONFIG.GEMINI_MODEL}`);
  console.log('====================================================');
});
