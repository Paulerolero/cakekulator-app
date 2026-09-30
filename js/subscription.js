// ==========================================
// Cakekulator - Módulo de Suscripción PRO & Google Play Billing
// ==========================================

const SubscriptionModule = {
  // Configuración de Límites para el Plan Gratuito
  FREE_LIMITS: {
    MAX_RECIPES: 3,
    MAX_QUOTES: 3,
    CAN_SCAN_RECEIPTS: false,
    CAN_SCAN_RECIPES: false,
    CAN_ACCESS_RADAR: false,
    CAN_EXPORT_PDF: false,
    TRIAL_DAYS: 14
  },

  // Producto en Google Play Console
  PLAY_BILLING_SKU: 'cakekulator_pro_monthly', // ID del producto en Google Play

  // Estado en memoria
  state: {
    isPro: false,
    plan: 'free', // 'free' | 'trial' | 'pro'
    trialStartDate: null,
    trialExpiresDate: null,
    subscriptionExpiryDate: null,
    digitalGoodsAvailable: false
  },

  init() {
    this.loadState();
    this.checkDigitalGoodsService();
    this.renderProBadges();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('cakekulator_subscription');
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      } else {
        // Iniciar período de prueba gratuito de 14 días automáticamente
        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + this.FREE_LIMITS.TRIAL_DAYS);

        this.state.plan = 'trial';
        this.state.isPro = true; // Durante el trial tiene acceso PRO completo
        this.state.trialStartDate = now.toISOString();
        this.state.trialExpiresDate = expires.toISOString();
        this.saveState();
      }

      // Validar si el trial o la suscripción expiró
      this.evaluateAccess();
    } catch (e) {
      console.warn('[Subscription] Error al cargar estado:', e);
    }
  },

  saveState() {
    try {
      localStorage.setItem('cakekulator_subscription', JSON.stringify(this.state));
    } catch (_) {}
  },

  evaluateAccess() {
    const now = new Date();

    if (this.state.plan === 'trial') {
      if (this.state.trialExpiresDate && new Date(this.state.trialExpiresDate) <= now) {
        this.state.plan = 'free';
        this.state.isPro = false;
        this.saveState();
      } else {
        this.state.isPro = true;
      }
    } else if (this.state.plan === 'pro') {
      if (this.state.subscriptionExpiryDate && new Date(this.state.subscriptionExpiryDate) <= now) {
        this.state.plan = 'free';
        this.state.isPro = false;
        this.saveState();
      } else {
        this.state.isPro = true;
      }
    }
  },

  isProActive() {
    this.evaluateAccess();
    return this.state.isPro === true;
  },

  getDaysLeftInTrial() {
    if (this.state.plan !== 'trial' || !this.state.trialExpiresDate) return 0;
    const diff = new Date(this.state.trialExpiresDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  // ==========================================
  // Detección de Google Play Digital Goods API (TWA)
  // ==========================================
  async checkDigitalGoodsService() {
    if ('getDigitalGoodsService' in window) {
      try {
        const service = await window.getDigitalGoodsService('https://play.google.com/billing');
        if (service) {
          this.state.digitalGoodsAvailable = true;
          this.digitalGoodsService = service;
          this.checkPlayBillingPurchases();
        }
      } catch (err) {
        console.log('[Subscription] Digital Goods API no disponible en este entorno:', err.message);
      }
    }
  },

  // Consultar si el usuario ya tiene la suscripción activa en Google Play
  async checkPlayBillingPurchases() {
    if (!this.digitalGoodsService) return;
    try {
      const purchases = await this.digitalGoodsService.listPurchases();
      const activeSub = purchases.find(p => p.itemId === this.PLAY_BILLING_SKU && p.purchaseState === 'purchased');
      if (activeSub) {
        this.activatePro('pro', 'Google Play');
      }
    } catch (e) {
      console.warn('[Subscription] Error al verificar compras en Play Billing:', e);
    }
  },

  // ==========================================
  // Flujo de Compra / Suscripción
  // ==========================================
  async requestPlaySubscription() {
    // 1. Si la API de Google Play está disponible (TWA en Android)
    if (this.digitalGoodsService && window.PaymentRequest) {
      try {
        const paymentMethodData = [{
          supportedMethods: 'https://play.google.com/billing',
          data: { sku: this.PLAY_BILLING_SKU }
        }];

        const paymentDetails = {
          total: {
            label: 'Suscripción Cakekulator PRO Mensual',
            amount: { currency: 'CLP', value: '4990' }
          }
        };

        const request = new PaymentRequest(paymentMethodData, paymentDetails);
        const paymentResponse = await request.show();
        const { purchaseToken } = paymentResponse.details;

        await paymentResponse.complete('success');
        this.activatePro('pro', 'Google Play Billing');
        this.closePaywallModal();
        if (typeof App !== 'undefined' && App.triggerCelebration) App.triggerCelebration();
        alert('🎉 ¡Felicidades! Tu suscripción Cakekulator PRO está activa.');
        return;
      } catch (err) {
        console.warn('[Subscription] Pago cancelado o no completado:', err);
      }
    }

    // 2. Fallback para navegador web o si aún no está publicado en Play Store
    this.promptSimulatedOrWebPayment();
  },

  promptSimulatedOrWebPayment() {
    const isLocalOrTest = window.location.hostname.includes('localhost') || window.location.hostname.includes('web.app');
    
    if (confirm('🍰 ¿Deseas activar Cakekulator PRO con Google Play?\n\nAl estar publicado en la Play Store, el cobro se realiza automáticamente con la tarjeta asociada a tu cuenta de Google.\n\n¿Quieres activar una demostración PRO ahora en este dispositivo?')) {
      this.activatePro('pro', 'Google Play Test');
      this.closePaywallModal();
      if (typeof App !== 'undefined' && App.triggerCelebration) App.triggerCelebration();
      if (typeof App !== 'undefined' && App.showToast) App.showToast('✨ ¡Plan PRO Activado con éxito!');
    }
  },

  activatePro(plan = 'pro', provider = 'Manual') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 días de suscripción mensual

    this.state.plan = plan;
    this.state.isPro = true;
    this.state.subscriptionExpiryDate = expires.toISOString();
    this.saveState();
    this.renderProBadges();
  },

  cancelPro() {
    this.state.plan = 'free';
    this.state.isPro = false;
    this.state.subscriptionExpiryDate = null;
    this.saveState();
    this.renderProBadges();
    if (typeof App !== 'undefined' && App.showToast) App.showToast('Suscripción cambiada a modo Gratuito');
  },

  // ==========================================
  // Guardias de Restricción (Verificadores de Límites)
  // ==========================================
  canAddRecipe() {
    if (this.isProActive()) return true;
    const count = (typeof DB !== 'undefined' && DB.getRecipes) ? DB.getRecipes().length : 0;
    if (count >= this.FREE_LIMITS.MAX_RECIPES) {
      this.showPaywallModal({
        feature: 'Recetas y Costeos Ilimitados',
        reason: `El Plan Gratuito te permite hasta ${this.FREE_LIMITS.MAX_RECIPES} recetas guardadas. Actualmente tienes ${count}.`,
        icon: '🎂'
      });
      return false;
    }
    return true;
  },

  canAddQuote() {
    if (this.isProActive()) return true;
    const count = (typeof DB !== 'undefined' && DB.getQuotes) ? DB.getQuotes().length : 0;
    if (count >= this.FREE_LIMITS.MAX_QUOTES) {
      this.showPaywallModal({
        feature: 'Cotizaciones para Clientes Ilimitadas',
        reason: `El Plan Gratuito incluye hasta ${this.FREE_LIMITS.MAX_QUOTES} cotizaciones. Suscríbete para enviar presupuestos sin límites a tus clientes.`,
        icon: '📋'
      });
      return false;
    }
    return true;
  },

  canScanReceipts() {
    if (this.isProActive()) return true;
    this.showPaywallModal({
      feature: 'Escaneo Inteligente de Boletas con IA',
      reason: 'Digitaliza facturas de supermercado e insumos automáticamente con Inteligencia Artificial.',
      icon: '🧾'
    });
    return false;
  },

  canScanRecipes() {
    if (this.isProActive()) return true;
    this.showPaywallModal({
      feature: 'Escaneo de Recetas Manuscritas con IA',
      reason: 'Convierte tus cuadernos de recetas escritas a mano en fichas técnicas con costos automáticos.',
      icon: '📸'
    });
    return false;
  },

  canAccessRadar() {
    if (this.isProActive()) return true;
    this.showPaywallModal({
      feature: 'Radar de Oportunidades & Clientes Cercanos',
      reason: 'Recibe solicitudes de clientes que están buscando pasteles y cotizaciones cerca de tu taller en tiempo real.',
      icon: '📍'
    });
    return false;
  },

  // ==========================================
  // Modal de Venta / Paywall Modal
  // ==========================================
  showPaywallModal({ feature = 'Función PRO', reason = '', icon = '✨' } = {}) {
    let modal = document.getElementById('paywall-subscription-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'paywall-subscription-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }

    const trialDaysLeft = this.getDaysLeftInTrial();
    const isTrial = this.state.plan === 'trial';

    modal.className = 'fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto modal-opening';
    modal.onclick = (e) => {
      if (e.target === modal) SubscriptionModule.closePaywallModal();
    };

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-pink-200 dark:border-slate-800 text-left modal-animate-in space-y-4 my-auto">
        
        <!-- Header con Insignia Pro -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md">
              👑
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-black text-lg text-gray-900 dark:text-white">Cakekulator PRO</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-pink-500 text-white uppercase tracking-wider">
                  Google Play
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Potencia tu pastelería con herramientas profesionales</p>
            </div>
          </div>
          <button type="button" onclick="SubscriptionModule.closePaywallModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full text-xl cursor-pointer">✕</button>
        </div>

        <!-- Banner de la característica bloqueada -->
        <div class="p-3.5 rounded-2xl bg-pink-50/80 dark:bg-pink-950/30 border border-pink-200/80 dark:border-pink-800/50 flex items-center gap-3">
          <span class="text-2xl">${icon}</span>
          <div class="min-w-0">
            <h4 class="font-extrabold text-xs text-pink-900 dark:text-pink-200">${feature}</h4>
            <p class="text-[11px] text-pink-700/90 dark:text-pink-300">${reason}</p>
          </div>
        </div>

        <!-- Lista de Beneficios PRO -->
        <div class="space-y-2 py-1">
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">Todo lo que incluye el Plan PRO:</span>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Recetas Ilimitadas</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Cotizaciones Ilimitadas</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Escaneo de Boletas (IA)</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Escaneo de Recetas (IA)</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Radar de Oportunidades</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="font-bold text-gray-800 dark:text-slate-200">Sincronización en la Nube</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta de Precio & Botón de Google Pay -->
        <div class="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-slate-900 text-white shadow-xl space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] text-pink-400 uppercase font-black tracking-wider block">Suscripción Mensual</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl sm:text-3xl font-black">$4.990</span>
                <span class="text-xs text-gray-400">CLP / mes</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Cancela cuando quieras
              </span>
              <span class="text-[10px] text-gray-400 block mt-1">Sin contratos forzosos</span>
            </div>
          </div>

          <button 
            type="button" 
            onclick="SubscriptionModule.requestPlaySubscription()"
            class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white font-black text-sm shadow-lg shadow-pink-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💳</span> <span>Suscribirse con Google Play</span>
          </button>

          <p class="text-[10px] text-center text-gray-400 leading-tight">
            Procesado con total seguridad por Google Play Billing. Podrás gestionar o cancelar tu suscripción en cualquier momento desde Google Play Store > Pagos y suscripciones.
          </p>
        </div>

      </div>
    `;

    if (typeof App !== 'undefined' && App.openModal) {
      App.openModal('paywall-subscription-modal');
    } else {
      modal.classList.remove('hidden');
    }
  },

  closePaywallModal() {
    if (typeof App !== 'undefined' && App.closeModal) {
      App.closeModal('paywall-subscription-modal');
    } else {
      const modal = document.getElementById('paywall-subscription-modal');
      if (modal) modal.classList.add('hidden');
    }
  },

  // Insignia en Header y Menús
  renderProBadges() {
    const isPro = this.isProActive();
    const badges = document.querySelectorAll('.subscription-status-badge');
    badges.forEach(b => {
      if (isPro) {
        b.innerHTML = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-xs">
            <span>👑</span> PRO
          </span>
        `;
      } else {
        b.innerHTML = `
          <button type="button" onclick="SubscriptionModule.showPaywallModal()" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-pink-100 transition cursor-pointer">
            <span>⭐</span> Pasar a PRO
          </button>
        `;
      }
    });
  }
};

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SubscriptionModule.init();
  });
}
