// ==========================================
// Cakekulator - Módulo Frontend de WhatsApp Bot Multi-Usuario
// ==========================================

const WhatsAppBotModule = {
  serverUrl: 'http://localhost:3001',
  status: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
  qrCode: null,
  phoneNumber: null,
  autoReply: true,
  eventSource: null,
  activityLogs: [],
  isSimulating: false,

  init() {
    this.render();
    if (typeof AuthModule !== 'undefined' && AuthModule.currentUser) {
      this.initEventListener();
      this.syncCatalogToServer();
    }
  },

  getServerUrl() {
    const settings = DB.getSettings();
    return settings.whatsappServerUrl || this.serverUrl;
  },

  setServerUrl(url) {
    const settings = DB.getSettings();
    settings.whatsappServerUrl = (url || '').trim();
    DB.saveSettings(settings);
    this.serverUrl = settings.whatsappServerUrl || 'http://localhost:3001';
    this.initEventListener();
    this.render();
  },

  getUserId() {
    if (typeof AuthModule !== 'undefined' && AuthModule.currentUser) {
      return AuthModule.currentUser.uid;
    }
    return null;
  },

  /**
   * Conectar con el flujo de eventos Server-Sent Events (SSE) del servidor
   */
  initEventListener() {
    const uid = this.getUserId();
    if (!uid) return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const url = `${this.getServerUrl()}/api/whatsapp/events?uid=${encodeURIComponent(uid)}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (e) {
          console.warn('[WhatsAppBot] Error parseando evento SSE:', e);
        }
      };

      this.eventSource.onerror = (err) => {
        console.warn('[WhatsAppBot] Error en conexión SSE con servidor de WhatsApp (¿servidor iniciado?):', err);
      };
    } catch (e) {
      console.error('[WhatsAppBot] No se pudo inicializar SSE:', e);
    }
  },

  handleServerEvent(data) {
    console.log('[WhatsAppBot] ⚡ Evento recibido del servidor:', data);

    if (data.type === 'status' || data.type === 'qr') {
      this.status = data.status || this.status;
      this.qrCode = data.qrCode !== undefined ? data.qrCode : this.qrCode;
      this.phoneNumber = data.phoneNumber || this.phoneNumber;
      if (data.autoReply !== undefined) this.autoReply = data.autoReply;
      this.render();
    } else if (data.type === 'message_received') {
      this.activityLogs.unshift({
        type: 'received',
        sender: data.customerName ? `${data.customerName} (+${data.customerPhone})` : `+${data.customerPhone}`,
        text: data.messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (this.activityLogs.length > 20) this.activityLogs.pop();
      this.render();
    } else if (data.type === 'message_sent') {
      this.activityLogs.unshift({
        type: 'sent',
        sender: `Bot Cakekulator -> +${data.customerPhone}`,
        text: data.replyText,
        savedQuote: data.savedQuote,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (this.activityLogs.length > 20) this.activityLogs.pop();

      // Si se generó una nueva cotización, notificar al usuario
      if (data.savedQuote && typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 ¡Nueva cotización ${data.savedQuote.code} creada desde WhatsApp!`);
      }
      this.render();
    }
  },

  /**
   * Enviar catálogo actual al servidor de WhatsApp
   */
  async syncCatalogToServer() {
    const uid = this.getUserId();
    if (!uid) return;

    try {
      const settings = DB.getSettings();
      const recipes = DB.getRecipes();
      const quotes = DB.getQuotes();

      await fetch(`${this.getServerUrl()}/api/whatsapp/sync-user-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, settings, recipes, quotes })
      });
      console.log('[WhatsAppBot] 📦 Catálogo sincronizado con el servidor de WhatsApp');
    } catch (e) {
      console.warn('[WhatsAppBot] No se pudo sincronizar catálogo con servidor local:', e.message);
    }
  },

  /**
   * Modal para configurar la URL del Servidor de WhatsApp (Render, Railway, ngrok o Local)
   */
  openServerConfigModal() {
    let modal = document.getElementById('whatsapp-server-config-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'whatsapp-server-config-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }

    const currentUrl = this.getServerUrl();
    const isHttpsDeployment = typeof window !== 'undefined' && window.location.protocol === 'https:';

    modal.className = 'fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-scrollbar';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-emerald-100 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] modal-animate-in">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-xs shrink-0">
              ⚙️
            </div>
            <div>
              <h3 class="font-bold text-base sm:text-lg leading-tight text-white">
                Servidor de WhatsApp Bot
              </h3>
              <p class="text-xs text-emerald-100 mt-0.5">Conexión con el servicio backend de Baileys</p>
            </div>
          </div>
          <button onclick="WhatsAppBotModule.closeServerConfigModal()" class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer text-lg leading-none shrink-0">
            ✕
          </button>
        </div>

        <!-- Contenido -->
        <div class="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          ${isHttpsDeployment ? `
            <div class="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div class="flex items-center gap-2 font-bold">
                <span>⚠️</span>
                <span>Despliegue en la Nube (Vercel / HTTPS)</span>
              </div>
              <p class="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Al estar en Vercel, el navegador requiere que el servidor de WhatsApp use una URL <b>HTTPS</b> (como un despliegue en Render, Railway o un túnel ngrok/Cloudflare), ya que <code>http://localhost:3001</code> solo funciona cuando pruebas en tu propia máquina.
              </p>
            </div>
          ` : ''}

          <div class="space-y-2">
            <label class="block font-bold text-gray-700 dark:text-gray-300 text-xs">URL del Servidor de WhatsApp:</label>
            <input 
              type="url" 
              id="wa-config-server-url" 
              value="${currentUrl}" 
              placeholder="Ej: https://tu-bot.onrender.com o http://localhost:3001"
              class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <!-- Opciones Rápidas -->
          <div class="space-y-2 pt-1">
            <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Preajustes rápidos:</span>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="document.getElementById('wa-config-server-url').value = 'http://localhost:3001'" class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 hover:border-emerald-400 text-left transition text-xs">
                <span class="font-bold block text-gray-900 dark:text-gray-100">💻 Local (Desarrollo)</span>
                <span class="text-[10px] text-gray-400 font-mono">http://localhost:3001</span>
              </button>
              <button type="button" onclick="document.getElementById('wa-config-server-url').value = 'https://cakekulator-whatsapp-bot.onrender.com'" class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 hover:border-emerald-400 text-left transition text-xs">
                <span class="font-bold block text-gray-900 dark:text-gray-100">☁️ Servidor Render</span>
                <span class="text-[10px] text-gray-400 font-mono">https://...onrender.com</span>
              </button>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <span class="font-bold text-gray-800 dark:text-gray-200 block">ℹ️ ¿Cómo desplegar el bot en la nube?</span>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              El bot usa Baileys para mantener una sesión de WhatsApp activa 24/7. Puedes desplegar la carpeta <code>whatsapp-server</code> gratis en <b>Render.com</b> o <b>Railway</b> conectando este repositorio GitHub.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2 shrink-0">
          <button type="button" onclick="WhatsAppBotModule.closeServerConfigModal()" class="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 text-xs cursor-pointer">
            Cancelar
          </button>
          <button type="button" onclick="WhatsAppBotModule.saveServerConfig()" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200/50 text-xs transition cursor-pointer">
            Guardar y Reconectar
          </button>
        </div>

      </div>
    `;
    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeServerConfigModal() {
    const modal = document.getElementById('whatsapp-server-config-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  saveServerConfig() {
    const input = document.getElementById('wa-config-server-url');
    if (input) {
      this.setServerUrl(input.value);
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('✅ Servidor de WhatsApp actualizado');
      }
    }
    this.closeServerConfigModal();
  },

  /**
   * Mostrar modal de error amigable con opciones
   */
  showConnectionErrorModal() {
    let modal = document.getElementById('whatsapp-conn-error-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'whatsapp-conn-error-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }

    const currentUrl = this.getServerUrl();
    modal.className = 'fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-scrollbar';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-rose-100 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] modal-animate-in">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-rose-500 to-pink-600 p-4 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔌</span>
            <div>
              <h3 class="font-bold text-base leading-tight">Servidor de WhatsApp No Disponible</h3>
              <p class="text-[11px] text-rose-100 mt-0.5 font-mono">${currentUrl}</p>
            </div>
          </div>
          <button onclick="document.getElementById('whatsapp-conn-error-modal').classList.add('hidden'); if (App.unlockBodyScroll) App.unlockBodyScroll();" class="text-white/80 hover:text-white p-1 rounded-xl text-base">✕</button>
        </div>

        <div class="p-5 space-y-3 text-xs text-gray-700 dark:text-gray-300 overflow-y-auto flex-1">
          <p class="leading-relaxed">
            No se pudo establecer conexión con el backend de WhatsApp. Esto ocurre habitualmente porque:
          </p>

          <div class="space-y-2">
            <div class="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-1">
              <span class="font-bold text-gray-900 dark:text-gray-100 block">1. Si estás probando en Vercel (Producción):</span>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                Las funciones de Vercel son efímeras (serverless) y no pueden mantener Baileys conectado 24/7. Puedes desplegar <code>whatsapp-server</code> gratis en <b>Render.com</b> o <b>Railway</b> y configurar su URL HTTPS.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-1">
              <span class="font-bold text-gray-900 dark:text-gray-100 block">2. Si estás en local:</span>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                Asegúrate de ejecutar <code>npm start</code> en la carpeta <code>whatsapp-server</code>.
              </p>
            </div>

            <div class="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
              <span class="font-bold text-purple-900 dark:text-purple-300 block">💡 Puedes probar el Simulador sin servidor:</span>
              <p class="text-[11px] text-purple-700 dark:text-purple-400">
                El <b>Simulador de Respuestas</b> funciona directamente en Vercel usando la IA de Gemini con tu catálogo de recetas y precios, sin necesidad de levantar ningún servidor.
              </p>
            </div>
          </div>
        </div>

        <div class="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-2 shrink-0">
          <button 
            type="button" 
            onclick="document.getElementById('whatsapp-conn-error-modal').classList.add('hidden'); WhatsAppBotModule.openServerConfigModal();" 
            class="flex-1 py-2.5 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition text-xs text-center cursor-pointer"
          >
            ⚙️ Configurar URL Servidor
          </button>
          <button 
            type="button" 
            onclick="document.getElementById('whatsapp-conn-error-modal').classList.add('hidden'); if (App.unlockBodyScroll) App.unlockBodyScroll();" 
            class="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition text-center cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    `;
    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  /**
   * Iniciar vinculación (solicitar QR)
   */
  async startSession() {
    const uid = this.getUserId();
    if (!uid) {
      if (typeof AuthModule !== 'undefined') AuthModule.showLoginRequiredModal();
      return;
    }

    this.status = 'connecting';
    this.render();

    try {
      await this.syncCatalogToServer();

      const response = await fetch(`${this.getServerUrl()}/api/whatsapp/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }

      const data = await response.json();
      if (data.qrCode) {
        this.qrCode = data.qrCode;
        this.status = 'qr_ready';
      }
      this.render();
    } catch (error) {
      console.error('[WhatsAppBot] Error al iniciar sesión de WhatsApp:', error);
      this.status = 'disconnected';
      this.render();
      this.showConnectionErrorModal();
    }
  },

  /**
   * Desvincular sesión de WhatsApp
   */
  async logout() {
    const uid = this.getUserId();
    if (!uid) return;

    if (!confirm('¿Estás seguro de desvincular tu número de WhatsApp del bot?')) return;

    try {
      await fetch(`${this.getServerUrl()}/api/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      this.status = 'disconnected';
      this.qrCode = null;
      this.phoneNumber = null;
      this.render();
      if (typeof App !== 'undefined') App.showToast('WhatsApp desvinculado con éxito');
    } catch (error) {
      console.error('[WhatsAppBot] Error al desvincular:', error);
    }
  },

  /**
   * Conmutar auto-respuesta
   */
  async toggleAutoReply() {
    const uid = this.getUserId();
    if (!uid) return;

    const newStatus = !this.autoReply;
    try {
      const response = await fetch(`${this.getServerUrl()}/api/whatsapp/toggle-auto-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, enabled: newStatus })
      });
      const data = await response.json();
      this.autoReply = data.autoReply;
      this.render();
      if (typeof App !== 'undefined') {
        App.showToast(this.autoReply ? '✅ Auto-respuesta de cotizaciones activada' : '⏸️ Auto-respuesta pausada');
      }
    } catch (e) {
      console.error('[WhatsAppBot] Error conmutando auto-respuesta:', e);
    }
  },

  /**
   * Simulación directa y autónoma con Gemini (funciona 100% en Vercel sin backend)
   */
  async simulateDirectlyWithGemini(msgText) {
    const settings = DB.getSettings();
    const recipes = DB.getRecipes();
    const quotes = DB.getQuotes();

    const businessName = settings.businessName || 'Mi Pastelería';
    const depositPercent = settings.defaultDepositPercent || 50;
    const defaultNote = settings.quoteNote || `Para confirmar la fecha se solicita el ${depositPercent}% de abono. Saldo contra entrega.`;
    const businessPhone = settings.businessPhone || '';

    // Preparar catálogo de productos
    const catalogSummary = recipes.map(r => {
      let price = r.sellingPrice || r.suggestedBatchPrice || 0;
      if (!price && r.suggestedUnitPrice) price = r.suggestedUnitPrice;
      return {
        id: r.id,
        name: r.name,
        type: r.type || 'units',
        portionsOrUnits: r.yieldPortions || r.yieldUnits || 1,
        price: price,
        pricePerPortion: r.type === 'cake' && r.yieldPortions ? Math.round(price / r.yieldPortions) : null,
        category: r.category || 'General',
        notes: r.notes || ''
      };
    });

    // Resumen de cotizaciones recientes
    const recentQuotes = quotes.slice(0, 10).map(q => ({
      code: q.code,
      customerName: q.customerName,
      total: q.total,
      depositAmount: q.depositAmount,
      remainingBalance: q.remainingBalance,
      status: q.status,
      eventDate: q.eventDate,
      items: (q.items || []).map(i => `${i.quantity}x ${i.recipeName}`)
    }));

    const prompt = `
Eres la asistente virtual inteligente y cálida de la pastelería "${businessName}".
Tu objetivo es responder de forma cordial, impecable y profesional por WhatsApp a los clientes que solicitan información, cotizaciones de productos de repostería o consultan el estado de su pedido.

--- CATÁLOGO DE PRODUCTOS DE LA PASTELERÍA ---
${JSON.stringify(catalogSummary, null, 2)}

--- POLÍTICAS DEL NEGOCIO ---
- Abono requerido para reserva: ${depositPercent}% del total.
- Saldo: se cancela al momento de la entrega o retiro.
- Nota / Condiciones: "${defaultNote}"
- Teléfono de contacto: "${businessPhone}"

--- COTIZACIONES PREVIAS REGISTRADAS ---
${JSON.stringify(recentQuotes, null, 2)}

--- MENSAJE DEL CLIENTE ---
Cliente: "Cliente Simulado"
Mensaje: "${msgText}"

--- INSTRUCCIONES ---
1. Analiza el mensaje:
   A) Si pide cotización de productos: calcula subtotales, Total general, Abono (${depositPercent}%) y Saldo restante. Redacta la respuesta en formato WhatsApp con negritas (*texto*), viñetas y emojis atractivos.
   B) Si consulta por un folio previo: busca en las cotizaciones previas.
   C) Si saluda o hace preguntas generales: responde amablemente con las opciones del catálogo de "${businessName}".

--- FORMATO ESTRICTO DE SALIDA ---
Devuelve estrictamente un objeto JSON (sin delimitadores de bloque markdown ni texto adicional):
{
  "intent": "quote_request" | "quote_lookup" | "general_inquiry" | "unknown",
  "replyMessage": "Texto formateado en WhatsApp",
  "shouldCreateQuote": true o false,
  "newQuoteData": {
    "customerName": "Cliente Simulado",
    "customerPhone": "+56912345678",
    "items": [
      {
        "recipeId": "id_si_existe_o_custom",
        "recipeName": "Nombre",
        "quantity": 1,
        "unitPrice": 10000,
        "subtotal": 10000
      }
    ],
    "total": 10000,
    "depositPercent": ${depositPercent},
    "depositAmount": 5000,
    "remainingBalance": 5000,
    "notes": "Generado automáticamente por WhatsApp Bot"
  }
}`;

    const rawResponse = await GeminiService.callGeminiText(prompt);
    
    // Limpiar respuesta JSON
    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '');
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '');
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/```$/, '');
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);

    // Si debe crear la cotización, registrarla en la base de datos
    if (parsed.shouldCreateQuote && parsed.newQuoteData && Array.isArray(parsed.newQuoteData.items) && parsed.newQuoteData.items.length > 0) {
      const newQuote = {
        id: 'quote_' + Date.now(),
        code: DB.generateQuoteCode(),
        createdAt: new Date().toISOString(),
        customerName: parsed.newQuoteData.customerName || 'Cliente WhatsApp',
        customerPhone: parsed.newQuoteData.customerPhone || '+56912345678',
        eventDate: parsed.newQuoteData.eventDate || '',
        items: parsed.newQuoteData.items,
        total: parsed.newQuoteData.total || 0,
        depositPercent: parsed.newQuoteData.depositPercent || depositPercent,
        depositAmount: parsed.newQuoteData.depositAmount || 0,
        remainingBalance: parsed.newQuoteData.remainingBalance || 0,
        status: 'pending',
        notes: parsed.newQuoteData.notes || 'Cotización generada desde WhatsApp Bot',
        source: 'whatsapp_bot'
      };

      DB.saveQuote(newQuote);
      parsed.savedQuote = newQuote;
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 ¡Nueva cotización ${newQuote.code} creada desde WhatsApp!`);
      }
    }

    return parsed;
  },

  /**
   * Ejecutar prueba en el simulador de chat (Soporta Servidor o Modo Directo Vercel)
   */
  async runSimulator() {
    const input = document.getElementById('bot-sim-input');
    const msgText = input ? input.value.trim() : '';

    if (!msgText) {
      alert('Por favor ingresa un mensaje de prueba para cotizar.');
      return;
    }

    this.isSimulating = true;
    this.render();

    let data = null;

    try {
      // 1. Intentar primero con el servidor backend si está disponible
      try {
        const response = await fetch(`${this.getServerUrl()}/api/whatsapp/simulate-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: this.getUserId() || 'test_user',
            customerName: 'Cliente Simulado',
            messageText: msgText
          })
        });

        if (response.ok) {
          data = await response.json();
        }
      } catch (backendErr) {
        console.log('[WhatsAppBot] Servidor backend no alcanzable, ejecutando en Modo Directo con Gemini...');
      }

      // 2. Si no hay backend, procesar directamente en el navegador con Gemini IA
      if (!data) {
        data = await this.simulateDirectlyWithGemini(msgText);
      }

      this.isSimulating = false;

      // Registrar en el log de actividad
      this.activityLogs.unshift({
        type: 'received',
        sender: 'Cliente Simulado',
        text: msgText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.activityLogs.unshift({
        type: 'sent',
        sender: 'Bot Cakekulator (Simulación)',
        text: data.replyMessage,
        savedQuote: data.savedQuote,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (this.activityLogs.length > 20) this.activityLogs.pop();

      this.render();

      const resultContainer = document.getElementById('bot-sim-result');
      if (resultContainer) {
        resultContainer.classList.remove('hidden');
        resultContainer.innerHTML = `
          <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 text-xs animate-in fade-in">
            <div class="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
              <span class="flex items-center gap-1.5"><span>🤖</span> Respuesta del Bot (Gemini IA):</span>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 font-mono">Intención: ${data.intent || 'quote_request'}</span>
            </div>
            <div class="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-100 dark:border-slate-700 text-gray-800 dark:text-gray-100 whitespace-pre-wrap font-sans text-xs leading-relaxed shadow-inner">
${data.replyMessage || 'No se obtuvo respuesta'}
            </div>
            ${data.savedQuote ? `
              <div class="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-900 flex items-center justify-between text-xs">
                <span class="font-bold text-pink-800 dark:text-pink-300">🎉 Cotización Guardada en tu Sistema: ${data.savedQuote.code}</span>
                <span class="font-black text-gray-900 dark:text-white">${Calculator.formatCurrency(data.savedQuote.total)}</span>
              </div>
            ` : ''}
          </div>
        `;
      }
    } catch (err) {
      console.error('[WhatsAppBot] Error en simulación:', err);
      this.isSimulating = false;
      this.render();
      alert('Error en simulación con Gemini IA: ' + err.message);
    }
  },

  /**
   * Renderizado de la vista completa
   */
  render() {
    const container = document.getElementById('whatsapp-bot-view');
    if (!container) return;

    const isUserLoggedIn = !!this.getUserId();
    const isConnected = this.status === 'connected';
    const isQrReady = this.status === 'qr_ready';
    const isConnecting = this.status === 'connecting';

    container.innerHTML = `
      <div class="space-y-4 max-w-4xl mx-auto">
        
        <!-- Header del Módulo -->
        <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-600/10 relative overflow-hidden">
          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
                📲
              </div>
              <div>
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 text-[10px] sm:text-[11px] font-bold mb-1 border border-emerald-400/30">
                  <span>✨</span> Inteligencia Artificial + Catálogo Propio
                </div>
                <h2 class="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  WhatsApp Bot de Cotizaciones
                </h2>
                <p class="text-xs text-emerald-100 mt-0.5 leading-snug">
                  Responde consultas de clientes automáticamente con tus recetas, precios y abono del 50%.
                </p>
              </div>
            </div>

            <!-- Estado Badge -->
            <div class="flex items-center gap-2">
              <div class="px-3.5 py-2 rounded-2xl backdrop-blur-md border ${
                isConnected 
                  ? 'bg-emerald-500/40 border-emerald-300 text-white' 
                  : (isQrReady ? 'bg-amber-500/40 border-amber-300 text-amber-100' : 'bg-black/20 border-white/20 text-white/90')
              } text-xs font-bold flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-300 ring-2 ring-white animate-pulse' : (isQrReady ? 'bg-amber-300 animate-ping' : 'bg-red-400')
                }"></span>
                <span>${
                  isConnected 
                    ? `🟢 Conectado (+${this.phoneNumber || ''})` 
                    : (isQrReady ? '🟡 Escanea el código QR' : (isConnecting ? '⏳ Conectando...' : '🔴 Desconectado'))
                }</span>
              </div>
            </div>
          </div>
        </div>

        ${!isUserLoggedIn ? `
          <!-- Alerta de inicio de sesión requerido -->
          <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl shrink-0">🔒</span>
              <div>
                <h4 class="font-bold text-sm">Inicia sesión para vincular tu propio número</h4>
                <p class="text-amber-700 dark:text-amber-300 mt-0.5">Cada pastelero sincroniza su propio WhatsApp personal o de empresa con su catálogo exclusivo.</p>
              </div>
            </div>
            <button onclick="AuthModule.showLoginRequiredModal()" class="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shrink-0 cursor-pointer shadow-xs">
              Iniciar Sesión
            </button>
          </div>
        ` : `
          <!-- Tarjeta de Control y Vinculación -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <!-- Columna Izquierda: Conexión y Código QR (md:col-span-6) -->
            <div class="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                    <span>📱</span> Vinculación de WhatsApp
                  </h3>
                  ${isConnected ? `
                    <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">En Línea</span>
                  ` : ''}
                </div>

                ${!isConnected && !isQrReady && !isConnecting ? `
                  <!-- Estado Inicial Desconectado -->
                  <div class="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-6 text-center border border-dashed border-gray-200 dark:border-slate-700 space-y-3">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                      📲
                    </div>
                    <div>
                      <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm">Vincular tu WhatsApp</h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                        Genera un código QR y escanéalo con tu app de WhatsApp (Dispositivos vinculados).
                      </p>
                    </div>
                    <button onclick="WhatsAppBotModule.startSession()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer flex items-center gap-2 mx-auto">
                      <span>⚡</span> Generar Código QR
                    </button>
                  </div>
                ` : ''}

                ${isConnecting ? `
                  <div class="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-8 text-center space-y-3">
                    <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p class="text-xs font-bold text-gray-700 dark:text-gray-300">Conectando con el servidor de WhatsApp...</p>
                  </div>
                ` : ''}

                ${isQrReady && this.qrCode ? `
                  <!-- Muestra el Código QR en Pantalla -->
                  <div class="bg-emerald-50/60 dark:bg-slate-800/80 rounded-2xl p-4 text-center border border-emerald-200 dark:border-slate-700 space-y-3">
                    <h4 class="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                      Escanea este código con tu WhatsApp
                    </h4>
                    <div class="bg-white p-3 rounded-2xl inline-block shadow-md mx-auto">
                      <img src="${this.qrCode}" alt="WhatsApp QR Code" class="w-48 h-48 mx-auto object-contain rounded-xl">
                    </div>
                    <div class="text-[11px] text-gray-600 dark:text-gray-300 space-y-1 text-left bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl">
                      <p class="font-bold text-emerald-800 dark:text-emerald-400">Instrucciones:</p>
                      <p>1. Abre WhatsApp en tu celular.</p>
                      <p>2. Toca <b>Ajustes (o Menú ⋮)</b> > <b>Dispositivos vinculados</b>.</p>
                      <p>3. Toca <b>Vincular un dispositivo</b> y apunta la cámara a este QR.</p>
                    </div>
                    <button onclick="WhatsAppBotModule.startSession()" class="text-xs text-emerald-700 font-bold hover:underline">
                      🔄 Regenerar QR
                    </button>
                  </div>
                ` : ''}

                ${isConnected ? `
                  <!-- Estado Conectado Exitosamente -->
                  <div class="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
                        ✅
                      </div>
                      <div>
                        <h4 class="font-black text-gray-900 dark:text-gray-100 text-sm">WhatsApp Vinculado</h4>
                        <p class="text-xs text-emerald-700 dark:text-emerald-300 font-mono font-bold">+${this.phoneNumber || 'Número activo'}</p>
                      </div>
                    </div>

                    <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-700 dark:text-gray-300">Auto-responder cotizaciones:</span>
                      <button onclick="WhatsAppBotModule.toggleAutoReply()" class="px-3 py-1.5 rounded-xl font-bold transition ${this.autoReply ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}">
                        ${this.autoReply ? '🟢 Activada' : '⏸️ Pausada'}
                      </button>
                    </div>

                    <button onclick="WhatsAppBotModule.logout()" class="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-xs rounded-xl transition border border-red-200 dark:border-red-900 cursor-pointer">
                      Desvincular mi WhatsApp
                    </button>
                  </div>
                ` : ''}
              </div>

              <!-- Configuración del Servidor y Sincronización Manual -->
              <div class="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500">
                <div class="flex items-center gap-1.5 truncate mr-2">
                  <span>Servidor:</span>
                  <button onclick="WhatsAppBotModule.openServerConfigModal()" class="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline truncate cursor-pointer" title="Cambiar URL del Servidor de WhatsApp">
                    ${this.getServerUrl()} ✏️
                  </button>
                </div>
                <button onclick="WhatsAppBotModule.syncCatalogToServer(); App.showToast('Catálogo sincronizado con el bot ✅');" class="text-pink-600 font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer">
                  <span>🔄</span> Sincronizar
                </button>
              </div>
            </div>

            <!-- Columna Derecha: Simulador de IA y Pruebas (md:col-span-6) -->
            <div class="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-pink-100 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                    <span>🧪</span> Simulador de Respuestas
                  </h3>
                  <span class="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md font-bold">Prueba sin enviar mensajes</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Escribe una consulta como si fueras un cliente para probar cómo responderá el bot con tu catálogo actual.
                </p>

                <div class="space-y-2">
                  <textarea 
                    id="bot-sim-input" 
                    rows="3" 
                    placeholder="Ej: Hola! Cuánto sale una torta para 20 personas y 30 alfajores para este sábado?"
                    class="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-pink-400"
                  >Hola, quiero cotizar una torta para 15 personas y una docena de alfajores por favor</textarea>

                  <button 
                    onclick="WhatsAppBotModule.runSimulator()" 
                    ${this.isSimulating ? 'disabled' : ''} 
                    class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    ${this.isSimulating ? `
                      <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Consultando Gemini IA...</span>
                    ` : `
                      <span>✨ Probar Respuesta del Bot</span>
                    `}
                  </button>
                </div>

                <!-- Contenedor del resultado simulado -->
                <div id="bot-sim-result" class="mt-3 hidden"></div>
              </div>
            </div>

          </div>

          <!-- Registro de Mensajes y Cotizaciones en Vivo -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-pink-100 dark:border-slate-800 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                <span>💬</span> Actividad de WhatsApp en Vivo
              </h3>
              <span class="text-[11px] text-gray-400">Últimos mensajes recibidos y respuestas enviadas</span>
            </div>

            ${this.activityLogs.length === 0 ? `
              <div class="py-8 text-center text-gray-400 text-xs">
                <span class="text-2xl block mb-1">📭</span>
                No hay actividad reciente en WhatsApp. Cuando un cliente te escriba, verás la interacción aquí en tiempo real.
              </div>
            ` : `
              <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                ${this.activityLogs.map(log => `
                  <div class="p-3 rounded-2xl text-xs border ${
                    log.type === 'received' 
                      ? 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200' 
                      : 'bg-emerald-50/70 dark:bg-slate-800 border-emerald-100 dark:border-slate-700 text-emerald-900 dark:text-emerald-200'
                  }">
                    <div class="flex items-center justify-between text-[10px] text-gray-400 mb-1 font-semibold">
                      <span>${log.type === 'received' ? '📥 Mensaje de Cliente' : '📤 Respuesta del Bot'} (${log.sender})</span>
                      <span>${log.time}</span>
                    </div>
                    <div class="whitespace-pre-wrap font-sans leading-relaxed">${log.text}</div>
                    ${log.savedQuote ? `
                      <div class="mt-2 pt-2 border-t border-emerald-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-pink-700 dark:text-pink-300">
                        <span>📋 Guardada como cotización ${log.savedQuote.code}</span>
                        <span>${Calculator.formatCurrency(log.savedQuote.total)}</span>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        `}

      </div>
    `;
  }
};
