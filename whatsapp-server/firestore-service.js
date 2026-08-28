import { CONFIG } from './config.js';

/**
 * Servicio para consultar y actualizar datos de Firestore por UID de usuario
 */
export class FirestoreService {
  constructor(projectId = CONFIG.FIREBASE_PROJECT_ID) {
    this.projectId = projectId;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    this.cache = new Map(); // Cache temporal por usuario: uid -> { settings, recipes, quotes, lastUpdated }
  }

  // Convierte un documento de Firestore REST API a un objeto JavaScript estándar
  static parseFirestoreDoc(doc) {
    if (!doc || !doc.fields) return null;
    const result = {};

    const parseValue = (field) => {
      if ('stringValue' in field) return field.stringValue;
      if ('integerValue' in field) return parseInt(field.integerValue, 10);
      if ('doubleValue' in field) return parseFloat(field.doubleValue);
      if ('booleanValue' in field) return field.booleanValue;
      if ('timestampValue' in field) return field.timestampValue;
      if ('nullValue' in field) return null;
      if ('arrayValue' in field) {
        return (field.arrayValue.values || []).map(parseValue);
      }
      if ('mapValue' in field) {
        const obj = {};
        for (const [k, v] of Object.entries(field.mapValue.fields || {})) {
          obj[k] = parseValue(v);
        }
        return obj;
      }
      return null;
    };

    for (const [k, v] of Object.entries(doc.fields)) {
      result[k] = parseValue(v);
    }
    return result;
  }

  // Convierte un objeto JS a fields de Firestore REST
  static toFirestoreFields(obj) {
    const encodeValue = (val) => {
      if (val === null || val === undefined) return { nullValue: null };
      if (typeof val === 'string') return { stringValue: val };
      if (typeof val === 'boolean') return { booleanValue: val };
      if (typeof val === 'number') {
        return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
      }
      if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(encodeValue) } };
      }
      if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) {
          fields[k] = encodeValue(v);
        }
        return { mapValue: { fields } };
      }
      return { stringValue: String(val) };
    };

    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = encodeValue(v);
    }
    return fields;
  }

  /**
   * Actualiza el cache en memoria desde la app web directamente
   */
  updateUserCache(uid, { settings, recipes, quotes }) {
    if (!uid) return;
    const existing = this.cache.get(uid) || {};
    this.cache.set(uid, {
      ...existing,
      settings: settings || existing.settings || null,
      recipes: recipes || existing.recipes || [],
      quotes: quotes || existing.quotes || [],
      lastUpdated: Date.now()
    });
  }

  /**
   * Obtiene un documento de la subcolección `users/{uid}/data/{docId}`
   */
  async getUserDocument(uid, docId) {
    try {
      const url = `${this.baseUrl}/users/${uid}/data/${docId}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        console.warn(`[FirestoreService] Status ${response.status} al leer ${docId} de ${uid}`);
        return null;
      }
      const data = await response.json();
      const parsed = FirestoreService.parseFirestoreDoc(data);
      return parsed ? parsed.data : null;
    } catch (error) {
      console.error(`[FirestoreService] Error al obtener ${docId} para ${uid}:`, error.message);
      return null;
    }
  }

  /**
   * Obtiene todos los datos relevantes del usuario para el bot
   */
  async getUserData(uid) {
    const cached = this.cache.get(uid);
    // Si tenemos cache fresco (menos de 60 segundos), usarlo
    if (cached && (Date.now() - cached.lastUpdated < 60000)) {
      return cached;
    }

    try {
      const [settings, recipes, quotes] = await Promise.all([
        this.getUserDocument(uid, 'settings'),
        this.getUserDocument(uid, 'recipes'),
        this.getUserDocument(uid, 'quotes')
      ]);

      const userData = {
        settings: settings || cached?.settings || { businessName: 'Mi Pastelería', quoteNote: '50% de abono para reserva' },
        recipes: recipes || cached?.recipes || [],
        quotes: quotes || cached?.quotes || [],
        lastUpdated: Date.now()
      };

      this.cache.set(uid, userData);
      return userData;
    } catch (e) {
      console.error(`[FirestoreService] Error al cargar datos para ${uid}:`, e.message);
      return cached || { settings: null, recipes: [], quotes: [] };
    }
  }

  /**
   * Guarda una nueva cotización generada por el bot en Firestore
   */
  async saveGeneratedQuote(uid, newQuote) {
    try {
      // 1. Actualizar lista de cotizaciones del usuario
      const userData = await this.getUserData(uid);
      const existingQuotes = Array.isArray(userData.quotes) ? [...userData.quotes] : [];
      
      existingQuotes.unshift(newQuote);
      userData.quotes = existingQuotes;
      this.cache.set(uid, userData);

      // 2. Guardar en Firestore
      const url = `${this.baseUrl}/users/${uid}/data/quotes`;
      const payload = {
        fields: {
          data: {
            arrayValue: {
              values: existingQuotes.map(q => ({
                mapValue: { fields: FirestoreService.toFirestoreFields(q) }
              }))
            }
          },
          updatedAt: { integerValue: Date.now().toString() }
        }
      };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`[FirestoreService] ✅ Cotización ${newQuote.code} guardada en Firestore para usuario ${uid}`);
        return true;
      } else {
        console.warn(`[FirestoreService] Aviso al guardar cotización (${res.status}):`, await res.text());
        return false;
      }
    } catch (err) {
      console.error(`[FirestoreService] Error guardando cotización para ${uid}:`, err.message);
      return false;
    }
  }
}
