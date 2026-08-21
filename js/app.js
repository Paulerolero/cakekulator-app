// ==========================================
// Cakekulator - Controlador Principal y Navegación
// ==========================================

const App = {
  currentTab: 'dashboard',
  deferredPrompt: null, // Para el banner de instalación PWA

  init() {
    // Inicializar base de datos local
    DB.init();

    // Registrar Service Worker para PWA Offline
    this.registerServiceWorker();

    // Eventos de instalación PWA
    this.initPWAInstall();

    // Escuchar estado de conexión (Online / Offline)
    this.initNetworkStatus();

    // Renderizar pestaña inicial
    this.switchTab('dashboard');

    console.log('Cakekulator cargado correctamente.');
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // Ocultar todas las vistas
    const views = ['dashboard-view', 'recipes-view', 'simulator-view', 'quotes-view', 'ingredients-view', 'receipts-view', 'settings-view'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    // Mostrar la vista activa
    const activeView = document.getElementById(`${tabName}-view`);
    if (activeView) activeView.classList.remove('hidden');

    // Actualizar estilos de los botones de navegación (desktop y móvil)
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const btnTab = btn.dataset.tab;
      if (btnTab === tabName) {
        btn.classList.add('text-pink-600', 'bg-pink-50/80', 'font-bold');
        btn.classList.remove('text-gray-500', 'font-medium');
      } else {
        btn.classList.remove('text-pink-600', 'bg-pink-50/80', 'font-bold');
        btn.classList.add('text-gray-500', 'font-medium');
      }
    });

    // Renderizar módulo correspondiente
    switch (tabName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'recipes':
        RecipesModule.render();
        break;
      case 'simulator':
        SimulatorModule.render();
        break;
      case 'quotes':
        QuotesModule.render();
        break;
      case 'ingredients':
        IngredientsModule.render();
        break;
      case 'receipts':
        ReceiptsModule.render();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderDashboard() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const recipes = DB.getRecipes();
    const ingredients = DB.getIngredients();
    const quotes = DB.getQuotes();
    const settings = DB.getSettings();

    // Calcular estadísticas
    let totalStockValue = 0;
    ingredients.forEach(i => totalStockValue += (Number(i.packagePrice) || 0));

    const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
    const totalQuotedAmount = quotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);

    container.innerHTML = `
      <!-- Hero Banner Pastelero -->
      <div class="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-pink-200/50 mb-6">
        <div class="relative z-10 max-w-xl">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white mb-3">
            <span>✨</span> Cakekulator Pro · Pastelería & Costeos
          </div>
          <h1 class="text-2xl sm:text-3xl font-black leading-tight">
            ${settings.businessName || 'Mi Pastelería Artesanal'}
          </h1>
          <p class="text-pink-100 text-xs sm:text-sm mt-1 mb-5">
            Costea con precisión tus alfajores, tortas, galletas y cupcakes. Nunca más cobres a ciegas ni regales tu tiempo.
          </p>

          <!-- Acciones Rápidas del Banner -->
          <div class="flex flex-wrap gap-2.5">
            <button onclick="RecipesModule.openEditor()" class="bg-white text-pink-600 hover:bg-pink-50 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition active:scale-95 flex items-center gap-1.5">
              <span>🎂</span> Nueva Receta
            </button>
            <button onclick="QuotesModule.openEditor()" class="bg-pink-700/60 hover:bg-pink-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs backdrop-blur-sm transition active:scale-95 flex items-center gap-1.5">
              <span>📋</span> Nueva Cotización
            </button>
            <button onclick="App.switchTab('simulator')" class="bg-pink-700/60 hover:bg-pink-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs backdrop-blur-sm transition active:scale-95 flex items-center gap-1.5">
              <span>📊</span> Simulador de Precios
            </button>
          </div>
        </div>

        <!-- Decoración flotante -->
        <div class="absolute -right-6 -bottom-8 opacity-20 sm:opacity-30 text-9xl pointer-events-none select-none">
          🧁
        </div>
      </div>

      <!-- Métricas Clave (KPIs) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-xl shrink-0">
            🎂
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block">Recetas Creadas</span>
            <span class="text-xl font-black text-gray-900">${recipes.length}</span>
          </div>
        </div>

        <div class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            📦
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block">Insumos Guardados</span>
            <span class="text-xl font-black text-gray-900">${ingredients.length}</span>
          </div>
        </div>

        <div class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            📋
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block">Cotizaciones Activas</span>
            <span class="text-xl font-black text-gray-900">${pendingQuotes.length}</span>
          </div>
        </div>

        <div class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            💰
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block">Total Presupuestado</span>
            <span class="text-lg font-black text-gray-900 truncate">${Calculator.formatCurrency(totalQuotedAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Sección de Acceso Rápido y Calculadora Exprés -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <!-- Calculadora Exprés en 2 pasos -->
        <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
              <span>⚡</span> Calculadora Rápida de Precio
            </h3>
            <span class="text-[11px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-semibold">Cálculo al instante</span>
          </div>
          <p class="text-xs text-gray-500">¿Cuánto te costó hacer el producto y qué margen deseas ganar?</p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Costo Total ($)</label>
              <input 
                type="number" 
                id="quick-cost" 
                value="5000" 
                step="any"
                min="0"
                oninput="App.recalculateQuickPricing()" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 font-bold text-gray-900 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Margen Deseado (%)</label>
              <input 
                type="number" 
                id="quick-margin" 
                value="45" 
                min="5" 
                max="90" 
                oninput="App.recalculateQuickPricing()" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 font-bold text-pink-600 text-sm"
              />
            </div>
          </div>

          <!-- Resultado Exprés -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span class="text-xs text-emerald-800 font-semibold block">Debes Cobrar Mínimo:</span>
              <span id="quick-result-price" class="text-2xl font-black text-emerald-700">$ 9.091</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-emerald-800 font-semibold block">Ganancia Neta:</span>
              <span id="quick-result-profit" class="text-lg font-bold text-emerald-600">+$ 4.091</span>
            </div>
          </div>
        </div>

        <!-- Recetas Destacadas -->
        <div class="lg:col-span-6 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>🧁</span> Fichas de Recetas Rápidas
              </h3>
              <button onclick="App.switchTab('recipes')" class="text-xs text-pink-600 font-bold hover:underline">
                Ver todas →
              </button>
            </div>

            <div class="space-y-2">
              ${recipes.slice(0, 3).map(r => {
                const costs = Calculator.calculateRecipeFullCosts(r);
                return `
                  <div class="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition cursor-pointer border border-gray-100" onclick="SimulatorModule.loadRecipeForSimulation('${r.id}')">
                    <div class="flex items-center gap-2.5 truncate">
                      <span class="text-lg">${r.type === 'cake' ? '🎂' : '🍪'}</span>
                      <div class="truncate">
                        <h4 class="font-bold text-xs text-gray-800 truncate">${r.name}</h4>
                        <span class="text-[10px] text-gray-500">Costo: ${Calculator.formatCurrency(costs.costPerUnit)} / un</span>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="text-xs font-black text-emerald-600 block">${Calculator.formatCurrency(costs.suggestedUnitPrice)}</span>
                      <span class="text-[10px] text-gray-400">Sugerido (${costs.targetMargin}%)</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="pt-3">
            <button onclick="App.switchTab('recipes')" class="w-full py-2.5 rounded-xl border border-pink-200 text-pink-600 hover:bg-pink-50 font-bold text-xs transition text-center">
              Gestionar Mis Fichas Técnicas
            </button>
          </div>
        </div>
      </div>
    `;

    this.recalculateQuickPricing();
  },

  recalculateQuickPricing() {
    const cost = parseFloat(document.getElementById('quick-cost')?.value) || 0;
    const margin = parseFloat(document.getElementById('quick-margin')?.value) || 40;
    const marginFrac = margin >= 100 ? 0.99 : margin / 100;

    const price = cost > 0 ? Calculator.roundUpTo(cost / (1 - marginFrac), 100) : 0;
    const profit = price - cost;

    const priceEl = document.getElementById('quick-result-price');
    const profitEl = document.getElementById('quick-result-profit');

    if (priceEl) priceEl.textContent = Calculator.formatCurrency(price);
    if (profitEl) profitEl.textContent = `+${Calculator.formatCurrency(profit)}`;
  },

  renderSettings() {
    const container = document.getElementById('settings-view');
    if (!container) return;

    const settings = DB.getSettings();

    container.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>⚙️</span> Configuración de la Pastelería
          </h2>
          <p class="text-sm text-gray-500">Personaliza moneda, tarifas de mano de obra y datos de contacto para tus cotizaciones.</p>
        </div>

        <form id="settings-form" onsubmit="App.saveSettingsForm(event)" class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-5 text-sm">
          <!-- Parámetros de Costeo -->
          <div class="space-y-4">
            <h3 class="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>💰</span> Parámetros Financieros Base
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Símbolo de Moneda</label>
                <input type="text" id="set-currency-symbol" value="${settings.currencySymbol || '$'}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white font-bold">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Tarifa Mano de Obra ($/hr)</label>
                <input type="number" id="set-hourly-rate" value="${settings.defaultHourlyRate || 4000}" step="any" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Margen Objetivo (%)</label>
                <input type="number" id="set-target-margin" value="${settings.defaultTargetMargin || 40}" min="5" max="90" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Comisión Pasarela POS / Webpay (%)</label>
                <input type="number" step="0.01" id="set-payment-comm" value="${settings.defaultPaymentCommission || 3.19}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Abono Requerido por defecto (%)</label>
                <input type="number" id="set-deposit-pct" value="${settings.defaultDepositPercent || 50}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
            </div>
          </div>

          <!-- Datos del Negocio -->
          <div class="space-y-4 pt-3">
            <h3 class="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
              <span>🍰</span> Identidad del Negocio (Para Cotizaciones)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Pastelería</label>
                <input type="text" id="set-business-name" value="${settings.businessName || ''}" placeholder="Ej. Pastelería Cakekulator" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Teléfono</label>
                <input type="tel" id="set-business-phone" value="${settings.businessPhone || ''}" placeholder="Ej. +56 9 1234 5678" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Instagram / Redes Sociales</label>
                <input type="text" id="set-business-ig" value="${settings.businessInstagram || ''}" placeholder="Ej. @mipasteleria" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Email de Contacto</label>
                <input type="email" id="set-business-email" value="${settings.businessEmail || ''}" placeholder="contacto@mipasteleria.cl" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nota o Términos por defecto en presupuestos</label>
              <textarea id="set-quote-note" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">${settings.quoteNote || ''}</textarea>
            </div>
          </div>

          <button type="submit" class="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition">
            Guardar Configuración
          </button>
        </form>

        <!-- Respaldos y Restauración -->
        <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4 text-sm">
          <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
            <span>💾</span> Copias de Seguridad y Datos
          </h3>
          <p class="text-xs text-gray-500">Exporta tus insumos y recetas para no perderlos nunca o para transferirlos a otro teléfono Android.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onclick="App.exportBackup()" class="py-2.5 px-4 rounded-xl border border-pink-200 hover:bg-pink-50 text-pink-700 font-bold text-xs flex items-center justify-center gap-2 transition">
              <span>📥</span> Descargar Copia (.JSON)
            </button>
            <label class="py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer text-center">
              <span>📤</span> Restaurar Copia (.JSON)
              <input type="file" accept=".json" onchange="App.importBackup(event)" class="hidden">
            </label>
          </div>

          <div class="pt-3 border-t border-gray-100">
            <button onclick="App.resetDataConfirm()" class="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline">
              ⚠️ Restaurar recetas e insumos de ejemplo originales
            </button>
          </div>
        </div>
      </div>
    `;
  },

  saveSettingsForm(e) {
    e.preventDefault();

    const newSettings = {
      currencySymbol: document.getElementById('set-currency-symbol').value.trim() || '$',
      defaultHourlyRate: parseFloat(document.getElementById('set-hourly-rate').value) || 4000,
      defaultTargetMargin: parseFloat(document.getElementById('set-target-margin').value) || 40,
      defaultPaymentCommission: parseFloat(document.getElementById('set-payment-comm').value) || 3.19,
      defaultDepositPercent: parseFloat(document.getElementById('set-deposit-pct').value) || 50,
      businessName: document.getElementById('set-business-name').value.trim(),
      businessPhone: document.getElementById('set-business-phone').value.trim(),
      businessInstagram: document.getElementById('set-business-ig').value.trim(),
      businessEmail: document.getElementById('set-business-email').value.trim(),
      quoteNote: document.getElementById('set-quote-note').value.trim()
    };

    DB.saveSettings(newSettings);
    this.showToast('Configuración guardada correctamente');
  },

  exportBackup() {
    const dataStr = DB.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cakekulator_Respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Copia de seguridad descargada');
  },

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = DB.importAllData(event.target.result);
      if (success) {
        this.showToast('¡Datos restaurados con éxito!');
        setTimeout(() => location.reload(), 800);
      } else {
        alert('El archivo seleccionado no es válido.');
      }
    };
    reader.readAsText(file);
  },

  resetDataConfirm() {
    if (confirm('¿Deseas restaurar todas las recetas e insumos de ejemplo? Esto reemplazará tus cambios actuales.')) {
      DB.resetAllData();
      this.showToast('Datos reiniciados');
      setTimeout(() => location.reload(), 600);
    }
  },

  // Notificaciones Toast Flotantes
  showToast(message, duration = 2500) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl z-50 transition-all duration-300 transform -translate-y-12 opacity-0 pointer-events-none flex items-center gap-2';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
    toast.classList.remove('-translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('-translate-y-12', 'opacity-0');
    }, duration);
  },

  // Service Worker para PWA Offline
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('Service Worker registrado:', reg.scope))
          .catch(err => console.log('Error registrando Service Worker:', err));
      });
    }
  },

  // Instalación de la app en Android
  initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('pwa-install-btn');
      if (installBtn) installBtn.classList.remove('hidden');
    });
  },

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('El usuario aceptó instalar la App');
        }
        this.deferredPrompt = null;
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) installBtn.classList.add('hidden');
      });
    }
  },

  // Estado de Red (Online / Offline)
  initNetworkStatus() {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      const badge = document.getElementById('network-badge');
      if (badge) {
        if (isOnline) {
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Online';
          badge.className = 'text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1.5';
        } else {
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span> Offline (Sin red)';
          badge.className = 'text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1.5';
        }
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }
};

// Auto inicio al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
