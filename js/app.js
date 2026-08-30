// ==========================================
// Cakekulator - Controlador Principal y Navegación
// ==========================================

const App = {
  currentTab: 'dashboard',
  currentMode: localStorage.getItem('cakekulator_app_mode') || 'products',
  deferredPrompt: null, // Para el banner de instalación PWA

  init() {
    // Inicializar base de datos local
    DB.init();

    // Registrar Service Worker para PWA Offline
    this.registerServiceWorker();

    // Eventos de instalación PWA
    this.initPWAInstall();

    // Inicializar navegación táctil por gestos (Swipe)
    this.initGestures();

    // Inicializar autenticación y sesión con Google / Firebase
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
    }

    // Inicializar Modo Oscuro / Claro
    this.initDarkMode();

    // Aplicar clase CSS y textos de navegación según ambiente activo (Productos vs Servicios)
    this.applyModeTheme();

    // Navegación con botón atrás / gestos móviles para modales y scroll
    this.initBackAndScrollHandler();

    // Renderizar pestaña inicial
    this.switchTab('dashboard');

    // Si el usuario entra por primera vez y no ha elegido ambiente, mostrar modal de selección
    if (!localStorage.getItem('cakekulator_app_mode')) {
      setTimeout(() => this.showModeSelectionModal(), 350);
    }

    console.log('Cakekulator cargado correctamente con control de gestos y ambientes separados.');
  },

  applyModeTheme() {
    document.body.classList.remove('mode-products', 'mode-services');
    document.body.classList.add(this.currentMode === 'services' ? 'mode-services' : 'mode-products');
    this.updateNavLabels();
    if (typeof AuthModule !== 'undefined' && AuthModule.renderAuthUI) {
      AuthModule.renderAuthUI();
    }
  },

  showModeSelectionModal() {
    const modal = document.getElementById('mode-selection-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeModeSelectionModal() {
    const modal = document.getElementById('mode-selection-modal');
    if (modal) modal.classList.add('hidden');
  },

  setAppMode(mode) {
    this.currentMode = mode;
    localStorage.setItem('cakekulator_app_mode', mode);
    this.applyModeTheme();
    this.closeModeSelectionModal();
    this.renderCurrentTab();
    this.showToast(mode === 'products' 
      ? '🎂 Ambiente: Venta de Productos (Pastelería)' 
      : '💆 Ambiente: Prestación de Servicios (Spa & Estética)');
  },

  toggleMode() {
    this.showModeSelectionModal();
  },

  updateNavLabels() {
    const isServ = this.currentMode === 'services';
    const quotesIcon = isServ ? '💬' : '📋';
    const quotesText = isServ ? 'Cotizar' : 'Presupuesto';
    const recipesIcon = isServ ? '💆' : '🎂';
    const recipesText = isServ ? 'Servicios' : 'Recetas';
    const ingIcon = isServ ? '🧴' : '📦';
    const ingText = isServ ? 'Insumos' : 'Insumos';

    // Desktop Nav
    const qIconD = document.getElementById('nav-icon-quotes-desk');
    const qTextD = document.getElementById('nav-text-quotes-desk');
    const rIconD = document.getElementById('nav-icon-recipes-desk');
    const rTextD = document.getElementById('nav-text-recipes-desk');
    const iIconD = document.getElementById('nav-icon-ingredients-desk');
    const iTextD = document.getElementById('nav-text-ingredients-desk');

    if (qIconD) qIconD.textContent = quotesIcon;
    if (qTextD) qTextD.textContent = quotesText;
    if (rIconD) rIconD.textContent = recipesIcon;
    if (rTextD) rTextD.textContent = recipesText;
    if (iIconD) iIconD.textContent = ingIcon;
    if (iTextD) iTextD.textContent = ingText;

    // Mobile Nav
    const qIconM = document.getElementById('nav-icon-quotes-mob');
    const qTextM = document.getElementById('nav-text-quotes-mob');
    const rIconM = document.getElementById('nav-icon-recipes-mob');
    const rTextM = document.getElementById('nav-text-recipes-mob');
    const iIconM = document.getElementById('nav-icon-ingredients-mob');
    const iTextM = document.getElementById('nav-text-ingredients-mob');

    if (qIconM) qIconM.textContent = quotesIcon;
    if (qTextM) qTextM.textContent = quotesText;
    if (rIconM) rIconM.textContent = recipesIcon;
    if (rTextM) rTextM.textContent = recipesText;
    if (iIconM) iIconM.textContent = ingIcon;
    if (iTextM) iTextM.textContent = ingText;

    // Switcher Button
    const swIcon = document.getElementById('mode-switcher-icon');
    const swLabel = document.getElementById('mode-switcher-label');
    if (swIcon) swIcon.textContent = isServ ? '💆' : '🎂';
    if (swLabel) swLabel.textContent = isServ ? 'Servicios' : 'Productos';

    // Header Title and Subtitle
    const hTitle = document.getElementById('header-brand-title');
    const hName = document.getElementById('header-brand-name');
    if (hTitle) {
      hTitle.innerHTML = isServ 
        ? `Servi<span class="text-teal-600 dark:text-teal-400">kulator</span>` 
        : `Cake<span class="text-pink-600 dark:text-pink-400">kulator</span>`;
    }
    if (hName) {
      hName.textContent = isServ ? 'Spa & Servicios' : 'Gestión Pastelera';
    }
  },

  initGestures() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isTracking = false;

    const tabsOrder = ['dashboard', 'quotes', 'recipes', 'ingredients', 'market-radar'];

    const isInteractiveElement = (target) => {
      if (!target || !(target instanceof Element)) return false;

      // Sliders y controles interactivos
      if (target.closest('input[type="range"], .accent-pink-500')) return true;
      if (target.closest('input, textarea, select, option, [contenteditable="true"]')) return true;

      // Modales activos abiertos
      const openModal = document.querySelector('#recipe-editor-modal:not(.hidden), #quote-editor-modal:not(.hidden), #ingredient-modal:not(.hidden), #quote-whatsapp-modal:not(.hidden), #quote-print-modal:not(.hidden), #recipe-scanner-modal:not(.hidden), #receipt-scanner-modal:not(.hidden), #custom-search-modal:not(.hidden), #store-manager-modal:not(.hidden), #firebase-config-modal:not(.hidden)');
      if (openModal) return true;

      // Zonas de scroll horizontal interno (como categorías o tablas)
      const scrollable = target.closest('.overflow-x-auto, [style*="overflow-x"], .no-scrollbar');
      if (scrollable && scrollable.scrollWidth > scrollable.clientWidth + 10) {
        return true;
      }

      return false;
    };

    const handleStart = (clientX, clientY, target) => {
      if (isInteractiveElement(target)) {
        isTracking = false;
        return;
      }
      startX = clientX;
      startY = clientY;
      startTime = Date.now();
      isTracking = true;
    };

    const handleEnd = (clientX, clientY) => {
      if (!isTracking) return;
      isTracking = false;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      const deltaTime = Date.now() - startTime;

      const minDistance = 45; // px mínimos para detectar swipe
      const maxTime = 600; // ms máximos
      const isHorizontalDominant = Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

      if (deltaTime <= maxTime && Math.abs(deltaX) >= minDistance && isHorizontalDominant) {
        const currentIndex = tabsOrder.indexOf(App.currentTab);
        if (currentIndex === -1) return;

        if (deltaX < -minDistance) {
          // Deslizar izquierda -> Siguiente pestaña
          if (currentIndex < tabsOrder.length - 1) {
            const nextTab = tabsOrder[currentIndex + 1];
            App.switchTab(nextTab, true, 'slide-left');
          }
        } else if (deltaX > minDistance) {
          // Deslizar derecha -> Pestaña anterior
          if (currentIndex > 0) {
            const prevTab = tabsOrder[currentIndex - 1];
            App.switchTab(prevTab, true, 'slide-right');
          }
        }
      }
    };

    // Soporte nativo para pantallas táctiles de celular (iOS / Android / PWA)
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) {
        isTracking = false;
        return;
      }
      handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) {
        isTracking = false;
        return;
      }
      handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }, { passive: true });

    // Soporte universal para pointer events (ratón, emuladores y trackpads)
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      handleStart(e.clientX, e.clientY, e.target);
    }, { passive: true });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      handleEnd(e.clientX, e.clientY);
    }, { passive: true });
  },

  switchTab(tabName, scrollToTop = true, direction = 'none') {
    if (tabName === 'simulator') {
      tabName = 'dashboard';
      setTimeout(() => {
        const el = document.getElementById('dashboard-simulator-container');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    this.currentTab = tabName;

    const views = ['dashboard-view', 'quotes-view', 'whatsapp-bot-view', 'recipes-view', 'ingredients-view', 'market-radar-view', 'settings-view'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const activeView = document.getElementById(`${tabName}-view`);
    if (activeView) {
      activeView.classList.remove('hidden', 'view-slide-left', 'view-slide-right', 'view-transition');
      if (direction === 'slide-left') {
        activeView.classList.add('view-slide-left');
      } else if (direction === 'slide-right') {
        activeView.classList.add('view-slide-right');
      } else {
        activeView.classList.add('view-transition');
      }
    }

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
      case 'whatsapp-bot':
        if (typeof WhatsAppBotModule !== 'undefined') {
          WhatsAppBotModule.init();
        }
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

    const isServicesMode = this.currentMode === 'services';
    const allRecipes = DB.getRecipes();
    const allIngredients = DB.getIngredients();
    const quotes = DB.getQuotes();
    const settings = DB.getSettings();

    // Filtrar según el modo activo
    const recipes = isServicesMode
      ? allRecipes.filter(r => r.itemType === 'service' || ['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type))
      : allRecipes.filter(r => (r.itemType || 'product') === 'product' && !['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type));

    const ingredients = isServicesMode
      ? allIngredients.filter(i => i.itemType === 'service' || i.yieldApplications > 0)
      : allIngredients.filter(i => (i.itemType || 'product') === 'product');

    const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');

    if (isServicesMode) {
      // ==========================================
      // Dashboard Modo Servicios & Spa (Luxe Emerald & Nordic Aesthetic)
      // ==========================================
      const businessTitle = (!settings.businessName || settings.businessName === 'Mi Pastelería Artesanal') 
        ? 'Centro de Estética, Spa & Masajes' 
        : settings.businessName;

      container.innerHTML = `
        <!-- Hero Banner Spa & Servicios -->
        <div class="services-hero-banner rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md mb-4 sm:mb-6 relative overflow-hidden">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3 sm:gap-5 max-w-2xl">
              ${settings.logoUrl ? `
                <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/95 p-1.5 shadow-md ring-2 ring-white/60 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src="${settings.logoUrl}" alt="Logo" class="w-full h-full object-contain">
                </div>
              ` : `
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shrink-0 ring-1 ring-white/30">
                  💆
                </div>
              `}
              <div class="flex-1 min-w-0">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full hero-badge text-[10px] sm:text-xs font-bold mb-1.5 shadow-xs">
                  <span class="text-xs">💆</span>
                  <span>Ambiente: Prestación de Servicios & Spa</span>
                </div>
                <h1 class="text-xl sm:text-2xl font-black leading-tight truncate text-white">
                  ${businessTitle}
                </h1>
                <p class="hero-subtitle text-[11px] sm:text-xs mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                  Costea con precisión duración en cabina, insumos por aplicación, honorarios y paquetes de sesiones.
                </p>
              </div>
            </div>

            <!-- Botones de Acción Rápida en Hero -->
            <div class="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
              <button onclick="RecipesModule.openEditor()" class="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ring-1 ring-white/30">
                <span>✨</span> Nuevo Servicio
              </button>
              <button onclick="App.switchTab('simulator')" class="px-3.5 py-2 rounded-xl bg-emerald-400/25 hover:bg-emerald-400/35 text-white text-xs font-bold transition flex items-center gap-1.5 border border-emerald-300/40 active:scale-95 cursor-pointer">
                <span>⚡</span> Simular Precios
              </button>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-6 opacity-15 sm:opacity-20 text-7xl sm:text-8xl pointer-events-none select-none">
            💆
          </div>
        </div>

        <!-- Métricas Clave (KPIs) de Servicios -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
          <div onclick="App.switchTab('recipes')" role="button" tabindex="0" title="Ver Servicios" class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-teal-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-400 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition font-bold">
              💆
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold block truncate">Servicios / Fichas</span>
              <span class="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">${recipes.length}</span>
            </div>
          </div>

          <div onclick="App.switchTab('ingredients')" role="button" tabindex="0" title="Ver Insumos de Cabina" class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-teal-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition font-bold">
              🧴
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold block truncate">Insumos de Cabina</span>
              <span class="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">${ingredients.length}</span>
            </div>
          </div>

          <div onclick="App.switchTab('quotes')" role="button" tabindex="0" title="Ver Cotizaciones" class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-teal-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-400 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition font-bold">
              💬
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold block truncate">Cotizaciones</span>
              <span class="text-base sm:text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">${pendingQuotes.length}</span>
            </div>
          </div>
        </div>

        <!-- Simulador Integrado en Inicio -->
        <div id="dashboard-simulator-container" class="mb-4 sm:mb-6"></div>

        <!-- Fichas de Servicios Rápidas -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 dark:border-slate-800 shadow-sm mb-4 sm:mb-6">
          <div class="flex items-center justify-between mb-3 sm:mb-4">
            <h3 class="font-black text-gray-900 dark:text-gray-100 text-sm sm:text-base flex items-center gap-1.5">
              <span>💆</span> Protocolos & Servicios de Atención
            </h3>
            <button onclick="App.switchTab('recipes')" class="text-xs text-teal-700 dark:text-teal-300 font-bold hover:underline">
              Ver todos →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            ${recipes.slice(0, 6).map(r => {
              const costs = Calculator.calculateRecipeFullCosts(r);
              return `
                <div class="flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 hover:bg-teal-50/60 dark:hover:bg-slate-800 transition cursor-pointer border border-gray-100 dark:border-slate-700 group shadow-2xs hover:border-teal-300" onclick="SimulatorModule.loadRecipeForSimulation('${r.id}')" title="Simular rentabilidad">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-lg group-hover:scale-110 transition">💆</span>
                    <div class="truncate">
                      <h4 class="font-bold text-xs text-gray-800 dark:text-gray-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">${r.name}</h4>
                      <span class="text-[10px] text-gray-500 dark:text-gray-400">Duración: ${r.durationMinutes || 60} min · Costo: ${Calculator.formatCurrency(costs.costPerUnit)}</span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-xs font-black text-emerald-700 dark:text-emerald-400 block">${Calculator.formatCurrency(costs.suggestedUnitPrice)}</span>
                    <span class="text-[10px] text-gray-400 group-hover:text-teal-600 font-semibold">Simular ↗</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      // ==========================================
      // Dashboard Modo Productos (Pastelería Original)
      // ==========================================
      container.innerHTML = `
        <!-- Hero Banner Pastelero Original -->
        <div class="products-hero-banner rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md mb-4 sm:mb-6 relative overflow-hidden">
          <div class="relative z-10 flex items-center gap-3 sm:gap-5 max-w-2xl">
            ${settings.logoUrl ? `
              <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/95 p-1.5 shadow-md ring-2 ring-white/60 shrink-0 flex items-center justify-center overflow-hidden">
                <img src="${settings.logoUrl}" alt="Logo ${settings.businessName || ''}" class="w-full h-full object-contain">
              </div>
            ` : ''}
            <div class="flex-1 min-w-0">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full hero-badge text-[10px] sm:text-xs font-bold mb-1.5 shadow-xs">
                <span>🎂</span>
                <span>Ambiente: Venta de Productos & Pastelería</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black leading-tight truncate text-white">
                ${settings.businessName || 'Mi Pastelería Artesanal'}
              </h1>
              <p class="hero-subtitle text-[11px] sm:text-xs mt-1 leading-snug line-clamp-2 sm:line-clamp-none font-medium">
                Costea con precisión tus tortas, alfajores, galletas y cupcakes. Nunca más cobres a ciegas.
              </p>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-6 opacity-15 sm:opacity-25 text-7xl sm:text-8xl pointer-events-none select-none">
            🧁
          </div>
        </div>

        <!-- Métricas Clave (KPIs) de Productos -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
          <div onclick="App.switchTab('recipes')" role="button" tabindex="0" title="Ver Recetas & Costeo" class="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 shadow-xs hover:shadow-md hover:border-pink-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 group-hover:bg-pink-100 transition duration-200">
              🎂
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 font-medium block truncate group-hover:text-pink-600 transition">Recetas</span>
              <span class="text-base sm:text-xl font-black text-gray-900 leading-tight">${recipes.length}</span>
            </div>
          </div>

          <div onclick="App.switchTab('ingredients')" role="button" tabindex="0" title="Ver Insumos & Empaques" class="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 shadow-xs hover:shadow-md hover:border-amber-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 group-hover:bg-amber-100 transition duration-200">
              📦
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 font-medium block truncate group-hover:text-amber-600 transition">Insumos</span>
              <span class="text-base sm:text-xl font-black text-gray-900 leading-tight">${ingredients.length}</span>
            </div>
          </div>

          <div onclick="App.switchTab('quotes')" role="button" tabindex="0" title="Ver Cotizaciones" class="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 shadow-xs hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition duration-200 cursor-pointer flex items-center gap-2.5 sm:gap-3.5 group select-none">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 group-hover:bg-emerald-100 transition duration-200">
              📋
            </div>
            <div class="min-w-0">
              <span class="text-[10px] sm:text-xs text-gray-500 font-medium block truncate group-hover:text-emerald-600 transition">Cotizaciones</span>
              <span class="text-base sm:text-xl font-black text-gray-900 leading-tight">${pendingQuotes.length}</span>
            </div>
          </div>
        </div>

        <!-- Simulador de Precios y Rentabilidad Integrado en Inicio -->
        <div id="dashboard-simulator-container" class="mb-4 sm:mb-6"></div>

        <!-- Recetas Destacadas y Accesos Rápidos -->
        <div class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 shadow-sm mb-4 sm:mb-6">
          <div class="flex items-center justify-between mb-3 sm:mb-4">
            <h3 class="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>🧁</span> Fichas de Recetas Rápidas
            </h3>
            <button onclick="App.switchTab('recipes')" class="text-xs text-pink-600 font-bold hover:underline">
              Ver todas →
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            ${recipes.slice(0, 6).map(r => {
              const costs = Calculator.calculateRecipeFullCosts(r);
              return `
                <div class="flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-gray-50/80 hover:bg-pink-50/50 transition cursor-pointer border border-gray-100 group" onclick="SimulatorModule.loadRecipeForSimulation('${r.id}')" title="Simular rentabilidad de esta receta">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-lg group-hover:scale-110 transition">${r.type === 'cake' ? '🎂' : '🍪'}</span>
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
    }

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
      <div class="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h2 class="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>⚙️</span> Configuración de la Pastelería
          </h2>
          <p class="text-xs sm:text-sm text-gray-500">Personaliza moneda, tarifas de mano de obra y datos de contacto para tus cotizaciones.</p>
        </div>

        <form id="settings-form" onsubmit="App.saveSettingsForm(event)" class="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 shadow-sm space-y-4 sm:space-y-5 text-xs sm:text-sm">
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

            <!-- Logo Personalizado de la Pastelería -->
            <div class="bg-gradient-to-r from-pink-50/60 via-purple-50/40 to-pink-50/60 p-4 rounded-2xl border border-pink-100 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-800/80 space-y-3">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Logo de tu Pastelería (Se muestra en Inicio y Presupuestos)
                </label>
                ${settings.logoUrl ? `
                  <button type="button" onclick="App.removeLogo()" class="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline">
                    ✕ Quitar Logo
                  </button>
                ` : ''}
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs shrink-0 relative group">
                  <img id="settings-logo-preview" src="${settings.logoUrl || 'assets/icons/logo.png'}" alt="Logo Preview" class="w-full h-full object-contain p-1">
                </div>

                <div class="flex-1 space-y-2 w-full">
                  <input type="hidden" id="set-business-logo" value="${settings.logoUrl || ''}">
                  
                  <div class="flex flex-wrap gap-2">
                    <label class="py-2 px-3.5 bg-white dark:bg-slate-900 hover:bg-pink-50 dark:hover:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <span>📤</span> Subir Logo
                      <input type="file" id="logo-file-input" accept="image/*" onchange="App.handleLogoUpload(event)" class="hidden">
                    </label>

                    <button 
                      type="button" 
                      id="remove-bg-btn"
                      onclick="App.removeLogoBackground()" 
                      class="py-2 px-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-90 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      ${!settings.logoUrl ? 'disabled' : ''}
                      title="Elimina el fondo blanco o sólido de tu logo automáticamente"
                    >
                      <span>🍌</span> Quitar Fondo (Nano Banana)
                    </button>
                  </div>

                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    Sube una imagen cuadrada (.PNG o .JPG). Con "Quitar Fondo" convertiremos automáticamente fondos blancos o sólidos en transparentes.
                  </p>
                </div>
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

          <button type="submit" class="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl shadow-md transition">
            Guardar Configuración
          </button>
        </form>

        <!-- Apariencia y Modo Oscuro / Claro -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4 text-sm transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xl shadow-2xs">
                <span>🎨</span>
              </div>
              <div>
                <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm">Tema Visual y Modo Oscuro</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">Personaliza la interfaz según tu preferencia o iluminación ambiental.</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button 
              type="button" 
              onclick="App.setTheme('light')" 
              id="settings-theme-light" 
              class="p-4 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${!document.documentElement.classList.contains('dark') ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-400/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-pink-200'}"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">☀️</span>
                <div>
                  <div class="font-bold text-xs text-gray-900 dark:text-gray-100">Modo Claro</div>
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">Pastel, suave y luminoso</div>
                </div>
              </div>
              <span class="text-pink-600 font-bold text-xs ${!document.documentElement.classList.contains('dark') ? 'opacity-100' : 'opacity-0'}">✓ Activo</span>
            </button>

            <button 
              type="button" 
              onclick="App.setTheme('dark')" 
              id="settings-theme-dark" 
              class="p-4 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${document.documentElement.classList.contains('dark') ? 'border-pink-500 bg-pink-50/50 dark:bg-slate-800 ring-2 ring-pink-400/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-pink-200'}"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌙</span>
                <div>
                  <div class="font-bold text-xs text-gray-900 dark:text-gray-100">Modo Oscuro</div>
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">Alto contraste y descanso</div>
                </div>
              </div>
              <span class="text-pink-600 dark:text-pink-400 font-bold text-xs ${document.documentElement.classList.contains('dark') ? 'opacity-100' : 'opacity-0'}">✓ Activo</span>
            </button>
          </div>
        </div>

        <!-- Conexión Nube & Cuenta Google -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4 text-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <span>🔥</span> Base de Datos y Sesión en la Nube
            </h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">
              ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'Firebase Conectado' : 'Modo Local'}
            </span>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400">Conecta tu cuenta de Google y Firebase Cloud Firestore para que tus recetas, costos y presupuestos se sincronicen automáticamente en todos tus dispositivos.</p>

          <div class="bg-gradient-to-br from-pink-50/60 to-rose-50/40 dark:from-slate-800/80 dark:to-slate-800/60 p-4 rounded-2xl border border-pink-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-xs">${AuthModule.currentUser.displayName || 'Usuario'}</h4>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">${AuthModule.currentUser.email}</p>
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sincronización en vivo activa
                    </span>
                  </div>
                </div>
              ` : `
                <div>
                  <h4 class="font-bold text-gray-800 dark:text-gray-200 text-xs">Sin sesión iniciada</h4>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">Inicia sesión con Google para respaldar tus datos en la nube.</p>
                </div>
              `}
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              ${typeof AuthModule !== 'undefined' && AuthModule.currentUser ? `
                <button onclick="AuthModule.forceSyncNow()" class="flex-1 sm:flex-none px-3 py-2 bg-pink-100 dark:bg-slate-700 hover:bg-pink-200 dark:hover:bg-slate-600 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-xl transition">
                  🔄 Sincronizar
                </button>
                <button onclick="AuthModule.logout()" class="flex-1 sm:flex-none px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold rounded-xl transition">
                  Cerrar Sesión
                </button>
              ` : `
                <button onclick="AuthModule.loginWithGoogle()" class="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Iniciar con Google
                </button>
              `}
              <button onclick="AuthModule.showConfigModal()" title="Configurar credenciales de Firebase" class="p-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700">
                ⚙️
              </button>
            </div>
          </div>
        </div>

        <!-- Conexión a WhatsApp Bot de Respuestas Automáticas -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4 text-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              <span>💬</span> WhatsApp Bot de Cotizaciones
            </h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Inteligencia Artificial
            </span>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Conecta tu número de WhatsApp para que el bot responda cotizaciones automáticamente a tus clientes utilizando los precios de tus recetas y solicitud de abono.
          </p>

          <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                📲
              </div>
              <div>
                <h4 class="font-bold text-xs leading-tight">Vincular y Gestionar WhatsApp Bot</h4>
                <p class="text-[11px] text-emerald-100 mt-0.5">Escanear código QR, historial en vivo y conmutar auto-respuesta.</p>
              </div>
            </div>

            <button type="button" onclick="App.switchTab('whatsapp-bot')" class="w-full sm:w-auto px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5">
              <span>Configurar Bot</span>
              <span>→</span>
            </button>
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

    const currentSettings = DB.getSettings();
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
      quoteNote: document.getElementById('set-quote-note').value.trim(),
      logoUrl: (document.getElementById('set-business-logo')?.value || '').trim(),
      geminiApiKey: currentSettings.geminiApiKey || ''
    };

    DB.saveSettings(newSettings);
    this.updateHeaderBrand();
    this.showToast('Configuración guardada correctamente');
  },

  // Manejo de carga de Logo
  async handleLogoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    try {
      this.showToast('Cargando logo...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const preview = document.getElementById('settings-logo-preview');
        const hiddenInput = document.getElementById('set-business-logo');
        const removeBgBtn = document.getElementById('remove-bg-btn');

        if (preview) preview.src = dataUrl;
        if (hiddenInput) hiddenInput.value = dataUrl;
        if (removeBgBtn) removeBgBtn.disabled = false;

        const settings = DB.getSettings();
        settings.logoUrl = dataUrl;
        DB.saveSettings(settings);
        this.updateHeaderBrand();
        this.showToast('✨ Logo cargado con éxito');
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('Error al cargar logo:', e);
      alert('Hubo un inconveniente al cargar la imagen.');
    }
  },

  // Remover fondo con Nano Banana / Canvas Segmentation
  async removeLogoBackground() {
    const hiddenInput = document.getElementById('set-business-logo');
    const currentLogo = hiddenInput ? hiddenInput.value : '';
    if (!currentLogo) {
      alert('Primero debes subir una imagen de logo.');
      return;
    }

    try {
      this.showToast('🍌 Procesando y eliminando fondo con Nano Banana...');
      const transparentLogo = await GeminiService.removeBackgroundFromImage(currentLogo);

      const preview = document.getElementById('settings-logo-preview');
      if (preview) preview.src = transparentLogo;
      if (hiddenInput) hiddenInput.value = transparentLogo;

      const settings = DB.getSettings();
      settings.logoUrl = transparentLogo;
      DB.saveSettings(settings);
      this.updateHeaderBrand();
      this.showToast('✨ ¡Fondo eliminado con éxito!');
    } catch (e) {
      console.error('Error al remover fondo:', e);
      alert('No se pudo procesar el fondo: ' + e.message);
    }
  },

  // Quitar logo
  removeLogo() {
    const preview = document.getElementById('settings-logo-preview');
    const hiddenInput = document.getElementById('set-business-logo');
    const removeBgBtn = document.getElementById('remove-bg-btn');

    if (preview) preview.src = 'assets/icons/logo.png';
    if (hiddenInput) hiddenInput.value = '';
    if (removeBgBtn) removeBgBtn.disabled = true;

    const settings = DB.getSettings();
    settings.logoUrl = '';
    DB.saveSettings(settings);
    this.updateHeaderBrand();
    this.showToast('Logo restablecido al predeterminado');
    this.renderCurrentTab(true);
  },

  // Actualizar logo y nombre en header
  updateHeaderBrand() {
    const settings = DB.getSettings();
    const logoEl = document.getElementById('header-brand-logo');
    const nameEl = document.getElementById('header-brand-name');

    if (logoEl) {
      logoEl.src = settings.logoUrl || 'assets/icons/logo.png';
    }
    if (nameEl) {
      nameEl.textContent = settings.businessName || 'Gestión Pastelera';
    }
  },

  // Helpers de Bloqueo de Scroll al Abrir/Cerrar Modales en Móviles
  lockBodyScroll() {
    document.body.classList.add('modal-open');
  },

  unlockBodyScroll() {
    // Verificar si queda algún modal abierto antes de desbloquear
    const openModals = document.querySelectorAll('#modals-root > div:not(.hidden), #recipe-editor-modal:not(.hidden), #quote-editor-modal:not(.hidden), #ingredient-modal:not(.hidden), #recipe-scaling-modal:not(.hidden), #recipe-scanner-modal:not(.hidden), #receipt-scanner-modal:not(.hidden), #market-custom-search-modal:not(.hidden), #market-store-manager-modal:not(.hidden), #firebase-config-modal:not(.hidden), #gemini-api-modal:not(.hidden)');
    if (!openModals || openModals.length === 0) {
      document.body.classList.remove('modal-open');
    }
  },

  // Modo Oscuro / Claro (Modo Claro por defecto)
  initDarkMode() {
    const isDark = localStorage.getItem('cakekulator_dark_mode') === 'true';

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateDarkModeIcon();
  },

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cakekulator_dark_mode', 'true');
      this.showToast('🌙 Modo Oscuro activado');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cakekulator_dark_mode', 'false');
      this.showToast('☀️ Modo Claro activado');
    }
    this.updateDarkModeIcon();
    if (this.currentTab === 'settings') {
      this.renderSettings();
    }
  },

  toggleDarkMode() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    this.setTheme(isCurrentlyDark ? 'light' : 'dark');
  },

  updateDarkModeIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      const isDark = document.documentElement.classList.contains('dark');
      icon.textContent = isDark ? '☀️' : '🌙';
    }
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
  },

  // ==========================================
  // Manejo de Modales y Gestos "Atrás" en Móvil
  // ==========================================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    this.lockBodyScroll();
    // Registrar estado en el historial del navegador para soporte de botón Atrás
    try {
      history.pushState({ modalOpen: true, modalId: modalId }, '');
    } catch (e) {
      console.warn('Error en history.pushState:', e);
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
    this.unlockBodyScroll();
    // Limpiar entrada del historial si corresponde
    if (history.state && history.state.modalOpen && history.state.modalId === modalId) {
      history.back();
    }
  },

  closeAllModals() {
    const modalIds = [
      'ingredient-modal',
      'recipe-editor-modal',
      'recipe-scaling-modal',
      'recipe-scanner-modal',
      'receipt-scanner-modal',
      'quote-editor-modal',
      'quote-whatsapp-modal',
      'quote-print-modal',
      'market-custom-search-modal',
      'market-store-manager-modal',
      'firebase-config-modal',
      'gemini-key-modal',
      'login-prompt-modal',
      'sim-add-to-quote-modal'
    ];
    let closedAny = false;
    modalIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden');
        closedAny = true;
      }
    });
    this.unlockBodyScroll();
    return closedAny;
  },

  initBackAndScrollHandler() {
    let isScrolledPushed = false;

    // Detectar si el usuario baja en la pantalla en móvil para que "Atrás" lo devuelva al top
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 250 && !isScrolledPushed && (!history.state || !history.state.modalOpen)) {
        try {
          history.pushState({ isScrolled: true }, '');
          isScrolledPushed = true;
        } catch (e) { }
      } else if (scrollY <= 80 && isScrolledPushed) {
        isScrolledPushed = false;
      }
    }, { passive: true });

    // Escuchar evento popstate (botón atrás físico o gesto de swipe en Android/iOS)
    window.addEventListener('popstate', (e) => {
      // 1. Si hay algún modal abierto, cerrarlo inmediatamente y permanecer en la pantalla base
      const closed = this.closeAllModals();
      if (closed) {
        return;
      }

      // 2. Si el usuario está abajo del todo / scrolleado en pantalla móvil, llevarlo al inicio
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      if (currentScroll > 100) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        isScrolledPushed = false;
      }
    });
  }
};

// Auto inicio al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
