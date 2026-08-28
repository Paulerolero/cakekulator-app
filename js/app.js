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

    // Inicializar navegación táctil por gestos (Swipe)
    this.initGestures();

    // Inicializar autenticación y sesión con Google / Firebase
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
    }

    // Inicializar Modo Oscuro / Claro
    this.initDarkMode();

    // Actualizar Logo / Nombre en Header
    this.updateHeaderBrand();

    // Navegación con botón atrás / gestos móviles para modales y scroll
    this.initBackAndScrollHandler();

    // Actualizar visibilidad de pestañas protegidas (Presupuesto, Finanzas, Radar)
    this.updateNavVisibility();

    // Renderizar pestaña inicial
    this.switchTab('dashboard');

    console.log('Cakekulator cargado correctamente con control de gestos.');
  },

  updateNavVisibility() {
    // Todos los módulos principales están disponibles en modo local y en la nube
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('hidden');
    });
  },

  initGestures() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isTracking = false;

    const getTabsOrder = () => {
      return ['dashboard', 'simulator', 'quotes', 'recipes', 'ingredients', 'market-radar', 'customers', 'finance'];
    };

    const isInteractiveElement = (target) => {
      if (!target || !(target instanceof Element)) return false;
      
      // Sliders y controles interactivos
      if (target.closest('input[type="range"], .accent-pink-500')) return true;
      if (target.closest('input, textarea, select, option, [contenteditable="true"]')) return true;
      
      // Modales activos abiertos
      const openModal = document.querySelector('#recipe-editor-modal:not(.hidden), #quote-editor-modal:not(.hidden), #customer-detail-modal, #customer-editor-modal, #customer-whatsapp-modal, #ingredient-modal:not(.hidden), #quote-whatsapp-modal:not(.hidden), #quote-print-modal:not(.hidden), #recipe-scanner-modal:not(.hidden), #receipt-scanner-modal:not(.hidden), #custom-search-modal:not(.hidden), #store-manager-modal:not(.hidden), #firebase-config-modal:not(.hidden)');
      if (openModal) return true;

      // Tablas o contenedores con scroll horizontal propio
      const scrollableX = target.closest('.overflow-x-auto, [style*="overflow-x: auto"]');
      if (scrollableX && scrollableX.scrollWidth > scrollableX.clientWidth) return true;

      return false;
    };

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      if (isInteractiveElement(e.target)) {
        isTracking = false;
        return;
      }

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isTracking = true;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!isTracking || e.changedTouches.length !== 1) return;
      isTracking = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const elapsedTime = Date.now() - startTime;

      // Umbrales para gesto de swipe horizontal
      const minDistance = 60;
      const maxPerpendicular = 50;
      const maxDuration = 400;

      if (Math.abs(diffX) >= minDistance && Math.abs(diffY) <= maxPerpendicular && elapsedTime <= maxDuration) {
        const tabsOrder = getTabsOrder();
        const currentIndex = tabsOrder.indexOf(this.currentTab);
        if (currentIndex === -1) return;

        if (diffX < 0) {
          // Deslizar hacia la izquierda (avanza a la siguiente pestaña)
          if (currentIndex < tabsOrder.length - 1) {
            const nextTab = tabsOrder[currentIndex + 1];
            this.switchTab(nextTab, true, 'slide-left');
          }
        } else {
          // Deslizar hacia la derecha (retrocede a la pestaña anterior)
          if (currentIndex > 0) {
            const prevTab = tabsOrder[currentIndex - 1];
            this.switchTab(prevTab, true, 'slide-right');
          }
        }
      }
    }, { passive: true });
  },

  switchTab(tabName, scrollToTop = true, direction = 'none') {
    this.currentTab = tabName;

    const views = ['dashboard-view', 'quotes-view', 'customers-view', 'recipes-view', 'ingredients-view', 'simulator-view', 'market-radar-view', 'finance-view', 'settings-view'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    // Mostrar la vista activa con animación fluida
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

    // Ocultar barra de navegación móvil en el Inicio (dashboard) y mostrarla en las demás pantallas
    const mobileNav = document.getElementById('mobile-bottom-nav') || document.querySelector('nav.md\\:hidden');
    if (mobileNav) {
      if (tabName === 'dashboard') {
        mobileNav.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
        mobileNav.classList.remove('translate-y-0', 'opacity-100');
        document.body.classList.add('is-dashboard-active');
      } else {
        mobileNav.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        mobileNav.classList.add('translate-y-0', 'opacity-100');
        document.body.classList.remove('is-dashboard-active');
      }
    }

    // Actualizar estilos de los botones de navegación (desktop y móvil)
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const btnTab = btn.dataset.tab;
      if (btnTab === tabName) {
        btn.classList.add('nav-active', 'text-pink-600', 'dark:text-pink-400', 'font-black');
        btn.classList.remove('text-gray-400', 'dark:text-slate-500', 'font-medium', 'text-gray-500');
      } else {
        btn.classList.remove('nav-active', 'text-pink-600', 'dark:text-pink-400', 'font-black', 'bg-pink-50/80');
        btn.classList.add('text-gray-400', 'dark:text-slate-500', 'font-medium');
      }
    });

    // Renderizar módulo correspondiente
    switch (tabName) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'finance':
        if (typeof FinanceModule !== 'undefined') {
          FinanceModule.render();
        }
        break;
      case 'quotes':
        QuotesModule.render();
        break;
      case 'customers':
        if (typeof CustomersModule !== 'undefined') {
          CustomersModule.render();
        }
        break;
      case 'recipes':
        RecipesModule.render();
        break;
      case 'ingredients':
        IngredientsModule.render();
        break;
      case 'simulator':
        if (typeof SimulatorModule !== 'undefined') {
          SimulatorModule.render('simulator-view');
        }
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

  // ==========================================
  // Catálogo y Personalización de Acciones Rápidas
  // ==========================================
  QUICK_ACTIONS_CATALOG: [
    {
      id: 'new_quote',
      title: '+ Nueva Cotización',
      shortTitle: '+ Cotización',
      icon: '📋',
      colorClass: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
      description: 'Abre el creador de cotizaciones y presupuestos en PDF',
      handler: "App.switchTab('quotes'); setTimeout(() => QuotesModule.openEditor(), 80);"
    },
    {
      id: 'new_recipe',
      title: '+ Nueva Receta',
      shortTitle: '+ Receta',
      icon: '🎂',
      colorClass: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border-purple-200/80 dark:border-purple-800 text-purple-800 dark:text-purple-200',
      description: 'Crea una nueva ficha técnica con costeo exacto por porción',
      handler: "App.switchTab('recipes'); setTimeout(() => RecipesModule.openEditor(), 80);"
    },
    {
      id: 'new_customer',
      title: '+ Nuevo Cliente',
      shortTitle: '+ Cliente',
      icon: '👥',
      colorClass: 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/50 border-pink-200/80 dark:border-pink-800 text-pink-800 dark:text-pink-200',
      description: 'Registra un cliente con fechas de cumpleaños y notas',
      handler: "App.switchTab('customers'); setTimeout(() => CustomersModule.openCustomerEditor(), 80);"
    },
    {
      id: 'simulator',
      title: 'Simular Precio',
      shortTitle: 'Simulador',
      icon: '🧮',
      colorClass: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200/80 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      description: 'Calcula márgenes netos, moldes y precio sugerido',
      handler: "App.switchTab('simulator');"
    },
    {
      id: 'new_ingredient',
      title: '+ Nuevo Insumo',
      shortTitle: '+ Insumo',
      icon: '📦',
      colorClass: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-200',
      description: 'Registra un insumo o empaque con precio por kg/ml/un',
      handler: "App.switchTab('ingredients'); setTimeout(() => IngredientsModule.openEditor(), 80);"
    },
    {
      id: 'scan_recipe_ia',
      title: 'Lector IA Recetas',
      shortTitle: 'Lector IA',
      icon: '✨',
      colorClass: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border-indigo-200/80 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200',
      description: 'Digitaliza recetas escritas a mano o fotos con IA',
      handler: "App.switchTab('recipes'); setTimeout(() => RecipeScannerModule.openModal(), 80);"
    },
    {
      id: 'scan_receipt_ocr',
      title: 'Escanear Boleta',
      shortTitle: 'Boleta OCR',
      icon: '🧾',
      colorClass: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border-cyan-200/80 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200',
      description: 'Escanea boletas de compras para actualizar precios de insumos',
      handler: "App.switchTab('ingredients'); setTimeout(() => ReceiptScannerModule.openModal(), 80);"
    },
    {
      id: 'market_radar',
      title: 'Radar de Ofertas',
      shortTitle: 'Ofertas',
      icon: '🛒',
      colorClass: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 border-orange-200/80 dark:border-orange-800 text-orange-800 dark:text-orange-200',
      description: 'Compara precios en supermercados y distribuidoras',
      handler: "App.switchTab('market-radar');"
    },
    {
      id: 'view_finances',
      title: 'Ver Finanzas',
      shortTitle: 'Finanzas',
      icon: '📊',
      colorClass: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-200',
      description: 'Revisa ingresos, costos mensuales y rentabilidad',
      handler: "App.switchTab('finance');"
    },
    {
      id: 'settings_workshop',
      title: 'Ajustes de Taller',
      shortTitle: 'Ajustes',
      icon: '⚙️',
      colorClass: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
      description: 'Configura valor hora, comisiones de pago y logo',
      handler: "App.switchTab('settings');"
    }
  ],

  getEnabledQuickActionIds() {
    const settings = DB.getSettings();
    if (Array.isArray(settings.enabledQuickActions) && settings.enabledQuickActions.length > 0) {
      return settings.enabledQuickActions;
    }
    return ['new_quote', 'new_recipe', 'new_customer', 'simulator'];
  },

  saveEnabledQuickActionIds(actionIds) {
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      actionIds = ['new_quote', 'new_recipe', 'new_customer', 'simulator'];
    }
    const settings = DB.getSettings();
    settings.enabledQuickActions = actionIds;
    DB.saveSettings(settings);
    this.renderDashboard();
    this.showToast('Acciones rápidas actualizadas');
  },

  openQuickActionsConfigModal() {
    const root = document.getElementById('modals-root') || document.body;
    let modal = document.getElementById('quick-actions-config-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quick-actions-config-modal';
      root.appendChild(modal);
    }

    const currentEnabled = this.getEnabledQuickActionIds();

    modal.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-pink-100 dark:border-slate-700 overflow-hidden animate-scale-up">
        
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-pink-50/70 to-rose-50/40 dark:from-slate-800 dark:to-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center text-xl shadow-2xs">
              ⚡
            </div>
            <div>
              <h3 class="text-base font-black text-gray-900 dark:text-gray-100">Personalizar Acciones Rápidas</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">Elige qué atajos quieres ver en la pantalla de inicio</p>
            </div>
          </div>
          <button 
            type="button" 
            onclick="App.closeQuickActionsConfigModal()" 
            class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-500 dark:text-gray-300 font-bold flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Presets -->
        <div class="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
          <span class="text-[11px] text-gray-500 font-medium">Atajos rápidos:</span>
          <div class="flex items-center gap-1.5">
            <button 
              type="button"
              onclick="App.setQuickActionsPreset('default')" 
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
            >
              Básicos (4)
            </button>
            <button 
              type="button"
              onclick="App.setQuickActionsPreset('all')" 
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
            >
              Todos (10)
            </button>
          </div>
        </div>

        <!-- Lista de Acciones con Checkboxes -->
        <form id="quick-actions-form" onsubmit="event.preventDefault(); App.saveQuickActionsForm();" class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
          ${this.QUICK_ACTIONS_CATALOG.map(action => {
            const isChecked = currentEnabled.includes(action.id);
            return `
              <label class="qa-item-label flex items-start gap-3 p-3 rounded-2xl border ${isChecked ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-300 dark:border-pink-800/80 shadow-2xs' : 'bg-gray-50/60 dark:bg-slate-900/40 border-gray-100 dark:border-slate-700/60'} hover:border-pink-300 transition cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  name="quick_action" 
                  value="${action.id}" 
                  ${isChecked ? 'checked' : ''} 
                  onchange="App.onQuickActionToggle(this)"
                  class="mt-1 w-4 h-4 rounded text-pink-600 focus:ring-pink-500 accent-pink-600 shrink-0 cursor-pointer"
                >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-base shrink-0">${action.icon}</span>
                    <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">${action.title}</span>
                  </div>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    ${action.description}
                  </p>
                </div>
              </label>
            `;
          }).join('')}
        </form>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="App.closeQuickActionsConfigModal()" 
            class="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onclick="App.saveQuickActionsForm()" 
            class="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>💾</span> Guardar Selección
          </button>
        </div>

      </div>
    `;
    modal.classList.remove('hidden');
  },

  onQuickActionToggle(inputEl) {
    const label = inputEl.closest('.qa-item-label');
    if (!label) return;
    if (inputEl.checked) {
      label.classList.add('bg-pink-50/50', 'dark:bg-pink-950/20', 'border-pink-300', 'dark:border-pink-800/80', 'shadow-2xs');
      label.classList.remove('bg-gray-50/60', 'dark:bg-slate-900/40', 'border-gray-100', 'dark:border-slate-700/60');
    } else {
      label.classList.remove('bg-pink-50/50', 'dark:bg-pink-950/20', 'border-pink-300', 'dark:border-pink-800/80', 'shadow-2xs');
      label.classList.add('bg-gray-50/60', 'dark:bg-slate-900/40', 'border-gray-100', 'dark:border-slate-700/60');
    }
  },

  closeQuickActionsConfigModal() {
    const modal = document.getElementById('quick-actions-config-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  setQuickActionsPreset(preset) {
    const checkboxes = document.querySelectorAll('#quick-actions-form input[type="checkbox"]');
    if (preset === 'default') {
      const defaults = ['new_quote', 'new_recipe', 'new_customer', 'simulator'];
      checkboxes.forEach(cb => {
        cb.checked = defaults.includes(cb.value);
        this.onQuickActionToggle(cb);
      });
    } else if (preset === 'all') {
      checkboxes.forEach(cb => {
        cb.checked = true;
        this.onQuickActionToggle(cb);
      });
    }
  },

  saveQuickActionsForm() {
    const checkboxes = document.querySelectorAll('#quick-actions-form input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    if (selectedIds.length === 0) {
      this.showToast('Selecciona al menos 1 acción rápida');
      return;
    }
    this.saveEnabledQuickActionIds(selectedIds);
    this.closeQuickActionsConfigModal();
  },

  renderDashboard() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const recipes = DB.getRecipes();
    const ingredients = DB.getIngredients();
    const quotes = DB.getQuotes();
    const customers = DB.getCustomers();
    const settings = DB.getSettings();
    const upcomingEvents = typeof CustomersModule !== 'undefined' ? CustomersModule.getUpcomingEvents(30) : [];

    // Estadísticas rápidas
    let totalStockValue = 0;
    ingredients.forEach(i => totalStockValue += (Number(i.packagePrice) || 0));

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const formattedToday = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    // Acciones Rápidas Seleccionadas por el Usuario
    const enabledActionIds = this.getEnabledQuickActionIds();
    const enabledActions = enabledActionIds
      .map(id => this.QUICK_ACTIONS_CATALOG.find(a => a.id === id))
      .filter(Boolean);

    // ==========================================
    // Calcular Fechas Importantes & Seguimiento
    // ==========================================
    const importantEvents = [];

    // 1. Entregas de Pedidos Aprobados / Aceptados
    quotes.forEach(q => {
      if (q.status === 'approved' && q.eventDate) {
        const parts = q.eventDate.split('-');
        if (parts.length === 3) {
          const eventDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const diffTime = eventDateObj.getTime() - todayMidnight.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= -2 && diffDays <= 45) {
            importantEvents.push({
              type: 'delivery',
              title: q.eventName || 'Pedido ' + (q.code || ''),
              customerName: q.customerName || 'Cliente',
              customerPhone: q.customerPhone || '',
              date: q.eventDate,
              formattedDate: eventDateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
              daysLeft: diffDays,
              amount: Number(q.total) || 0,
              deposit: Number(q.depositAmount) || 0,
              balance: Number(q.remainingBalance) || 0,
              quoteId: q.id,
              code: q.code || 'COT',
              statusLabel: 'Entrega Aceptada'
            });
          }
        }
      }

      // 2. Cotizaciones Enviadas sin Respuesta (Pendientes)
      if (q.status === 'sent') {
        let diffDays = null;
        let formattedDate = 'Fecha pendiente';
        if (q.eventDate) {
          const parts = q.eventDate.split('-');
          if (parts.length === 3) {
            const eventDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const diffTime = eventDateObj.getTime() - todayMidnight.getTime();
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            formattedDate = eventDateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
          }
        }

        importantEvents.push({
          type: 'pending_quote',
          title: q.eventName || 'Presupuesto ' + (q.code || ''),
          customerName: q.customerName || 'Cliente',
          customerPhone: q.customerPhone || '',
          date: q.eventDate || '',
          formattedDate,
          daysLeft: diffDays,
          amount: Number(q.total) || 0,
          quoteId: q.id,
          code: q.code || 'COT',
          statusLabel: 'Esperando Respuesta'
        });
      }
    });

    // 3. Fechas Especiales & Cumpleaños (CRM) - Solo Clientes Favoritos ⭐
    upcomingEvents.forEach(evt => {
      if (evt.isFavorite) {
        importantEvents.push({
          type: 'birthday',
          title: evt.title,
          customerName: evt.customerName,
          customerPhone: evt.customerPhone || '',
          customerId: evt.customerId,
          formattedDate: evt.formattedDate,
          daysLeft: evt.daysLeft,
          isFavorite: true,
          statusLabel: evt.type === 'birthday' ? 'Cumpleaños' : 'Aniversario'
        });
      }
    });

    // Ordenar por urgencia
    importantEvents.sort((a, b) => {
      const da = a.daysLeft !== null ? a.daysLeft : 999;
      const db = b.daysLeft !== null ? b.daysLeft : 999;
      return da - db;
    });

    const deliveriesCount = importantEvents.filter(e => e.type === 'delivery').length;
    const pendingSentCount = importantEvents.filter(e => e.type === 'pending_quote').length;
    const birthdaysCount = importantEvents.filter(e => e.type === 'birthday').length;

    container.innerHTML = `
      <!-- Hero Banner Pastelero Dinámico -->
      <div class="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 dark:from-pink-800 dark:via-rose-900 dark:to-pink-900 rounded-3xl p-5 sm:p-7 text-white shadow-lg mb-5 sm:mb-6">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 sm:gap-5 min-w-0">
            ${settings.logoUrl ? `
              <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-md ring-2 ring-white/60 shrink-0 flex items-center justify-center overflow-hidden">
                <img src="${settings.logoUrl}" alt="Logo ${settings.businessName || ''}" class="w-full h-full object-contain">
              </div>
            ` : `
              <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-inner">
                🎂
              </div>
            `}
            <div class="min-w-0">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-xs font-semibold text-pink-100 mb-1 capitalize">
                <span>📅</span> ${formattedToday}
              </div>
              <h1 class="text-xl sm:text-3xl font-black leading-tight truncate">
                ${settings.businessName || 'Mi Pastelería Artesanal'}
              </h1>
              <p class="text-pink-100 text-xs sm:text-sm mt-0.5 leading-snug line-clamp-2">
                Centro de control pastelero: Costea, presupuesta, cotiza y gestiona a tus clientes en un solo lugar.
              </p>
            </div>
          </div>

          <!-- Acceso Directo de Configuración del Negocio -->
          <button 
            type="button" 
            onclick="App.switchTab('settings')" 
            class="self-start md:self-center px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 rounded-2xl text-xs font-bold transition flex items-center gap-2 text-white shadow-2xs cursor-pointer"
          >
            <span>⚙️</span> Personalizar Taller
          </button>
        </div>

        <div class="absolute -right-4 -bottom-6 opacity-15 sm:opacity-20 text-7xl sm:text-9xl pointer-events-none select-none">
          🧁
        </div>
      </div>

      <!-- Barra de Acciones Rápidas (⚡ Personalizable por el usuario) -->
      <div class="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 dark:border-slate-700 mb-5 sm:mb-6 shadow-xs">
        <div class="flex items-center justify-between gap-2 mb-2.5 px-1">
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
            <span>⚡</span> Acciones Rápidas
          </span>
          <button 
            type="button" 
            onclick="App.openQuickActionsConfigModal()" 
            class="text-[11px] text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-pink-50/70 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 px-2.5 py-1 rounded-xl border border-pink-200/80 dark:border-pink-800 transition shadow-2xs active:scale-95"
            title="Elegir qué botones ver en acciones rápidas"
          >
            <span>⚙️</span> Personalizar
          </button>
        </div>
        
        ${enabledActions.length === 0 ? `
          <div class="text-center py-4 text-xs text-gray-400">
            No tienes acciones rápidas seleccionadas. 
            <button onclick="App.openQuickActionsConfigModal()" class="text-pink-600 font-bold underline ml-1">Configurar atajos</button>
          </div>
        ` : `
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
            ${enabledActions.map(action => `
              <button 
                type="button" 
                onclick="${action.handler}"
                class="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${action.colorClass} border text-xs font-bold transition flex items-center gap-2 group active:scale-95 cursor-pointer shadow-2xs text-left"
              >
                <span class="text-base sm:text-lg group-hover:scale-110 transition shrink-0">${action.icon}</span>
                <span class="truncate">${action.title}</span>
              </button>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Botonera Compacta de Módulos (Keypad de Navegación) -->
      <div class="mb-5 sm:mb-6">
        <div class="flex items-center justify-between gap-2 mb-2.5 px-1">
          <h2 class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>✨</span> Módulos de Cakekulator
          </h2>
          <span class="text-[11px] text-gray-400">Acceso rápido</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          
          <!-- 1. Cotizaciones -->
          <button 
            type="button"
            onclick="App.switchTab('quotes')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-emerald-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              📋
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Cotizaciones</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">${quotes.length} registradas</span>
            </div>
          </button>

          <!-- 2. Clientes -->
          <button 
            type="button"
            onclick="App.switchTab('customers')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              👥
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Clientes</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">${customers.length} perfiles</span>
            </div>
          </button>

          <!-- 3. Recetas -->
          <button 
            type="button"
            onclick="App.switchTab('recipes')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-purple-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              🎂
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Recetas</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">${recipes.length} fichas</span>
            </div>
          </button>

          <!-- 4. Insumos -->
          <button 
            type="button"
            onclick="App.switchTab('ingredients')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              📦
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Insumos</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">${ingredients.length} materias</span>
            </div>
          </button>

          <!-- 5. Simulador -->
          <button 
            type="button"
            onclick="App.switchTab('simulator')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-blue-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              🧮
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Simulador</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">Precios y márgenes</span>
            </div>
          </button>

          <!-- 6. Ofertas -->
          <button 
            type="button"
            onclick="App.switchTab('market-radar')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-orange-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              🛒
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Ofertas</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">Supermercados</span>
            </div>
          </button>

          <!-- 7. Finanzas -->
          <button 
            type="button"
            onclick="App.switchTab('finance')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              📊
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Finanzas</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">KPIs y costos</span>
            </div>
          </button>

          <!-- 8. Ajustes -->
          <button 
            type="button"
            onclick="App.switchTab('settings')" 
            class="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-50/70 dark:hover:bg-slate-700/60 border border-gray-100 dark:border-slate-700/80 shadow-2xs hover:shadow-xs active:scale-95 transition duration-150 flex items-center gap-2.5 cursor-pointer group text-left"
          >
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-200 flex items-center justify-center text-lg sm:text-xl shrink-0 group-hover:scale-110 transition duration-150">
              ⚙️
            </div>
            <div class="min-w-0 flex-1">
              <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate block">Ajustes</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-400 block truncate">Taller y nube</span>
            </div>
          </button>

        </div>
      </div>

      <!-- Nuevo Apartado: 📅 Agenda de Fechas Importantes & Seguimiento -->
      <div class="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-700 shadow-xs mb-5 sm:mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 class="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>📅</span> Agenda & Fechas Importantes
            </h3>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Entregas de pedidos agendados, cotizaciones sin respuesta y cumpleaños de clientes.
            </p>
          </div>

          <!-- Píldoras de Conteo de Alertas -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
              <span>🚚</span> ${deliveriesCount} Entregas
            </span>
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1">
              <span>⏳</span> ${pendingSentCount} Por Confirmar
            </span>
            <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/60 flex items-center gap-1">
              <span>⭐</span> ${birthdaysCount} Favoritos VIP
            </span>
          </div>
        </div>

        ${importantEvents.length === 0 ? `
          <div class="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
            <span class="text-3xl block mb-2">🎉</span>
            ¡Estás completamente al día! No tienes entregas pendientes ni fechas de clientes favoritos este mes.
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${importantEvents.slice(0, 6).map(evt => {
              const isDelivery = evt.type === 'delivery';
              const isPending = evt.type === 'pending_quote';
              const isBday = evt.type === 'birthday';

              let cardBg = 'bg-gray-50/70 dark:bg-slate-900/60 border-gray-200/80 dark:border-slate-700/80';
              let badgeBg = 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300';
              let icon = '📅';

              if (isDelivery) {
                cardBg = 'bg-emerald-50/40 dark:bg-slate-900/60 border-emerald-200/70 dark:border-slate-700 hover:border-emerald-400';
                badgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60';
                icon = '🚚';
              } else if (isPending) {
                cardBg = 'bg-amber-50/40 dark:bg-slate-900/60 border-amber-200/70 dark:border-slate-700 hover:border-amber-400';
                badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60';
                icon = '⏳';
              } else if (isBday) {
                cardBg = 'bg-pink-50/40 dark:bg-slate-900/60 border-pink-200/70 dark:border-slate-700 hover:border-pink-400';
                badgeBg = 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/60';
                icon = '⭐';
              }

              let daysBadgeHtml = '';
              if (evt.daysLeft !== null && evt.daysLeft !== undefined) {
                if (evt.daysLeft === 0) {
                  daysBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">¡Entrega Hoy!</span>`;
                } else if (evt.daysLeft === 1) {
                  daysBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-white">¡Mañana!</span>`;
                } else if (evt.daysLeft < 0) {
                  daysBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300">Hace ${Math.abs(evt.daysLeft)}d</span>`;
                } else if (evt.daysLeft <= 3) {
                  daysBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">En ${evt.daysLeft} días</span>`;
                } else {
                  daysBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">En ${evt.daysLeft} días</span>`;
                }
              }

              return `
                <div class="p-3.5 rounded-2xl border ${cardBg} transition flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div>
                    <div class="flex items-center justify-between gap-1.5 mb-1.5">
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-black ${badgeBg} flex items-center gap-1">
                        <span>${icon}</span> ${evt.statusLabel}
                      </span>
                      ${daysBadgeHtml}
                    </div>

                    <div class="min-w-0">
                      <h4 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                        ${evt.customerName} <span class="text-amber-500 text-xs">⭐</span>
                      </h4>
                      <p class="text-[11px] text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        ${evt.title}
                      </p>
                      ${evt.formattedDate ? `
                        <span class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 block mt-0.5">
                          📅 Fecha: ${evt.formattedDate}
                        </span>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Footer con Acciones Directas -->
                  <div class="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                    ${isDelivery ? `
                      <div>
                        <span class="text-[10px] text-gray-400 block">Total: ${Calculator.formatCurrency(evt.amount)}</span>
                        ${evt.balance > 0 ? `<span class="text-[10px] font-bold text-emerald-600 block">Saldo: ${Calculator.formatCurrency(evt.balance)}</span>` : ''}
                      </div>
                      <div class="flex items-center gap-1">
                        <button 
                          type="button" 
                          onclick="App.sendWhatsAppDeliveryCoordination('${evt.customerPhone}', '${evt.customerName}', '${evt.title}', '${evt.formattedDate}')"
                          class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Coordinar entrega por WhatsApp"
                        >
                          <span>💬</span> Coordinar
                        </button>
                        <button 
                          type="button" 
                          onclick="App.switchTab('quotes'); setTimeout(() => QuotesModule.openEditor('${evt.quoteId}'), 80);"
                          class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 text-xs cursor-pointer"
                          title="Ver cotización"
                        >
                          📋
                        </button>
                      </div>
                    ` : isPending ? `
                      <div>
                        <span class="text-[10px] text-gray-400 block">${evt.code}</span>
                        <span class="text-[11px] font-bold text-gray-800 dark:text-gray-200 block">${Calculator.formatCurrency(evt.amount)}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button 
                          type="button" 
                          onclick="App.sendWhatsAppFollowUp('${evt.customerPhone}', '${evt.customerName}', '${evt.code}', '${evt.title}')"
                          class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <span>💬</span> Recordar
                        </button>
                        <button 
                          type="button" 
                          onclick="App.switchTab('quotes'); setTimeout(() => QuotesModule.openEditor('${evt.quoteId}'), 80);"
                          class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 text-xs cursor-pointer"
                          title="Ver cotización"
                        >
                          📋
                        </button>
                      </div>
                    ` : `
                      <span class="text-[10px] text-pink-600 font-bold">⭐ Cliente VIP</span>
                      <button 
                        type="button" 
                        onclick="App.switchTab('customers'); setTimeout(() => CustomersModule.openCustomerDetail('${evt.customerId}'), 80);"
                        class="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>👥</span> Ver Perfil
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  sendWhatsAppFollowUp(customerPhone, customerName, quoteCode, eventName) {
    if (!customerPhone) {
      this.showToast('Este cliente no tiene teléfono registrado');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const settings = DB.getSettings();
    const businessName = settings.businessName || 'nuestro taller';
    const text = encodeURIComponent(`¡Hola ${customerName}! 🎂 Te escribo de ${businessName} para consultar si pudiste revisar el presupuesto #${quoteCode} para ${eventName || 'tu pedido'}. ¡Quedamos muy atentos a tus dudas o comentarios! ✨`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  },

  sendWhatsAppDeliveryCoordination(customerPhone, customerName, eventName, dateStr) {
    if (!customerPhone) {
      this.showToast('Este cliente no tiene teléfono registrado');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const settings = DB.getSettings();
    const businessName = settings.businessName || 'nuestro taller';
    const text = encodeURIComponent(`¡Hola ${customerName}! 🍰 Te escribo de ${businessName} para coordinar la entrega de tu pedido (${eventName || 'Torta / Pastelería'}) agendado para el ${dateStr || 'próximo evento'}. ¡Ya estamos afinando los detalles para que todo salga perfecto! ✨`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
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
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-800 shadow-sm text-sm transition-colors">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        } catch (e) {}
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
