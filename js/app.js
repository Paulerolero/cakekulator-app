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

    // Inicializar autenticación y sesión con Google / Firebase
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
    }

    // Renderizar pestaña inicial
    this.switchTab('dashboard');

    console.log('Cakekulator cargado correctamente.');
  },

  switchTab(tabName, scrollToTop = true) {
    // Si se pide simulador, abrir inicio y scrollear al simulador
    if (tabName === 'simulator') {
      tabName = 'dashboard';
      setTimeout(() => {
        const el = document.getElementById('dashboard-simulator-container');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    this.currentTab = tabName;

    const views = ['dashboard-view', 'quotes-view', 'recipes-view', 'ingredients-view', 'market-radar-view', 'settings-view'];
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
      case 'quotes':
        QuotesModule.render();
        break;
      case 'recipes':
        RecipesModule.render();
        break;
      case 'ingredients':
        IngredientsModule.render();
        break;
      case 'market-radar':
        if (typeof MarketRadarModule !== 'undefined') {
          MarketRadarModule.render();
        }
        break;
      case 'settings':
        this.renderSettings();
        break;
    }

    // Scroll to top
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  renderCurrentTab(maintainScroll = false) {
    const prevY = window.scrollY;
    this.switchTab(this.currentTab, !maintainScroll);
    if (maintainScroll) {
      window.scrollTo({ top: prevY, behavior: 'instant' });
    }
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
            <button onclick="document.getElementById('dashboard-simulator-container')?.scrollIntoView({ behavior: 'smooth' })" class="bg-pink-700/60 hover:bg-pink-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs backdrop-blur-sm transition active:scale-95 flex items-center gap-1.5">
              <span>📊</span> Simulador de Precios ↓
            </button>
          </div>
        </div>

        <!-- Decoración flotante -->
        <div class="absolute -right-6 -bottom-8 opacity-20 sm:opacity-30 text-9xl pointer-events-none select-none">
          🧁
        </div>
      </div>

      <!-- Métricas Clave (KPIs) con Acceso Directo -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div onclick="App.switchTab('recipes')" role="button" tabindex="0" title="Ver Recetas & Costeo" class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-3.5 group select-none">
          <div class="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:bg-pink-100 transition duration-200">
            🎂
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block group-hover:text-pink-600 transition">Recetas Creadas</span>
            <span class="text-xl font-black text-gray-900">${recipes.length}</span>
          </div>
        </div>

        <div onclick="App.switchTab('ingredients')" role="button" tabindex="0" title="Ver Insumos & Empaques" class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-3.5 group select-none">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:bg-amber-100 transition duration-200">
            📦
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block group-hover:text-amber-600 transition">Insumos Guardados</span>
            <span class="text-xl font-black text-gray-900">${ingredients.length}</span>
          </div>
        </div>

        <div onclick="App.switchTab('quotes')" role="button" tabindex="0" title="Ver Cotizaciones" class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-3.5 group select-none">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:bg-emerald-100 transition duration-200">
            📋
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block group-hover:text-emerald-600 transition">Cotizaciones Activas</span>
            <span class="text-xl font-black text-gray-900">${pendingQuotes.length}</span>
          </div>
        </div>

        <div onclick="App.switchTab('quotes')" role="button" tabindex="0" title="Ver Cotizaciones y Presupuestos" class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md hover:border-purple-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-3.5 group select-none">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition duration-200">
            💰
          </div>
          <div>
            <span class="text-xs text-gray-500 font-medium block group-hover:text-purple-600 transition">Total Presupuestado</span>
            <span class="text-lg font-black text-gray-900 truncate">${Calculator.formatCurrency(totalQuotedAmount)}</span>
          </div>
        </div>
      </div>

      <!-- Simulador de Precios y Rentabilidad Integrado en Inicio -->
      <div id="dashboard-simulator-container" class="mb-6"></div>

      <!-- Recetas Destacadas y Accesos Rápidos -->
      <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
            <span>🧁</span> Fichas de Recetas Rápidas
          </h3>
          <button onclick="App.switchTab('recipes')" class="text-xs text-pink-600 font-bold hover:underline">
            Ver todas las recetas →
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${recipes.slice(0, 6).map(r => {
            const costs = Calculator.calculateRecipeFullCosts(r);
            return `
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition cursor-pointer border border-gray-100 group" onclick="SimulatorModule.loadRecipeForSimulation('${r.id}')" title="Simular rentabilidad de esta receta">
                <div class="flex items-center gap-2.5 truncate">
                  <span class="text-xl group-hover:scale-110 transition">${r.type === 'cake' ? '🎂' : '🍪'}</span>
                  <div class="truncate">
                    <h4 class="font-bold text-xs text-gray-800 truncate group-hover:text-pink-600 transition">${r.name}</h4>
                    <span class="text-[10px] text-gray-500">Costo: ${Calculator.formatCurrency(costs.costPerUnit)} / un</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-xs font-black text-emerald-600 block">${Calculator.formatCurrency(costs.suggestedUnitPrice)}</span>
                  <span class="text-[10px] text-gray-400">Simular ↗</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Renderizar el Simulador directamente en el contenedor del Dashboard
    if (typeof SimulatorModule !== 'undefined') {
      SimulatorModule.render('dashboard-simulator-container');
    }
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

        <!-- Conexión Nube & Cuenta Google -->
        <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4 text-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span>🔥</span> Base de Datos y Sesión en la Nube
            </h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">
              ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'Firebase Conectado' : 'Modo Local'}
            </span>
          </div>

          <p class="text-xs text-gray-500">Conecta tu cuenta de Google y Firebase Cloud Firestore para que tus recetas, costos y presupuestos se sincronicen automáticamente en todos tus dispositivos.</p>

          <div class="bg-gradient-to-br from-pink-50/60 to-rose-50/40 p-4 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              ${typeof AuthModule !== 'undefined' && AuthModule.currentUser ? `
                <div class="flex items-center gap-3">
                  ${AuthModule.currentUser.photoURL ? `
                    <img src="${AuthModule.currentUser.photoURL}" alt="" class="w-10 h-10 rounded-full ring-2 ring-pink-300">
                  ` : `
                    <div class="w-10 h-10 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center">
                      ${(AuthModule.currentUser.displayName || 'U').charAt(0)}
                    </div>
                  `}
                  <div>
                    <h4 class="font-bold text-gray-900 text-xs">${AuthModule.currentUser.displayName || 'Usuario'}</h4>
                    <p class="text-[11px] text-gray-500">${AuthModule.currentUser.email}</p>
                    <span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sincronización en vivo activa
                    </span>
                  </div>
                </div>
              ` : `
                <div>
                  <h4 class="font-bold text-gray-800 text-xs">Sin sesión iniciada</h4>
                  <p class="text-[11px] text-gray-500">Inicia sesión con Google para respaldar tus datos en la nube.</p>
                </div>
              `}
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              ${typeof AuthModule !== 'undefined' && AuthModule.currentUser ? `
                <button onclick="AuthModule.forceSyncNow()" class="flex-1 sm:flex-none px-3 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold rounded-xl transition">
                  🔄 Sincronizar
                </button>
                <button onclick="AuthModule.logout()" class="flex-1 sm:flex-none px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold rounded-xl transition">
                  Cerrar Sesión
                </button>
              ` : `
                <button onclick="AuthModule.loginWithGoogle()" class="w-full sm:w-auto px-4 py-2 bg-white hover:bg-pink-50 border border-pink-300 text-pink-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Iniciar con Google
                </button>
              `}
              <button onclick="AuthModule.showConfigModal()" title="Configurar credenciales de Firebase" class="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-700">
                ⚙️
              </button>
            </div>
          </div>
        </div>

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
