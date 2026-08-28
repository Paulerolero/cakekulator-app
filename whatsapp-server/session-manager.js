import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export class SessionManager {
  constructor(quoteBotEngine) {
    this.quoteBotEngine = quoteBotEngine;
    this.sessions = new Map(); // uid -> { sock, status, qrCode, phoneNumber, autoReply: true, eventListeners: [] }
    this.ensureSessionsDir();
  }

  ensureSessionsDir() {
    if (!fs.existsSync(CONFIG.SESSIONS_DIR)) {
      fs.mkdirSync(CONFIG.SESSIONS_DIR, { recursive: true });
    }
  }

  getUserSessionDir(uid) {
    // Sanitizar UID para path seguro
    const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(CONFIG.SESSIONS_DIR, `user_${safeUid}`);
  }

  /**
   * Suscribe un callback a los eventos de una sesión (para Server-Sent Events / UI)
   */
  subscribe(uid, listener) {
    if (!this.sessions.has(uid)) {
      this.sessions.set(uid, {
        sock: null,
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        autoReply: true,
        eventListeners: []
      });
    }
    const session = this.sessions.get(uid);
    session.eventListeners.push(listener);

    // Enviar estado inicial inmediato
    listener({
      type: 'status',
      status: session.status,
      qrCode: session.qrCode,
      phoneNumber: session.phoneNumber,
      autoReply: session.autoReply
    });

    return () => {
      session.eventListeners = session.eventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifica a todos los escuchas de un usuario
   */
  emit(uid, eventData) {
    const session = this.sessions.get(uid);
    if (session && session.eventListeners) {
      session.eventListeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (e) {
          console.warn(`[SessionManager] Error en listener para ${uid}:`, e.message);
        }
      });
    }
  }

  /**
   * Inicia o reconecta una sesión de WhatsApp para un usuario
   */
  async startSession(uid) {
    if (!uid) throw new Error('UID requerido para iniciar sesión');

    let session = this.sessions.get(uid);
    if (!session) {
      session = {
        sock: null,
        status: 'connecting',
        qrCode: null,
        phoneNumber: null,
        autoReply: true,
        eventListeners: []
      };
      this.sessions.set(uid, session);
    }

    // Si ya está conectado, no reiniciar
    if (session.sock && session.status === 'connected') {
      console.log(`[SessionManager] Sesión para ${uid} ya está activa y conectada.`);
      return { status: 'connected', phoneNumber: session.phoneNumber };
    }

    const sessionDir = this.getUserSessionDir(uid);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    session.status = 'connecting';
    this.emit(uid, { type: 'status', status: 'connecting', qrCode: null });

    const logger = pino({ level: 'silent' }); // Nivel silencioso para evitar flood en consola

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['Cakekulator Pastelería', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      defaultQueryTimeoutMs: 60000
    });

    session.sock = sock;

    // Guardar credenciales al actualizarse
    sock.ev.on('creds.update', saveCreds);

    // Manejar eventos de conexión y QR
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          session.qrCode = qrDataUrl;
          session.status = 'qr_ready';
          console.log(`[SessionManager] 📱 Nuevo QR generado para usuario ${uid}`);
          this.emit(uid, {
            type: 'qr',
            status: 'qr_ready',
            qrCode: qrDataUrl
          });
        } catch (qrErr) {
          console.error('[SessionManager] Error generando QR DataURL:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[SessionManager] Conexión cerrada para ${uid}. Razón: ${statusCode}, Reintentar: ${shouldReconnect}`);

        session.status = 'disconnected';
        session.qrCode = null;
        session.sock = null;

        if (statusCode === DisconnectReason.loggedOut) {
          // Si el usuario cerró sesión desde el teléfono, limpiar carpeta
          try {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          } catch (e) {}
          this.emit(uid, { type: 'status', status: 'logged_out', qrCode: null });
        } else if (shouldReconnect) {
          this.emit(uid, { type: 'status', status: 'reconnecting', qrCode: null });
          setTimeout(() => this.startSession(uid), 3000);
        } else {
          this.emit(uid, { type: 'status', status: 'disconnected', qrCode: null });
        }
      } else if (connection === 'open') {
        const userJid = sock.user?.id || '';
        const phone = userJid.split(':')[0] || userJid.split('@')[0];
        session.status = 'connected';
        session.qrCode = null;
        session.phoneNumber = phone;
        console.log(`[SessionManager] 🟢 WhatsApp conectado con éxito para ${uid} (${phone})`);

        this.emit(uid, {
          type: 'status',
          status: 'connected',
          phoneNumber: phone,
          qrCode: null
        });
      }
    });

    // Manejar mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const message = m.messages?.[0];
        if (!message || message.key.fromMe || message.key.remoteJid === 'status@broadcast') return;

        const fromJid = message.key.remoteJid;
        const isGroup = fromJid.endsWith('@g.us');
        if (isGroup) return; // Ignorar grupos por defecto

        const customerPhone = fromJid.split('@')[0];
        const customerName = message.pushName || 'Cliente';

        // Extraer texto del mensaje
        const messageText = message.message?.conversation ||
                            message.message?.extendedTextMessage?.text ||
                            message.message?.imageMessage?.caption || '';

        if (!messageText || messageText.trim().length === 0) return;

        console.log(`[SessionManager] 💬 Mensaje recibido de +${customerPhone} para pastelería (${uid}): "${messageText}"`);

        this.emit(uid, {
          type: 'message_received',
          customerPhone,
          customerName,
          messageText,
          timestamp: new Date().toISOString()
        });

        // Verificar si auto-respuesta está habilitada
        if (!session.autoReply) {
          console.log(`[SessionManager] Auto-respuesta pausada para ${uid}. Mensaje no respondido automáticamente.`);
          return;
        }

        // Simular presencia de "Escribiendo..."
        await sock.sendPresenceUpdate('composing', fromJid).catch(() => {});

        // Procesar con el motor de IA
        const result = await this.quoteBotEngine.processIncomingMessage({
          uid,
          customerPhone,
          customerName,
          messageText
        });

        await sock.sendPresenceUpdate('paused', fromJid).catch(() => {});

        if (result && result.replyMessage) {
          // Enviar respuesta por WhatsApp
          await sock.sendMessage(fromJid, { text: result.replyMessage });
          console.log(`[SessionManager] ✅ Respuesta enviada a +${customerPhone}`);

          this.emit(uid, {
            type: 'message_sent',
            customerPhone,
            replyText: result.replyMessage,
            savedQuote: result.savedQuote,
            timestamp: new Date().toISOString()
          });
        }
      } catch (msgErr) {
        console.error('[SessionManager] Error procesando mensaje entrante:', msgErr);
      }
    });

    return { status: session.status, qrCode: session.qrCode };
  }

  /**
   * Cierra sesión de WhatsApp y borra credenciales locales
   */
  async logout(uid) {
    const session = this.sessions.get(uid);
    if (session && session.sock) {
      try {
        await session.sock.logout();
      } catch (e) {}
      session.sock = null;
      session.status = 'disconnected';
      session.qrCode = null;
      session.phoneNumber = null;
    }

    const sessionDir = this.getUserSessionDir(uid);
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn(`[SessionManager] Aviso al borrar sesión ${uid}:`, e.message);
    }

    this.emit(uid, { type: 'status', status: 'disconnected', qrCode: null, phoneNumber: null });
    return { success: true };
  }

  /**
   * Cambia el estado de auto-respuesta (activada / pausada)
   */
  setAutoReply(uid, enabled) {
    const session = this.sessions.get(uid);
    if (session) {
      session.autoReply = !!enabled;
      this.emit(uid, { type: 'config', autoReply: session.autoReply });
      return session.autoReply;
    }
    return false;
  }

  /**
   * Obtiene el estado actual de la sesión
   */
  getStatus(uid) {
    const session = this.sessions.get(uid);
    if (!session) {
      return {
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        autoReply: true
      };
    }
    return {
      status: session.status,
      qrCode: session.qrCode,
      phoneNumber: session.phoneNumber,
      autoReply: session.autoReply
    };
  }
}
