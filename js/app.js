// ==========================================
// Cakekulator - Controlador Principal y Navegación
// ==========================================

const App = {
  currentTab: 'dashboard',
  currentMode: localStorage.getItem('cakekulator_app_mode') || 'products',
  deferredPrompt: null, // Para el banner de instalación PWA

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  sanitizePlainText(value) {
    return String(value ?? '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },

  init() {
    // Inicializar base de datos local
    DB.init();

    // Registrar Service Worker para PWA Offline
    this.registerServiceWorker();

    // Eventos de instalación PWA
    this.initPWAInstall();

    // Inicializar navegación táctil por gestos (Swipe)
    this.initGestures();

    // Inicializar buscador global y atajos de teclado
    this.initGlobalSearch();

    // Inicializar autenticación y sesión con Google / Firebase
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
    }

    // Inicializar notificaciones push y alertas FCM
    if (typeof NotificationsModule !== 'undefined') {
      NotificationsModule.init();
    }

    // Inicializar Modo Oscuro / Claro
    this.initDarkMode();

    // Aplicar clase CSS y textos de navegación según ambiente activo (Productos vs Servicios)
    this.applyModeTheme();

    // Navegación con botón atrás / gestos móviles para modales y scroll
    this.initBackAndScrollHandler();

    // Actualizar visibilidad de pestañas protegidas (Presupuesto, Finanzas, Radar)
    this.updateNavVisibility();

    // Renderizar pestaña inicial
    this.switchTab('dashboard');

    // Si el usuario entra por primera vez sin elegir ambiente, usar el modo productos
    // como valor por defecto para no bloquear la interfaz con un modal inicial.
    if (!localStorage.getItem('cakekulator_app_mode')) {
      localStorage.setItem('cakekulator_app_mode', 'products');
      this.currentMode = 'products';
    }

    console.log('Cakekulator cargado correctamente con control de gestos, buscador y ambientes separados.');
  },

  applyModeTheme() {
    document.body.classList.remove('mode-products', 'mode-services');
    document.body.classList.add(this.currentMode === 'services' ? 'mode-services' : 'mode-products');
    this.updateNavLabels();
    this.updateSidebarBadges();
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
    this.updateHeaderBrand();
    this.closeModeSelectionModal();
    this.renderCurrentTab();
    this.showToast(mode === 'products' 
      ? '🎂 Ambiente: Venta de Productos' 
      : '💆 Ambiente: Prestación de Servicios');
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

    // Desktop Sidebar
    const sIconR = document.getElementById('sidebar-icon-recipes');
    const sTextR = document.getElementById('sidebar-text-recipes');
    const sIconI = document.getElementById('sidebar-icon-ingredients');
    const sTextI = document.getElementById('sidebar-text-ingredients');
    const sIconQ = document.getElementById('sidebar-icon-quotes');
    const sTextQ = document.getElementById('sidebar-text-quotes');

    const sModeBadge = document.getElementById('sidebar-mode-badge');
    const sModeIcon = document.getElementById('sidebar-mode-icon');
    const sModeName = document.getElementById('sidebar-mode-name');

    if (sIconR) sIconR.textContent = recipesIcon;
    if (sTextR) sTextR.textContent = isServ ? 'Servicios & Protocolos' : 'Recetas & Fichas';
    if (sIconI) sIconI.textContent = ingIcon;
    if (sTextI) sTextI.textContent = isServ ? 'Insumos de Cabina' : 'Insumos & Stock';
    if (sIconQ) sIconQ.textContent = quotesIcon;
    if (sTextQ) sTextQ.textContent = isServ ? 'Cotizaciones & Citas' : 'Cotizaciones & Pedidos';

    if (sModeBadge) {
      sModeBadge.textContent = isServ ? '💆 Serv' : '🎂 Prod';
      sModeBadge.className = isServ 
        ? 'px-2 py-0.5 text-[10px] font-black rounded-lg bg-teal-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300'
        : 'px-2 py-0.5 text-[10px] font-black rounded-lg bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300';
    }
    if (sModeIcon) sModeIcon.textContent = isServ ? '💆' : '🎂';
    if (sModeName) sModeName.textContent = isServ ? 'Servicios & Spa' : 'Venta Productos';

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
    const sTitle = document.getElementById('sidebar-brand-title');
    const sName = document.getElementById('sidebar-brand-name');

    const currentBizSettings = DB.getSettings(this.currentMode);
    const titleHtml = isServ 
      ? `Servi<span class="text-teal-600 dark:text-teal-400">kulator</span>` 
      : `Cake<span class="text-pink-600 dark:text-pink-400">kulator</span>`;
    const nameText = this.sanitizePlainText(currentBizSettings.businessName || (isServ ? 'Centro de Estética, Spa & Masajes' : 'Mi Pastelería Artesanal'));

    if (hTitle) hTitle.innerHTML = titleHtml;
    if (hName) hName.textContent = nameText;
    if (sTitle) sTitle.innerHTML = titleHtml;
    if (sName) sName.textContent = nameText;
  },

  updateHeaderBrand() {
    this.updateNavLabels();
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

    // Actualizar estilos de los botones de navegación (desktop sidebar y móvil)
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('sidebar-active');
      } else {
        item.classList.remove('sidebar-active');
      }
    });

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

    // Actualizar encabezado del topbar en Desktop
    this.updateDesktopHeaderInfo(tabName);
    this.updateSidebarBadges();

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

    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainContainer = document.getElementById('app-main-content');
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  },

  updateDesktopHeaderInfo(tabName) {
    const iconEl = document.getElementById('desktop-view-icon');
    const titleEl = document.getElementById('desktop-view-title');
    const subtitleEl = document.getElementById('desktop-view-subtitle');
    const isServ = this.currentMode === 'services';

    const infoMap = {
      'dashboard': {
        icon: '🏠',
        title: 'Dashboard Principal',
        subtitle: 'Resumen operativo, métricas y pedidos del taller'
      },
      'finance': {
        icon: '📊',
        title: 'Finanzas & Rendimiento',
        subtitle: 'Ingresos, costos fijos, ventas netas y rentabilidad'
      },
      'recipes': {
        icon: isServ ? '💆' : '🎂',
        title: isServ ? 'Servicios & Protocolos' : 'Recetario & Fichas Técnicas',
        subtitle: isServ ? 'Catálogo de sesiones y costos de cabina' : 'Fichas técnicas con costeo por porción y margenes'
      },
      'ingredients': {
        icon: isServ ? '🧴' : '📦',
        title: isServ ? 'Insumos de Cabina & Descartables' : 'Insumos & Inventario',
        subtitle: isServ ? 'Precios por ml/aplicación y rendimiento' : 'Precios por kg/lt, rendimiento y mermas'
      },
      'simulator': {
        icon: '🧮',
        title: 'Simulador de Precios',
        subtitle: 'Cálculo de márgenes netos, moldes y precio sugerido'
      },
      'quotes': {
        icon: isServ ? '💬' : '📋',
        title: isServ ? 'Cotizaciones & Presupuestos' : 'Cotizaciones & Pedidos',
        subtitle: isServ ? 'Presupuestos de servicios, abonos y citas' : 'Presupuestos en PDF, abonos y seguimiento de entregas'
      },
      'customers': {
        icon: '👥',
        title: 'Gestión de Clientes (CRM)',
        subtitle: 'Historial de compras, contactos y fechas especiales'
      },
      'market-radar': {
        icon: '🛒',
        title: 'Radar de Ofertas & Precios',
        subtitle: 'Comparador de precios en distribuidoras y tiendas mayoristas'
      },
      'settings': {
        icon: '⚙️',
        title: 'Configuración del Taller',
        subtitle: 'Valor hora, comisiones de pago, notificaciones y nube'
      }
    };

    const info = infoMap[tabName] || infoMap['dashboard'];
    if (iconEl) iconEl.textContent = info.icon;
    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
  },

  initGlobalSearch() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
      if (e.key === 'Escape') {
        this.closeGlobalSearch();
        this.closeQuickCreateDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#global-search-input') && !e.target.closest('#global-search-results')) {
        this.closeGlobalSearch();
      }
      if (!e.target.closest('#quick-create-dropdown') && !e.target.closest('button[onclick*="toggleQuickCreateDropdown"]')) {
        this.closeQuickCreateDropdown();
      }
    });
  },

  closeGlobalSearch() {
    const res = document.getElementById('global-search-results');
    if (res) res.classList.add('hidden');
  },

  handleGlobalSearch(query) {
    const res = document.getElementById('global-search-results');
    if (!res) return;

    const q = (query || '').trim().toLowerCase();
    if (!q) {
      res.innerHTML = `
        <div class="p-4 text-center text-xs text-gray-400">
          Escribe para buscar recetas, insumos, clientes o cotizaciones...
        </div>
      `;
      res.classList.remove('hidden');
      return;
    }

    const recipes = DB.getRecipes().filter(r => (r.name || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q));
    const ingredients = DB.getIngredients().filter(i => (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
    const customers = DB.getCustomers().filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q));
    const quotes = DB.getQuotes().filter(qt => (qt.customerName || '').toLowerCase().includes(q) || (qt.code || '').toLowerCase().includes(q) || (qt.eventName || '').toLowerCase().includes(q));

    const total = recipes.length + ingredients.length + customers.length + quotes.length;

    if (total === 0) {
      res.innerHTML = `
        <div class="p-4 text-center text-xs text-gray-400">
          No se encontraron resultados para "<strong>${this.escapeHtml(query)}</strong>"
        </div>
      `;
      res.classList.remove('hidden');
      return;
    }

    let html = '';

    if (recipes.length > 0) {
      html += `
        <div class="p-2 border-b border-gray-100 dark:border-slate-800">
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">🎂 Recetas & Servicios (${recipes.length})</span>
          <div class="mt-1 space-y-1">
            ${recipes.slice(0, 4).map(r => `
              <button type="button" onclick="App.openSearchResult('recipe', '${r.id}')" class="w-full text-left p-2 rounded-xl hover:bg-pink-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer">
                <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${this.escapeHtml(r.name)}</span>
                <span class="text-[10px] text-pink-600 dark:text-pink-400 font-mono">${r.category || ''}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (ingredients.length > 0) {
      html += `
        <div class="p-2 border-b border-gray-100 dark:border-slate-800">
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">📦 Insumos (${ingredients.length})</span>
          <div class="mt-1 space-y-1">
            ${ingredients.slice(0, 4).map(i => `
              <button type="button" onclick="App.openSearchResult('ingredient', '${i.id}')" class="w-full text-left p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer">
                <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${this.escapeHtml(i.name)}</span>
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-mono">$${(i.packagePrice || 0).toLocaleString('es-CL')}/${i.packageUnit}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (customers.length > 0) {
      html += `
        <div class="p-2 border-b border-gray-100 dark:border-slate-800">
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">👥 Clientes (${customers.length})</span>
          <div class="mt-1 space-y-1">
            ${customers.slice(0, 4).map(c => `
              <button type="button" onclick="App.openSearchResult('customer', '${c.id}')" class="w-full text-left p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer">
                <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${this.escapeHtml(c.name)}</span>
                <span class="text-[10px] text-purple-600 dark:text-purple-400 font-mono">${this.escapeHtml(c.phone || '')}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (quotes.length > 0) {
      html += `
        <div class="p-2">
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2">📋 Cotizaciones (${quotes.length})</span>
          <div class="mt-1 space-y-1">
            ${quotes.slice(0, 4).map(q => `
              <button type="button" onclick="App.openSearchResult('quote', '${q.id}')" class="w-full text-left p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition cursor-pointer">
                <span class="font-bold text-gray-800 dark:text-gray-200 truncate">${this.escapeHtml(q.customerName || 'Cliente')} (${q.code || 'COT'})</span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">$${(q.total || 0).toLocaleString('es-CL')}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    res.innerHTML = html;
    res.classList.remove('hidden');
  },

  openSearchResult(type, id) {
    this.closeGlobalSearch();
    const input = document.getElementById('global-search-input');
    if (input) input.value = '';

    if (type === 'recipe') {
      this.switchTab('recipes');
      setTimeout(() => {
        if (typeof RecipesModule !== 'undefined') RecipesModule.openEditor(id);
      }, 100);
    } else if (type === 'ingredient') {
      this.switchTab('ingredients');
      setTimeout(() => {
        if (typeof IngredientsModule !== 'undefined') IngredientsModule.openModal(id);
      }, 100);
    } else if (type === 'customer') {
      this.switchTab('customers');
      setTimeout(() => {
        if (typeof CustomersModule !== 'undefined') CustomersModule.openCustomerDetail(id);
      }, 100);
    } else if (type === 'quote') {
      this.switchTab('quotes');
      setTimeout(() => {
        if (typeof QuotesModule !== 'undefined') QuotesModule.openEditor(id);
      }, 100);
    }
  },

  toggleQuickCreateDropdown() {
    const dd = document.getElementById('quick-create-dropdown');
    if (dd) dd.classList.toggle('hidden');
  },

  closeQuickCreateDropdown() {
    const dd = document.getElementById('quick-create-dropdown');
    if (dd) dd.classList.add('hidden');
  },

  quickCreateAction(action) {
    this.closeQuickCreateDropdown();
    if (action === 'quote') {
      this.switchTab('quotes');
      setTimeout(() => QuotesModule.openEditor(), 80);
    } else if (action === 'recipe') {
      this.switchTab('recipes');
      setTimeout(() => RecipesModule.openEditor(), 80);
    } else if (action === 'ingredient') {
      this.switchTab('ingredients');
      setTimeout(() => {
        if (this.currentMode === 'services') {
          IngredientsModule.openModal();
        } else {
          IngredientsModule.openEditor();
        }
      }, 80);
    } else if (action === 'customer') {
      this.switchTab('customers');
      setTimeout(() => CustomersModule.openCustomerEditor(), 80);
    } else if (action === 'scan_receipt') {
      this.switchTab('ingredients');
      setTimeout(() => ReceiptScannerModule.openModal(), 80);
    }
  },

  updateSidebarBadges() {
    const recipes = DB.getRecipes();
    const ingredients = DB.getIngredients();
    const quotes = DB.getQuotes();
    const customers = DB.getCustomers();

    const rBadge = document.getElementById('sidebar-badge-recipes');
    const iBadge = document.getElementById('sidebar-badge-ingredients');
    const qBadge = document.getElementById('sidebar-badge-quotes');
    const cBadge = document.getElementById('sidebar-badge-customers');

    if (rBadge) rBadge.textContent = recipes.length;
    if (iBadge) iBadge.textContent = ingredients.length;
    if (cBadge) cBadge.textContent = customers.length;

    if (qBadge) {
      const pendingCount = quotes.filter(q => q.status === 'sent' || q.status === 'approved').length;
      if (pendingCount > 0) {
        qBadge.textContent = pendingCount;
        qBadge.classList.remove('hidden');
      } else {
        qBadge.classList.add('hidden');
      }
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

  getQuickActionsCatalog() {
    const isServices = this.currentMode === 'services';
    if (isServices) {
      return [
        {
          id: 'new_quote',
          title: '+ Nueva Cotización',
          shortTitle: '+ Cotización',
          icon: '📋',
          colorClass: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
          description: 'Abre el creador de cotizaciones para sesiones y protocolos',
          handler: "App.switchTab('quotes'); setTimeout(() => QuotesModule.openEditor(), 80);"
        },
        {
          id: 'new_recipe',
          title: '+ Nuevo Servicio',
          shortTitle: '+ Servicio',
          icon: '💆',
          colorClass: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-200',
          description: 'Crea una ficha de atención con duración, honorarios e insumos',
          handler: "App.switchTab('recipes'); setTimeout(() => RecipesModule.openEditor(), 80);"
        },
        {
          id: 'new_customer',
          title: '+ Nuevo Cliente Spa',
          shortTitle: '+ Cliente',
          icon: '👥',
          colorClass: 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/50 border-pink-200/80 dark:border-pink-800 text-pink-800 dark:text-pink-200',
          description: 'Registra un cliente con ficha estética, zonas de tensión y notas',
          handler: "App.switchTab('customers'); setTimeout(() => CustomersModule.openCustomerEditor(), 80);"
        },
        {
          id: 'simulator',
          title: 'Simular Sesión',
          shortTitle: 'Simulador',
          icon: '⚡',
          colorClass: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200/80 dark:border-blue-800 text-blue-800 dark:text-blue-200',
          description: 'Calcula rentabilidad neta por sesión, hora o paquetes',
          handler: "App.switchTab('simulator');"
        },
        {
          id: 'new_ingredient',
          title: '+ Insumo de Cabina',
          shortTitle: '+ Insumo',
          icon: '🧴',
          colorClass: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-200',
          description: 'Registra cremas, aceites, sueros o desechables por aplicación',
          handler: "App.switchTab('ingredients'); setTimeout(() => IngredientsModule.openModal(), 80);"
        },
        {
          id: 'scan_receipt_ocr',
          title: 'Escanear Boleta',
          shortTitle: 'Boleta OCR',
          icon: '🧾',
          colorClass: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border-cyan-200/80 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200',
          description: 'Escanea boletas de compras para actualizar costos de insumos',
          handler: "App.switchTab('ingredients'); setTimeout(() => ReceiptScannerModule.openModal(), 80);"
        },
        {
          id: 'market_radar',
          title: 'Radar de Insumos',
          shortTitle: 'Ofertas',
          icon: '🛒',
          colorClass: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 border-orange-200/80 dark:border-orange-800 text-orange-800 dark:text-orange-200',
          description: 'Compara precios en distribuidoras y tiendas mayoristas',
          handler: "App.switchTab('market-radar');"
        },
        {
          id: 'view_finances',
          title: 'Ver Finanzas Spa',
          shortTitle: 'Finanzas',
          icon: '📊',
          colorClass: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-200',
          description: 'Revisa ingresos por servicios, ticket promedio y rentabilidad',
          handler: "App.switchTab('finance');"
        },
        {
          id: 'settings_workshop',
          title: 'Ajustes del Centro',
          shortTitle: 'Ajustes',
          icon: '⚙️',
          colorClass: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
          description: 'Configura valor hora, cabina y datos del centro',
          handler: "App.switchTab('settings');"
        }
      ];
    }
    return this.QUICK_ACTIONS_CATALOG;
  },

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
    const actionCatalog = this.getQuickActionsCatalog();

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
              Todos
            </button>
          </div>
        </div>

        <!-- Lista de Acciones con Checkboxes -->
        <form id="quick-actions-form" onsubmit="event.preventDefault(); App.saveQuickActionsForm();" class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
          ${actionCatalog.map(action => {
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

  dashboardChartInstance: null,

  renderDashboard() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const isServicesMode = this.currentMode === 'services';
    const recipes = DB.getRecipes();
    const ingredients = DB.getIngredients();
    const quotes = DB.getQuotes();
    const customers = DB.getCustomers();
    const settings = DB.getSettings();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayMidnight = new Date(currentYear, currentMonth, now.getDate());
    const formattedToday = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    const businessTitle = settings.businessName || (isServicesMode ? 'Centro de Estética, Spa & Masajes' : 'Mi Pastelería Artesanal');
    const safeBusinessTitle = this.escapeHtml(this.sanitizePlainText(businessTitle));

    // ==========================================
    // Cálculo de Métricas Clave (KPIs)
    // ==========================================
    const approvedQuotes = quotes.filter(q => q.status === 'approved');
    
    // Ventas del Mes en Curso
    const currentMonthQuotes = approvedQuotes.filter(q => {
      if (!q.createdAt && !q.eventDate) return false;
      const dateStr = q.eventDate || q.createdAt;
      const d = new Date(dateStr);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthSalesTotal = currentMonthQuotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
    const allTimeSalesTotal = approvedQuotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
    const avgTicket = currentMonthQuotes.length > 0 
      ? monthSalesTotal / currentMonthQuotes.length 
      : (approvedQuotes.length > 0 ? allTimeSalesTotal / approvedQuotes.length : 0);

    // Acciones Rápidas Seleccionadas por el Usuario
    const enabledActionIds = this.getEnabledQuickActionIds();
    const actionCatalog = this.getQuickActionsCatalog();
    const enabledActions = enabledActionIds
      .map(id => actionCatalog.find(a => a.id === id))
      .filter(Boolean);

    // ==========================================
    // Calcular Fechas Importantes & Seguimiento
    // ==========================================
    const upcomingEvents = (typeof CustomersModule !== 'undefined' && typeof CustomersModule.getUpcomingEvents === 'function')
      ? CustomersModule.getUpcomingEvents(30)
      : [];
    const importantEvents = [];

    // 1. Entregas / Citas de Pedidos Aprobados
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
              title: q.eventName || (isServicesMode ? ('Cita ' + (q.code || '')) : ('Pedido ' + (q.code || ''))),
              customerName: q.customerName || 'Cliente',
              customerPhone: q.customerPhone || '',
              date: q.eventDate,
              formattedDate: eventDateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
              daysLeft: diffDays,
              amount: Number(q.total) || 0,
              deposit: Number(q.depositAmount) || 0,
              balance: Number(q.remainingBalance) || 0,
              quoteId: q.id,
              code: q.code || (isServicesMode ? 'COT-S' : 'COT'),
              statusLabel: isServicesMode ? 'Cita Agendada' : 'Entrega Confirmada'
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
          title: q.eventName || (isServicesMode ? ('Presupuesto ' + (q.code || '')) : ('Presupuesto ' + (q.code || ''))),
          customerName: q.customerName || 'Cliente',
          customerPhone: q.customerPhone || '',
          date: q.eventDate || '',
          formattedDate,
          daysLeft: diffDays,
          amount: Number(q.total) || 0,
          quoteId: q.id,
          code: q.code || (isServicesMode ? 'COT-S' : 'COT'),
          statusLabel: 'Por Confirmar'
        });
      }
    });

    // 3. Fechas Especiales & Cumpleaños (CRM) - Clientes Favoritos ⭐
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
          statusLabel: isServicesMode ? (evt.type === 'birthday' ? 'Cumpleaños' : 'Fecha Especial') : (evt.type === 'birthday' ? 'Cumpleaños' : 'Aniversario')
        });
      }
    });

    // Ordenar por urgencia
    importantEvents.sort((a, b) => {
      const da = a.daysLeft !== null ? a.daysLeft : 999;
      const db = b.daysLeft !== null ? b.daysLeft : 999;
      return da - db;
    });

    const deliveriesThisWeek = importantEvents.filter(e => e.type === 'delivery' && e.daysLeft >= 0 && e.daysLeft <= 7).length;
    const pendingSentCount = importantEvents.filter(e => e.type === 'pending_quote').length;

    // Top Insumos con Mayor Costo
    const topCostIngredients = [...ingredients]
      .sort((a, b) => (Number(b.packagePrice) || 0) - (Number(a.packagePrice) || 0))
      .slice(0, 4);

    // Top Recetas / Servicios
    const topRecipes = [...recipes].slice(0, 4);

    container.innerHTML = `
      <!-- Hero Banner Ejecutivo Dinámico -->
      <div class="${isServicesMode ? 'services-hero-banner' : 'products-hero-banner'} rounded-3xl p-5 sm:p-7 text-white shadow-lg mb-5 sm:mb-6 relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5 sm:gap-5 min-w-0">
            ${settings.logoUrl ? `
              <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-md ring-2 ring-white/60 shrink-0 flex items-center justify-center overflow-hidden">
                <img src="${this.escapeHtml(settings.logoUrl)}" alt="Logo ${safeBusinessTitle}" class="w-full h-full object-contain">
              </div>
            ` : `
              <div class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-inner">
                ${isServicesMode ? '💆' : '🎂'}
              </div>
            `}
            <div class="min-w-0">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-xs font-semibold text-white mb-1 capitalize">
                <span>📅</span> ${formattedToday}
              </div>
              <h1 class="text-xl sm:text-3xl font-black leading-tight truncate">
                ${safeBusinessTitle}
              </h1>
              <p class="text-white/90 text-xs sm:text-sm mt-0.5 leading-snug line-clamp-2">
                ${isServicesMode 
                  ? 'Centro de control de servicios & spa: Costea sesiones, protocolos de cabina, cotiza y gestiona a tus clientes.'
                  : 'Centro de control pastelero: Costea, presupuesta, cotiza y gestiona tu taller artesanal en un solo lugar.'}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start md:self-center">
            <button 
              type="button" 
              onclick="App.switchTab('settings')" 
              class="px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/30 rounded-2xl text-xs font-bold transition flex items-center gap-2 text-white shadow-2xs cursor-pointer"
            >
              <span>⚙️</span> ${isServicesMode ? 'Ajustes Centro' : 'Ajustes Taller'}
            </button>
          </div>
        </div>
      </div>

      <!-- Fila de Tarjetas KPI Ejecutivas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        
        <!-- KPI 1: Ventas del Mes -->
        <div class="kpi-card bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ventas del Mes</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
              💰
            </div>
          </div>
          <div>
            <span class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white block tracking-tight">
              ${Calculator.formatCurrency(monthSalesTotal > 0 ? monthSalesTotal : allTimeSalesTotal)}
            </span>
            <span class="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
              ${monthSalesTotal > 0 ? 'En pedidos confirmados este mes' : 'En total histórico confirmado'}
            </span>
          </div>
        </div>

        <!-- KPI 2: Entregas / Citas Esta Semana -->
        <div class="kpi-card bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${isServicesMode ? 'Citas Semana' : 'Entregas Semana'}</span>
            <div class="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center text-base">
              ${isServicesMode ? '💆' : '🚚'}
            </div>
          </div>
          <div>
            <span class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white block tracking-tight">
              ${deliveriesThisWeek}
            </span>
            <span class="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
              Próximos 7 días agendados
            </span>
          </div>
        </div>

        <!-- KPI 3: Cotizaciones por Confirmar -->
        <div class="kpi-card bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Por Confirmar</span>
            <div class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
              ⏳
            </div>
          </div>
          <div>
            <span class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white block tracking-tight">
              ${pendingSentCount}
            </span>
            <span class="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
              Presupuestos enviados pendientes
            </span>
          </div>
        </div>

        <!-- KPI 4: Catálogo Activo -->
        <div class="kpi-card bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catálogo Activo</span>
            <div class="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base">
              📦
            </div>
          </div>
          <div>
            <span class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white block tracking-tight">
              ${recipes.length} <span class="text-xs font-normal text-gray-400">fichas</span> / ${ingredients.length} <span class="text-xs font-normal text-gray-400">insumos</span>
            </span>
            <span class="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
              ${customers.length} clientes registrados
            </span>
          </div>
        </div>

      </div>

      <!-- Contenedor Principal en Cuadrícula: Columna Ancha + Columna Operativa -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-6">
        
        <!-- ==========================================
             COLUMNA IZQUIERDA (2/3 de ancho en PC): Mapa Radar, Acciones y Métricas
             ========================================== -->
        <div class="lg:col-span-2 space-y-5 sm:space-y-6">

          <!-- Radar & Mapa de Oportunidades de Clientes -->
          ${typeof SellerRequestsModule !== 'undefined' ? SellerRequestsModule.renderSellerMapCard() : ''}

          <!-- Barra de Acciones Rápidas (Personalizable) -->
          <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <span>⚡</span> Acciones Rápidas del Taller
              </span>
              <button 
                type="button" 
                onclick="App.openQuickActionsConfigModal()" 
                class="text-[11px] text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-pink-50/70 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 px-2.5 py-1 rounded-xl border border-pink-200/80 dark:border-pink-800 transition shadow-2xs active:scale-95"
              >
                <span>⚙️</span> Personalizar
              </button>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              ${enabledActions.map(action => `
                <button 
                  type="button" 
                  onclick="${action.handler}"
                  class="p-3 rounded-2xl ${action.colorClass} border text-xs font-bold transition flex items-center gap-2.5 group active:scale-95 cursor-pointer shadow-2xs text-left"
                >
                  <span class="text-lg group-hover:scale-110 transition shrink-0">${action.icon}</span>
                  <span class="truncate">${action.title}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Cuadrícula Doble: Top Recetas Rentables + Insumos de Mayor Costo -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Top Recetas -->
            <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>🏆</span> ${isServicesMode ? 'Servicios Destacados' : 'Recetas Destacadas'}
                  </h4>
                  <button onclick="App.switchTab('recipes')" class="text-[10px] text-pink-600 dark:text-pink-400 font-bold hover:underline">Ver todas</button>
                </div>
                ${topRecipes.length === 0 ? `
                  <p class="text-xs text-gray-400 py-4 text-center">No hay recetas creadas aún.</p>
                ` : `
                  <div class="space-y-2">
                    ${topRecipes.map(r => `
                      <div class="p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div class="min-w-0 pr-2">
                          <span class="font-bold text-gray-900 dark:text-gray-100 truncate block">${this.escapeHtml(r.name)}</span>
                          <span class="text-[10px] text-gray-400">${r.category || 'General'}</span>
                        </div>
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 shrink-0">
                          ${r.suggestedMargin || 40}% margen
                        </span>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>

            <!-- Insumos de Mayor Costo -->
            <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>📦</span> Insumos de Mayor Costo
                  </h4>
                  <button onclick="App.switchTab('ingredients')" class="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline">Ver stock</button>
                </div>
                ${topCostIngredients.length === 0 ? `
                  <p class="text-xs text-gray-400 py-4 text-center">No hay insumos creados aún.</p>
                ` : `
                  <div class="space-y-2">
                    ${topCostIngredients.map(i => `
                      <div class="p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div class="min-w-0 pr-2">
                          <span class="font-bold text-gray-900 dark:text-gray-100 truncate block">${this.escapeHtml(i.name)}</span>
                          <span class="text-[10px] text-gray-400">${i.packageQty} ${i.packageUnit}</span>
                        </div>
                        <span class="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          ${Calculator.formatCurrency(i.packagePrice)}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>

          </div>

        </div>

        <!-- ==========================================
             COLUMNA DERECHA (1/3 de ancho en PC): Agenda Operativa y Pedidos
             ========================================== -->
        <div class="space-y-5 sm:space-y-6">

          <!-- Agenda de Entregas & Citas -->
          <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs">
            <div class="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h3 class="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <span>📅</span> Agenda de Entregas
                </h3>
                <p class="text-[10px] text-gray-400">Próximos pedidos y citas agendadas</p>
              </div>
              <button onclick="App.switchTab('quotes')" class="text-[10px] text-pink-600 dark:text-pink-400 font-bold hover:underline">
                Ver todas ↗
              </button>
            </div>

            ${importantEvents.length === 0 ? `
              <div class="text-center py-8 text-xs text-gray-400 dark:text-gray-500">
                <span class="text-3xl block mb-2">🎉</span>
                ¡Estás al día! No hay pedidos pendientes para los próximos días.
              </div>
            ` : `
              <div class="space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                ${importantEvents.slice(0, 8).map(evt => {
                  const isDelivery = evt.type === 'delivery';
                  const isPending = evt.type === 'pending_quote';

                  let badgeColor = 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300';
                  let icon = '📅';

                  if (isDelivery) {
                    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                    icon = isServicesMode ? '💆' : '🚚';
                  } else if (isPending) {
                    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                    icon = '⏳';
                  } else {
                    badgeColor = 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300';
                    icon = '⭐';
                  }

                  return `
                    <div class="p-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60 hover:border-pink-300 transition space-y-2">
                      <div class="flex items-center justify-between gap-1.5">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${badgeColor} flex items-center gap-1">
                          <span>${icon}</span> ${evt.statusLabel}
                        </span>
                        ${evt.daysLeft === 0 
                          ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">¡HOY!</span>`
                          : evt.daysLeft === 1
                          ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white">Mañana</span>`
                          : `<span class="text-[10px] text-gray-400 font-semibold">${evt.formattedDate || ''}</span>`
                        }
                      </div>

                      <div class="min-w-0">
                        <h5 class="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">${this.escapeHtml(evt.customerName)}</h5>
                        <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">${this.escapeHtml(evt.title)}</p>
                      </div>

                      <div class="pt-1.5 border-t border-gray-200/50 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                        <span class="font-bold font-mono text-gray-700 dark:text-gray-300">${Calculator.formatCurrency(evt.amount || 0)}</span>
                        
                        <div class="flex items-center gap-1">
                          ${evt.customerPhone ? `
                            <button 
                              type="button" 
                              onclick="App.sendWhatsAppDeliveryCoordination('${evt.customerPhone}', '${evt.customerName}', '${evt.title}', '${evt.formattedDate}')"
                              class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <span>💬</span> WhatsApp
                            </button>
                          ` : ''}
                          <button 
                            type="button" 
                            onclick="App.switchTab('quotes'); setTimeout(() => QuotesModule.openEditor('${evt.quoteId}'), 80);"
                            class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 text-xs"
                            title="Ver detalles"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

        </div>

      </div>
    `;

    // Inicializar Mapa Radar de Oportunidades en el Dashboard
    setTimeout(() => {
      if (typeof SellerRequestsModule !== 'undefined') {
        SellerRequestsModule.initSellerMap();
      }
    }, 60);
  },

  initDashboardChart(approvedQuotes, isServicesMode) {
    const canvas = document.getElementById('dashboardRevenueChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.dashboardChartInstance) {
      this.dashboardChartInstance.destroy();
      this.dashboardChartInstance = null;
    }

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const last6Months = [];
    const monthlySales = [0, 0, 0, 0, 0, 0];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        label: months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2),
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }

    approvedQuotes.forEach(q => {
      const dateStr = q.eventDate || q.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      last6Months.forEach((m, idx) => {
        if (d.getFullYear() === m.year && d.getMonth() === m.month) {
          monthlySales[idx] += Number(q.total) || 0;
        }
      });
    });

    const isDark = document.documentElement.classList.contains('dark');
    const primaryColor = isServicesMode ? '#0d9488' : '#db2777';
    const bgGradientColor = isServicesMode ? 'rgba(13, 148, 136, 0.15)' : 'rgba(219, 39, 119, 0.15)';

    const ctx = canvas.getContext('2d');
    this.dashboardChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last6Months.map(m => m.label),
        datasets: [{
          label: 'Ventas Confirmadas ($)',
          data: monthlySales,
          borderColor: primaryColor,
          backgroundColor: bgGradientColor,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: primaryColor,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => 'Ventas: ' + Calculator.formatCurrency(context.parsed.y)
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: isDark ? '#334155' : '#f1f5f9' },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { size: 10 },
              callback: (val) => '$' + (val >= 1000 ? (val / 1000) + 'k' : val)
            }
          }
        }
      }
    });
  },

  sendWhatsAppFollowUp(customerPhone, customerName, quoteCode, eventName) {
    if (!customerPhone) {
      this.showToast('Este cliente no tiene teléfono registrado');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const settings = DB.getSettings();
    const isServices = this.currentMode === 'services';
    const businessName = settings.businessName || (isServices ? 'nuestro centro' : 'nuestro taller');
    const text = isServices
      ? encodeURIComponent(`¡Hola ${customerName}! 💆 Te escribo de ${businessName} para consultar si pudiste revisar el presupuesto #${quoteCode} para ${eventName || 'tu sesión de tratamiento'}. ¡Quedamos muy atentos a tus dudas o para agendar tu cita! ✨`)
      : encodeURIComponent(`¡Hola ${customerName}! 🎂 Te escribo de ${businessName} para consultar si pudiste revisar el presupuesto #${quoteCode} para ${eventName || 'tu pedido'}. ¡Quedamos muy atentos a tus dudas o comentarios! ✨`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  },

  sendWhatsAppDeliveryCoordination(customerPhone, customerName, eventName, dateStr) {
    if (!customerPhone) {
      this.showToast('Este cliente no tiene teléfono registrado');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const settings = DB.getSettings();
    const isServices = this.currentMode === 'services';
    const businessName = settings.businessName || (isServices ? 'nuestro centro' : 'nuestro taller');
    const text = isServices
      ? encodeURIComponent(`¡Hola ${customerName}! 💆 Te escribo de ${businessName} para coordinar tu cita (${eventName || 'Servicio / Tratamiento'}) agendada para el ${dateStr || 'próximo evento'}. ¡Ya tenemos todo preparado para recibirte! ✨`)
      : encodeURIComponent(`¡Hola ${customerName}! 🍰 Te escribo de ${businessName} para coordinar la entrega de tu pedido (${eventName || 'Torta / Pastelería'}) agendado para el ${dateStr || 'próximo evento'}. ¡Ya estamos afinando los detalles para que todo salga perfecto! ✨`);
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

  settingsActiveTab: 'products',

  switchSettingsTab(tab) {
    this.settingsActiveTab = tab;
    
    // Tab panels
    const panelProducts = document.getElementById('settings-panel-products');
    const panelServices = document.getElementById('settings-panel-services');
    const panelGeneral = document.getElementById('settings-panel-general');

    if (panelProducts) panelProducts.classList.toggle('hidden', tab !== 'products');
    if (panelServices) panelServices.classList.toggle('hidden', tab !== 'services');
    if (panelGeneral) panelGeneral.classList.toggle('hidden', tab !== 'general');

    // Tab buttons
    ['products', 'services', 'general'].forEach(t => {
      const btn = document.getElementById(`settings-tab-btn-${t}`);
      if (btn) {
        if (t === tab) {
          btn.className = `flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
            t === 'products' ? 'bg-pink-600 text-white shadow-pink-200/50' :
            t === 'services' ? 'bg-teal-600 text-white shadow-teal-200/50' :
            'bg-slate-800 text-white dark:bg-slate-700 shadow-slate-200/50'
          }`;
        } else {
          btn.className = 'flex-1 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer';
        }
      }
    });
  },

  renderSettings() {
    const container = document.getElementById('settings-view');
    if (!container) return;

    const settings = DB.getSettings();
    if (!this.settingsActiveTab) {
      this.settingsActiveTab = this.currentMode === 'services' ? 'services' : 'products';
    }

    const safeBusinessNameProducts = this.escapeHtml(this.sanitizePlainText(settings.businessNameProducts || settings.businessName || 'Mi Pastelería Artesanal'));
    const safeBusinessNameServices = this.escapeHtml(this.sanitizePlainText(settings.businessNameServices || 'Centro de Estética, Spa & Masajes'));
    const safeBusinessNameSingle = this.escapeHtml(this.sanitizePlainText(settings.businessName || ''));
    const safeCurrencySymbol = this.escapeHtml(this.sanitizePlainText(settings.currencySymbol || '$'));
    const safeBusinessPhone = this.escapeHtml(this.sanitizePlainText(settings.businessPhone || ''));
    const safeBusinessInstagram = this.escapeHtml(this.sanitizePlainText(settings.businessInstagram || ''));
    const safeBusinessEmail = this.escapeHtml(this.sanitizePlainText(settings.businessEmail || ''));
    const safeQuoteNote = this.escapeHtml(this.sanitizePlainText(settings.quoteNote || ''));
    const safeLogoProducts = this.escapeHtml(this.sanitizePlainText(settings.logoUrlProducts || settings.logoUrl || ''));
    const safeLogoServices = this.escapeHtml(this.sanitizePlainText(settings.logoUrlServices || ''));
    const safeAuthUserName = this.escapeHtml(typeof AuthModule !== 'undefined' && AuthModule.currentUser ? (AuthModule.currentUser.displayName || 'Usuario') : 'Usuario');
    const safeAuthUserEmail = this.escapeHtml(typeof AuthModule !== 'undefined' && AuthModule.currentUser ? (AuthModule.currentUser.email || '') : '');
    const safeAuthUserPhoto = this.escapeHtml(typeof AuthModule !== 'undefined' && AuthModule.currentUser ? (AuthModule.currentUser.photoURL || '') : '');

    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-4 sm:space-y-5 pb-8">

        <!-- Header de Configuración -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-teal-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-sm shrink-0">
              ⚙️
            </div>
            <div>
              <h2 class="font-black text-gray-900 dark:text-gray-100 text-base sm:text-lg tracking-tight">
                Configuración del Sistema
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                Ajusta parámetros, tarifas y marca para cada ambiente
              </p>
            </div>
          </div>
          <span class="text-xs px-3 py-1 rounded-full font-bold bg-pink-50 dark:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-slate-700 hidden sm:inline-block">
            ${this.currentMode === 'services' ? '💆 Modo Servicios Activo' : '🎂 Modo Productos Activo'}
          </span>
        </div>

        <!-- Selector de Pestañas (Pills) -->
        <div class="bg-gray-100/90 dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 flex gap-1.5 shadow-2xs">
          <button type="button" id="settings-tab-btn-products" onclick="App.switchSettingsTab('products')" 
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${this.settingsActiveTab === 'products' ? 'bg-pink-600 text-white shadow-pink-200/50 shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800'}">
            <span>🎂</span> <span class="truncate">Productos</span>
          </button>
          <button type="button" id="settings-tab-btn-services" onclick="App.switchSettingsTab('services')" 
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${this.settingsActiveTab === 'services' ? 'bg-teal-600 text-white shadow-teal-200/50 shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800'}">
            <span>💆</span> <span class="truncate">Servicios</span>
          </button>
          <button type="button" id="settings-tab-btn-general" onclick="App.switchSettingsTab('general')" 
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${this.settingsActiveTab === 'general' ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-slate-200/50 shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-slate-800'}">
            <span>⚙️</span> <span class="truncate">General & Nube</span>
          </button>
        </div>

        <!-- Formulario que abarca las 3 pestañas -->
        <form id="settings-form" onsubmit="App.saveSettingsForm(event)" class="space-y-4 sm:space-y-5 text-xs sm:text-sm">
          
          <!-- ========================================== -->
          <!-- PESTAÑA 1: MODO PRODUCTOS (PASTELERÍA) -->
          <!-- ========================================== -->
          <div id="settings-panel-products" class="${this.settingsActiveTab === 'products' ? '' : 'hidden'} space-y-4">
            
            <!-- Identidad Productos -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>🎂</span> Identidad en Modo Productos
              </h3>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial de la Pastelería / Taller</label>
                <input type="text" id="set-business-name-products" value="${safeBusinessNameProducts}" placeholder="Ej. Pastelería Dulce Sabor" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                <span class="text-[11px] text-gray-400 mt-1 block">Aparece en el encabezado, presupuestos y mensajes cuando estás en modo productos.</span>
              </div>
            </div>

            <!-- Parámetros Financieros Productos -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>💰</span> Costeo y Rentabilidad de Productos
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tarifa Mano de Obra Pastelera ($/hr)</label>
                  <input type="number" id="set-hourly-rate-products" value="${settings.hourlyRateProducts || settings.defaultHourlyRate || 4000}" step="any" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  <span class="text-[10px] text-gray-400">Valor por hora de horneado y decoración</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Margen Objetivo Meta (%)</label>
                  <input type="number" id="set-target-margin-products" value="${settings.targetMarginProducts || settings.defaultTargetMargin || 40}" min="5" max="90" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  <span class="text-[10px] text-gray-400">Margen sugerido por defecto en recetas (ej. 40%)</span>
                </div>
              </div>
            </div>

            <!-- Logo Personalizado Productos -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                  <span>🎨</span> Logo de la Pastelería (Modo Productos)
                </h3>
                ${(settings.logoUrlProducts || settings.logoUrl) ? `
                  <button type="button" onclick="App.removeLogo('products')" class="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline cursor-pointer">
                    ✕ Quitar Logo
                  </button>
                ` : ''}
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                  <img id="settings-logo-preview-products" src="${this.escapeHtml(settings.logoUrlProducts || settings.logoUrl || 'assets/icons/logo.png')}" alt="Logo Productos" class="w-full h-full object-contain p-1">
                </div>

                <div class="flex-1 space-y-2 w-full">
                  <input type="hidden" id="set-business-logo-products" value="${safeLogoProducts}">
                  
                  <div class="flex flex-wrap gap-2">
                    <label class="py-2 px-3.5 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <span>📤</span> Subir Logo Productos
                      <input type="file" id="logo-file-input-products" accept="image/*" onchange="App.handleLogoUpload(event, 'products')" class="hidden">
                    </label>

                    <button 
                      type="button" 
                      id="remove-bg-btn-products"
                      onclick="App.removeLogoBackground('products')" 
                      class="py-2 px-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-90 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      ${!(settings.logoUrlProducts || settings.logoUrl) ? 'disabled' : ''}
                      title="Elimina el fondo blanco o sólido de tu logo automáticamente"
                    >
                      <span>🍌</span> Quitar Fondo (IA)
                    </button>
                  </div>

                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    Logo exclusivo para pastelería y cotizaciones de productos (.PNG o .JPG).
                  </p>
                </div>
              </div>
            </div>

            <!-- Ubicación y Presencia en el Mapa de Cakekulator Clientes -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-pink-100 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                  <span>📍</span> Ubicación & Registro en el Mapa de Clientes
                </h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-slate-800 dark:text-pink-300">
                  🗺️ Mapa Activo
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Dirección del Taller / Local</label>
                  <input type="text" id="set-business-address" value="${this.escapeHtml(settings.businessAddress || 'Av. Providencia 1450')}" placeholder="Ej. Av. Providencia 1450" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Comuna / Ciudad</label>
                  <input type="text" id="set-business-commune" value="${this.escapeHtml(settings.businessCommune || 'Providencia')}" placeholder="Ej. Providencia" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Especialidades para el Mapa de Clientes</label>
                <input type="text" id="set-business-specialties" value="${this.escapeHtml(settings.businessSpecialties || 'Tortas de Novios, Red Velvet, Macarons')}" placeholder="Ej. Tortas de Novios, Red Velvet, Macarons, Vegana" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                <span class="text-[10px] text-gray-400">Separa con comas. Aparecen en tu ficha de pastelería visible para los compradores.</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tiempos de Preparación / Entrega</label>
                  <input type="text" id="set-business-lead-time" value="${this.escapeHtml(settings.businessLeadTime || '2 horas (en stock) / 24 hrs a pedido')}" placeholder="Ej. 24 hrs a pedido" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Coordenadas GPS (Lat / Lng)</label>
                  <div class="flex gap-2">
                    <input type="number" step="any" id="set-business-lat" value="${settings.businessLat || -33.4265}" placeholder="Latitud" class="w-1/2 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                    <input type="number" step="any" id="set-business-lng" value="${settings.businessLng || -70.6150}" placeholder="Longitud" class="w-1/2 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  </div>
                </div>
              </div>

              <div class="p-3 bg-pink-50/70 dark:bg-slate-800 rounded-2xl border border-pink-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span class="text-xs font-bold text-gray-900 dark:text-white block">📍 Detectar ubicación con GPS</span>
                  <span class="text-[11px] text-gray-500 dark:text-gray-400">Obtén tus coordenadas exactas automáticamente desde tu dispositivo</span>
                </div>
                <button type="button" onclick="App.getSellerCoordinates()" class="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:from-pink-700 active:scale-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <span>🎯</span>
                  <span>Usar Mi Ubicación GPS</span>
                </button>
              </div>

              <div class="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span class="font-bold text-xs text-gray-800 dark:text-gray-200 block">Mostrar mi pastelería en el Mapa de Cakekulator Clientes</span>
                  <span class="text-[11px] text-gray-400">Permite que los compradores cercanos descubran tu local y te contacten por WhatsApp.</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" id="set-publish-on-map" class="sr-only peer" ${settings.publishOnMap !== false ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

            </div>

          </div>

          <!-- ========================================== -->
          <!-- PESTAÑA 2: MODO SERVICIOS (SPA & ESTÉTICA) -->
          <!-- ========================================== -->
          <div id="settings-panel-services" class="${this.settingsActiveTab === 'services' ? '' : 'hidden'} space-y-4">
            
            <!-- Identidad Servicios -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>💆</span> Identidad en Modo Servicios
              </h3>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Centro de Estética, Spa o Terapias</label>
                <input type="text" id="set-business-name-services" value="${safeBusinessNameServices}" placeholder="Ej. Spa & Belleza Natural" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                <span class="text-[11px] text-gray-400 mt-1 block">Aparece en el encabezado, cotizaciones de sesiones y recordatorios de citas.</span>
              </div>
            </div>

            <!-- Parámetros Financieros Servicios -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>💰</span> Costeo y Rentabilidad de Servicios
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tarifa Terapeuta ($/hr)</label>
                  <input type="number" id="set-hourly-rate-services" value="${settings.hourlyRateServices || 6000}" step="any" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  <span class="text-[10px] text-gray-400">Honorario por hora de sesión</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Margen Objetivo Meta (%)</label>
                  <input type="number" id="set-target-margin-services" value="${settings.targetMarginServices || 50}" min="5" max="90" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  <span class="text-[10px] text-gray-400">Margen sugerido para servicios</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Gasto de Cabina Base ($)</label>
                  <input type="number" id="set-cabin-cost-services" value="${settings.serviceCabinCost || 3000}" step="any" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                  <span class="text-[10px] text-gray-400">Arriendo/luz promedio por sesión</span>
                </div>
              </div>
            </div>

            <!-- Logo Personalizado Servicios -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-teal-100 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                  <span>💆</span> Logo / Marca de Servicios & Spa
                </h3>
                ${settings.logoUrlServices ? `
                  <button type="button" onclick="App.removeLogo('services')" class="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline cursor-pointer">
                    ✕ Quitar Logo
                  </button>
                ` : ''}
              </div>

              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-teal-50/50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                  <img id="settings-logo-preview-services" src="${this.escapeHtml(settings.logoUrlServices || 'assets/icons/favicon.png')}" alt="Logo Servicios" class="w-full h-full object-contain p-1">
                </div>

                <div class="flex-1 space-y-2 w-full">
                  <input type="hidden" id="set-business-logo-services" value="${safeLogoServices}">
                  
                  <div class="flex flex-wrap gap-2">
                    <label class="py-2 px-3.5 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <span>📤</span> Subir Logo Servicios
                      <input type="file" id="logo-file-input-services" accept="image/*" onchange="App.handleLogoUpload(event, 'services')" class="hidden">
                    </label>

                    <button 
                      type="button" 
                      id="remove-bg-btn-services"
                      onclick="App.removeLogoBackground('services')" 
                      class="py-2 px-3.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:opacity-90 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      ${!settings.logoUrlServices ? 'disabled' : ''}
                      title="Elimina el fondo blanco o sólido de tu logo automáticamente"
                    >
                      <span>🍌</span> Quitar Fondo (IA)
                    </button>
                  </div>

                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    Logo exclusivo para tu centro de estética, sesiones y cotizaciones de servicios (.PNG o .JPG).
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- PESTAÑA 3: GENERAL & NUBE -->
          <!-- ========================================== -->
          <div id="settings-panel-general" class="${this.settingsActiveTab === 'general' ? '' : 'hidden'} space-y-4">
            
            <!-- Nombre Unificado (Toggle) -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <label for="set-use-same-name" class="font-bold text-xs text-gray-800 dark:text-gray-200 cursor-pointer block">
                    Usar el mismo nombre comercial para Productos y Servicios
                  </label>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">
                    Actívalo solo si tu negocio opera bajo un único nombre unificado en ambos rubros.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" id="set-use-same-name" class="sr-only peer" ${settings.useSameBusinessName ? 'checked' : ''} onchange="App.toggleBusinessNameInputs(this.checked)">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div id="container-single-business-name" class="${settings.useSameBusinessName ? '' : 'hidden'} pt-2">
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial Unificado</label>
                <input type="text" id="set-business-name-single" value="${safeBusinessNameSingle}" placeholder="Ej. Mi Negocio Multirubro" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
              </div>
            </div>

            <!-- Parámetros Financieros Globales -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>🌐</span> Moneda y Pasarelas de Pago
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Símbolo de Moneda</label>
                  <input type="text" id="set-currency-symbol" value="${safeCurrencySymbol}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 font-bold text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Comisión Webpay / POS (%)</label>
                  <input type="number" step="0.01" id="set-payment-comm" value="${settings.defaultPaymentCommission || 3.19}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Abono Requerido (%)</label>
                  <input type="number" id="set-deposit-pct" value="${settings.defaultDepositPercent || 50}" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nota Predeterminada para Cotizaciones</label>
                <textarea id="set-quote-note" rows="2" placeholder="Ej. Presupuesto válido por 15 días. Para reservar se solicita abono del 50%." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">${safeQuoteNote}</textarea>
              </div>
            </div>

            <!-- Datos de Contacto Globales -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>📱</span> Canales de Contacto del Negocio
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">WhatsApp / Teléfono</label>
                  <input type="tel" id="set-business-phone" value="${safeBusinessPhone}" placeholder="+56 9 1234 5678" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Instagram / Redes</label>
                  <input type="text" id="set-business-ig" value="${safeBusinessInstagram}" placeholder="@minegocio" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email de Contacto</label>
                  <input type="email" id="set-business-email" value="${safeBusinessEmail}" placeholder="contacto@minegocio.cl" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs text-gray-800 dark:text-gray-100">
                </div>
              </div>
            </div>

            <!-- Apariencia y Modo Oscuro / Claro -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 class="font-bold text-gray-800 dark:text-gray-200 text-sm border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span>🌓</span> Tema y Apariencia Visual
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onclick="App.setTheme('light')" 
                  id="settings-theme-light" 
                  class="p-3.5 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${!document.documentElement.classList.contains('dark') ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-2 ring-pink-400/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-pink-200'}"
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
                  class="p-3.5 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${document.documentElement.classList.contains('dark') ? 'border-pink-500 bg-pink-50/50 dark:bg-slate-800 ring-2 ring-pink-400/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-pink-200'}"
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
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                  <span>🔥</span> Base de Datos y Sesión en la Nube
                </h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'}">
                  ${typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured ? 'Firebase Conectado' : 'Modo Local'}
                </span>
              </div>

              <p class="text-xs text-gray-600 dark:text-gray-400">Conecta tu cuenta de Google y Firebase Cloud Firestore para que tus recetas, costos y presupuestos se sincronicen automáticamente en todos tus dispositivos.</p>

              <div class="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  ${typeof AuthModule !== 'undefined' && AuthModule.currentUser ? `
                    <div class="flex items-center gap-3">
                      ${AuthModule.currentUser.photoURL ? `
                        <img src="${this.escapeHtml(AuthModule.currentUser.photoURL)}" alt="" class="w-10 h-10 rounded-full ring-2 ring-pink-300">
                      ` : `
                        <div class="w-10 h-10 rounded-full bg-pink-600 text-white font-bold flex items-center justify-center">
                          ${(this.escapeHtml(AuthModule.currentUser.displayName || 'U')).charAt(0)}
                        </div>
                      `}
                      <div>
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 text-xs">${this.escapeHtml(AuthModule.currentUser.displayName || 'Usuario')}</h4>
                        <p class="text-[11px] text-gray-500 dark:text-gray-400">${this.escapeHtml(AuthModule.currentUser.email || '')}</p>
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
                    <button type="button" onclick="AuthModule.forceSyncNow()" class="flex-1 sm:flex-none px-3 py-2 bg-pink-100 dark:bg-slate-700 hover:bg-pink-200 dark:hover:bg-slate-600 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-xl transition cursor-pointer">
                      🔄 Sincronizar
                    </button>
                    <button type="button" onclick="AuthModule.logout()" class="flex-1 sm:flex-none px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold rounded-xl transition cursor-pointer">
                      Cerrar Sesión
                    </button>
                  ` : `
                    <button type="button" onclick="AuthModule.loginWithGoogle()" class="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 border border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer">
                      <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Iniciar con Google
                    </button>
                  `}
                </div>
              </div>
            </div>

            <!-- Notificaciones Push & Alertas (Firebase Cloud Messaging) -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                  <span>🔔</span> Notificaciones Push & Alertas (FCM)
                </h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'denied'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }">
                  ${
                    typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'granted'
                      ? 'Push Activo'
                      : typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'denied'
                      ? 'Bloqueado'
                      : 'Sin Activar'
                  }
                </span>
              </div>

              <p class="text-xs text-gray-600 dark:text-gray-400">
                Recibe alertas en tu dispositivo sobre entregas agendadas, cotizaciones por confirmar y notificaciones remotas enviadas desde Firebase Cloud Messaging (100% gratuito).
              </p>

              <div class="bg-gray-50 dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-xs">
                      ${
                        typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'granted'
                          ? '✅ Alertas del Sistema Habilitadas'
                          : '🔔 Activar Notificaciones en este Dispositivo'
                      }
                    </h4>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">
                      ${
                        typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'granted'
                          ? 'Tu navegador está vinculado y listo para recibir alertas locales y remotas.'
                          : 'Autoriza los permisos en tu navegador para recibir avisos push en tiempo real.'
                      }
                    </p>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    ${
                      typeof NotificationsModule !== 'undefined' && NotificationsModule.getPermissionStatus() === 'granted' ? `
                        <button 
                          type="button" 
                          onclick="NotificationsModule.sendTestNotification()" 
                          class="px-3 py-2 bg-pink-100 dark:bg-slate-700 hover:bg-pink-200 dark:hover:bg-slate-600 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>🔔</span> Probar Notificación
                        </button>
                      ` : `
                        <button 
                          type="button" 
                          onclick="NotificationsModule.requestPermission()" 
                          class="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>🔔</span> Activar Push
                        </button>
                      `
                    }
                  </div>
                </div>

                ${typeof NotificationsModule !== 'undefined' && NotificationsModule.currentToken ? `
                  <div class="pt-2 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Token FCM de este Dispositivo:</span>
                      <code class="text-[10px] text-pink-600 dark:text-pink-400 font-mono block truncate max-w-full sm:max-w-md bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 mt-0.5">${this.escapeHtml(NotificationsModule.currentToken)}</code>
                    </div>
                    <button 
                      type="button" 
                      onclick="NotificationsModule.copyToken()" 
                      class="px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl border border-gray-200 dark:border-slate-600 transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>📋</span> Copiar Token
                    </button>
                  </div>
                ` : ''}

                <!-- Configuración de Clave VAPID Web Push -->
                <div class="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>🔑</span> Certificado Web Push (Clave Pública VAPID):
                    </label>
                    <a href="https://console.firebase.google.com/project/cakekulator-bd/settings/cloudmessaging" target="_blank" rel="noopener" class="text-[10px] text-pink-600 hover:underline">
                      Obtener en Firebase ↗
                    </a>
                  </div>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      id="fcmVapidInput" 
                      placeholder="Pega tu clave pública VAPID (ej. BD_... o BJ_...)" 
                      value="${this.escapeHtml(typeof NotificationsModule !== 'undefined' ? NotificationsModule.getVapidKey() : '')}"
                      class="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-pink-500"
                    />
                    <button 
                      type="button" 
                      onclick="NotificationsModule.saveVapidKey(document.getElementById('fcmVapidInput').value)"
                      class="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                    >
                      Guardar
                    </button>
                  </div>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400">
                    En Firebase Console > Configuración ⚙️ > Cloud Messaging > "Certificados Web Push" > "Generar par de claves".
                  </p>
                </div>
              </div>

              <!-- Preferencias de Alertas Automáticas -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    ${typeof NotificationsModule !== 'undefined' && NotificationsModule.settings.notifyOrders ? 'checked' : ''} 
                    onchange="NotificationsModule.toggleSetting('notifyOrders')"
                    class="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                  >
                  <span>🚚 Avisos de Entregas y Citas del Día</span>
                </label>

                <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    ${typeof NotificationsModule !== 'undefined' && NotificationsModule.settings.notifyQuotes ? 'checked' : ''} 
                    onchange="NotificationsModule.toggleSetting('notifyQuotes')"
                    class="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                  >
                  <span>📋 Cotizaciones Pendientes de Respuesta</span>
                </label>
              </div>
            </div>

            <!-- Datos de Demostración y Pruebas -->
            <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
                  <span>🪄</span> Datos de Demostración y Pruebas
                </h3>
                <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-pink-100 text-pink-800 dark:bg-slate-800 dark:text-pink-300">
                  Pruebas Rápidas
                </span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Carga un catálogo completo de insumos, recetas de pastelería, protocolos de estética, clientes y cotizaciones reales para explorar y probar todas las funciones del sistema.
              </p>
              
              <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button 
                  type="button" 
                  onclick="App.loadDemoData()" 
                  class="flex-1 py-3 px-4 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🪄</span> Cargar Datos de Ejemplo (Productos + Servicios)
                </button>
                <button 
                  type="button" 
                  onclick="App.resetAllData()" 
                  class="py-3 px-4 bg-gray-100 hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 dark:hover:text-red-400 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Vaciar todos los registros de prueba"
                >
                  <span>🗑️</span> Vaciar Todo
                </button>
              </div>
            </div>

          </div>

          <!-- Botón de Guardar Permanente -->
          <div class="pt-2">
            <button type="submit" class="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-[0.99] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>💾</span> Guardar Toda la Configuración
            </button>
          </div>

        </form>
      </div>
    `;
  },

  loadDemoData() {
    if (confirm('¿Deseas cargar los datos de demostración completos? Se agregarán insumos, recetas, servicios, clientes y cotizaciones de prueba para ambos ambientes.')) {
      const stats = DB.loadDemoData();
      this.updateHeaderBrand();
      this.renderCurrentTab(true);
      this.showToast(`✨ Se cargaron ${stats.ingredientsCount} insumos, ${stats.recipesCount} recetas/servicios, ${stats.customersCount} clientes y ${stats.quotesCount} presupuestos de prueba`);
    }
  },

  resetAllData() {
    if (confirm('⚠️ ¿Estás seguro de que deseas vaciar todos los registros del sistema? Esta acción no se puede deshacer.')) {
      DB.resetAllData();
      this.updateHeaderBrand();
      this.renderCurrentTab(true);
      this.showToast('🗑️ Base de datos restablecida correctamente');
    }
  },

  toggleBusinessNameInputs(useSame) {
    const singleContainer = document.getElementById('container-single-business-name');
    if (singleContainer) {
      singleContainer.classList.toggle('hidden', !useSame);
    }
  },

  saveSettingsForm(e) {
    e.preventDefault();

    const currentSettings = DB.getSettings();
    const useSameBusinessName = document.getElementById('set-use-same-name')?.checked || false;
    const nameSingle = this.sanitizePlainText(document.getElementById('set-business-name-single')?.value || '');
    const nameProducts = this.sanitizePlainText(document.getElementById('set-business-name-products')?.value || '');
    const nameServices = this.sanitizePlainText(document.getElementById('set-business-name-services')?.value || '');

    const prodRate = parseFloat(document.getElementById('set-hourly-rate-products')?.value) || 4000;
    const servRate = parseFloat(document.getElementById('set-hourly-rate-services')?.value) || 6000;
    const prodMargin = parseFloat(document.getElementById('set-target-margin-products')?.value) || 40;
    const servMargin = parseFloat(document.getElementById('set-target-margin-services')?.value) || 50;
    const cabinCost = parseFloat(document.getElementById('set-cabin-cost-services')?.value) || 3000;

    const prodName = useSameBusinessName ? nameSingle : (nameProducts || 'Mi Pastelería Artesanal');
    const servName = useSameBusinessName ? nameSingle : (nameServices || 'Centro de Estética, Spa & Masajes');

    const logoProducts = this.sanitizePlainText(document.getElementById('set-business-logo-products')?.value || currentSettings.logoUrlProducts || currentSettings.logoUrl || '');
    const logoServices = this.sanitizePlainText(document.getElementById('set-business-logo-services')?.value || currentSettings.logoUrlServices || '');

    const businessAddress = this.sanitizePlainText(document.getElementById('set-business-address')?.value || currentSettings.businessAddress || 'Av. Providencia 1450');
    const businessCommune = this.sanitizePlainText(document.getElementById('set-business-commune')?.value || currentSettings.businessCommune || 'Providencia');
    const businessSpecialties = this.sanitizePlainText(document.getElementById('set-business-specialties')?.value || currentSettings.businessSpecialties || 'Tortas de Novios, Red Velvet, Macarons');
    const businessLeadTime = this.sanitizePlainText(document.getElementById('set-business-lead-time')?.value || currentSettings.businessLeadTime || '2 horas (en stock) / 24 hrs a pedido');
    const businessLat = parseFloat(document.getElementById('set-business-lat')?.value) || currentSettings.businessLat || -33.4265;
    const businessLng = parseFloat(document.getElementById('set-business-lng')?.value) || currentSettings.businessLng || -70.6150;
    const publishOnMap = document.getElementById('set-publish-on-map') ? document.getElementById('set-publish-on-map').checked : true;

    const newSettings = {
      ...currentSettings,
      currencySymbol: this.sanitizePlainText(document.getElementById('set-currency-symbol')?.value || '$') || '$',
      defaultHourlyRate: this.currentMode === 'services' ? servRate : prodRate,
      hourlyRateProducts: prodRate,
      hourlyRateServices: servRate,
      defaultTargetMargin: this.currentMode === 'services' ? servMargin : prodMargin,
      targetMarginProducts: prodMargin,
      targetMarginServices: servMargin,
      serviceCabinCost: cabinCost,
      defaultPaymentCommission: parseFloat(document.getElementById('set-payment-comm')?.value) || 3.19,
      defaultDepositPercent: parseFloat(document.getElementById('set-deposit-pct')?.value) || 50,
      useSameBusinessName,
      businessNameProducts: prodName,
      businessNameServices: servName,
      businessName: useSameBusinessName ? nameSingle : (this.currentMode === 'services' ? servName : prodName),
      businessPhone: this.sanitizePlainText(document.getElementById('set-business-phone')?.value || ''),
      businessInstagram: this.sanitizePlainText(document.getElementById('set-business-ig')?.value || ''),
      businessEmail: this.sanitizePlainText(document.getElementById('set-business-email')?.value || ''),
      businessAddress,
      businessCommune,
      businessSpecialties,
      businessLeadTime,
      businessLat,
      businessLng,
      publishOnMap,
      quoteNote: this.sanitizePlainText(document.getElementById('set-quote-note')?.value || ''),
      logoUrlProducts: logoProducts,
      logoUrlServices: logoServices,
      logoUrl: this.currentMode === 'services' ? logoServices : logoProducts,
      geminiApiKey: currentSettings.geminiApiKey || ''
    };

    DB.saveSettings(newSettings);
    this.syncSellerBakeryToMap(newSettings);
    this.updateHeaderBrand();
    this.showToast('✅ Configuración y ubicación guardadas correctamente');
  },

  // Sincronizar pastelería del vendedor con el mapa de clientes
  syncSellerBakeryToMap(settings) {
    try {
      const bakeriesKey = 'cakekulator_nearby_bakeries';
      let bakeries = [];
      const saved = localStorage.getItem(bakeriesKey);
      if (saved) {
        bakeries = JSON.parse(saved);
      } else if (typeof DEFAULT_BAKERIES !== 'undefined') {
        bakeries = [...DEFAULT_BAKERIES];
      }

      const sellerBakeryId = 'bakery_1'; // Sincroniza con la pastelería principal del vendedor
      const specialtiesArr = (settings.businessSpecialties || 'Tortas Artesanales, Pastelería Fina')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const bakeryData = {
        id: sellerBakeryId,
        name: settings.businessNameProducts || settings.businessName || 'Mi Pastelería Artesanal',
        chef: 'Chef Valentina Morales',
        rating: 4.9,
        reviewsCount: 128,
        category: 'Tortas de Diseño & Fina',
        specialties: specialtiesArr.length > 0 ? specialtiesArr : ['Tortas de Novios', 'Red Velvet', 'Macarons Franceses'],
        address: settings.businessAddress || 'Av. Providencia 1450, Providencia',
        commune: settings.businessCommune || 'Providencia',
        lat: parseFloat(settings.businessLat) || -33.4265,
        lng: parseFloat(settings.businessLng) || -70.6150,
        phone: settings.businessPhone || '+56912345678',
        instagram: settings.businessInstagram || '@dulcearte_pasteleria',
        image: settings.logoUrlProducts || settings.logoUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60',
        logo: '🎂',
        badges: ['Verificada', 'Taller Local', 'Entrega Hoy'],
        deliveryAvailable: true,
        minLeadTime: settings.businessLeadTime || '2 horas (en stock) / 24 hrs a pedido',
        isMyBakery: true
      };

      const existingIndex = bakeries.findIndex(b => b.id === sellerBakeryId || b.isMyBakery);
      if (settings.publishOnMap !== false) {
        if (existingIndex > -1) {
          bakeries[existingIndex] = { ...bakeries[existingIndex], ...bakeryData };
        } else {
          bakeries.unshift(bakeryData);
        }
      } else if (existingIndex > -1) {
        bakeries.splice(existingIndex, 1);
      }

      localStorage.setItem(bakeriesKey, JSON.stringify(bakeries));
    } catch (err) {
      console.warn('Error al sincronizar pastelería en el mapa:', err);
    }
  },

  // Obtener ubicación GPS actual del vendedor
  getSellerCoordinates() {
    if (!('geolocation' in navigator)) {
      this.showToast('⚠️ Tu navegador no soporta geolocalización GPS.');
      return;
    }

    this.showToast('📍 Detectando coordenadas GPS de tu taller...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const latInput = document.getElementById('set-business-lat');
        const lngInput = document.getElementById('set-business-lng');
        if (latInput) latInput.value = lat.toFixed(6);
        if (lngInput) lngInput.value = lng.toFixed(6);
        this.showToast(`✅ Ubicación GPS fijada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        this.showToast('⚠️ No se pudo obtener la ubicación GPS automáticamente. Puedes ingresarla manualmente.');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  },

  // Manejo de carga de Logo por Ambiente (productos / servicios)
  async handleLogoUpload(event, mode = 'products') {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    try {
      this.showToast(`Cargando logo de ${mode === 'services' ? 'servicios' : 'productos'}...`);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const preview = document.getElementById(`settings-logo-preview-${mode}`);
        const hiddenInput = document.getElementById(`set-business-logo-${mode}`);
        const removeBgBtn = document.getElementById(`remove-bg-btn-${mode}`);

        if (preview) preview.src = dataUrl;
        if (hiddenInput) hiddenInput.value = dataUrl;
        if (removeBgBtn) removeBgBtn.disabled = false;

        const settings = DB.getSettings();
        if (mode === 'services') {
          settings.logoUrlServices = dataUrl;
        } else {
          settings.logoUrlProducts = dataUrl;
          settings.logoUrl = dataUrl;
        }
        DB.saveSettings(settings);
        this.updateHeaderBrand();
        this.showToast(`✨ Logo de ${mode === 'services' ? 'servicios' : 'productos'} cargado con éxito`);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('Error al cargar logo:', e);
      alert('Hubo un inconveniente al cargar la imagen.');
    }
  },

  // Remover fondo con IA por Ambiente
  async removeLogoBackground(mode = 'products') {
    const hiddenInput = document.getElementById(`set-business-logo-${mode}`);
    const currentLogo = hiddenInput ? hiddenInput.value : '';
    if (!currentLogo) {
      alert('Primero debes subir una imagen de logo.');
      return;
    }

    try {
      this.showToast('🍌 Procesando y eliminando fondo con IA...');
      const transparentLogo = await GeminiService.removeBackgroundFromImage(currentLogo);

      const preview = document.getElementById(`settings-logo-preview-${mode}`);
      if (preview) preview.src = transparentLogo;
      if (hiddenInput) hiddenInput.value = transparentLogo;

      const settings = DB.getSettings();
      if (mode === 'services') {
        settings.logoUrlServices = transparentLogo;
      } else {
        settings.logoUrlProducts = transparentLogo;
        settings.logoUrl = transparentLogo;
      }
      DB.saveSettings(settings);
      this.updateHeaderBrand();
      this.showToast('✨ ¡Fondo eliminado con éxito!');
    } catch (e) {
      console.error('Error al remover fondo:', e);
      alert('No se pudo procesar el fondo: ' + e.message);
    }
  },

  // Quitar logo por Ambiente
  removeLogo(mode = 'products') {
    const preview = document.getElementById(`settings-logo-preview-${mode}`);
    const hiddenInput = document.getElementById(`set-business-logo-${mode}`);
    const removeBgBtn = document.getElementById(`remove-bg-btn-${mode}`);

    const defaultImg = mode === 'services' ? 'assets/icons/favicon.png' : 'assets/icons/logo.png';
    if (preview) preview.src = defaultImg;
    if (hiddenInput) hiddenInput.value = '';
    if (removeBgBtn) removeBgBtn.disabled = true;

    const settings = DB.getSettings();
    if (mode === 'services') {
      settings.logoUrlServices = '';
    } else {
      settings.logoUrlProducts = '';
      settings.logoUrl = '';
    }
    DB.saveSettings(settings);
    this.updateHeaderBrand();
    this.showToast(`Logo de ${mode === 'services' ? 'servicios' : 'productos'} restablecido`);
    this.renderCurrentTab(true);
  },

  // Actualizar logo y nombre en header
  updateHeaderBrand() {
    const settings = DB.getSettings(this.currentMode);
    const logoEl = document.getElementById('header-brand-logo');
    const nameEl = document.getElementById('header-brand-name');

    if (logoEl) {
      logoEl.src = settings.logoUrl || 'assets/icons/logo.png';
    }
    if (nameEl) {
      nameEl.textContent = this.sanitizePlainText(settings.businessName || (this.currentMode === 'services' ? 'Centro de Estética, Spa & Masajes' : 'Mi Pastelería Artesanal'));
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

    toast.textContent = `✨ ${message}`;
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
