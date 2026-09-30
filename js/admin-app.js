// ==========================================
// Cakekulator - Panel de Administración (AdminApp)
// ==========================================

const AdminApp = {
  MASTER_ADMIN_EMAILS: [
    'p.salinaslueyza@gmail.com',
    'admin@cakekulator.cl',
    'contacto@cakekulator.cl'
  ],

  currentAdmin: null,
  isAuthorized: false,
  activeTab: 'overview', // 'overview' | 'sellers' | 'clients' | 'memberships' | 'broadcast' | 'config'
  searchTerm: '',
  planFilter: 'all', // 'all' | 'pro' | 'trial' | 'free' | 'admin' | 'suspended'
  roleFilter: 'all',

  sellers: [],
  clients: [],
  announcements: [],
  isLoading: true,
  selectedUser: null,

  init() {
    console.log('🛡️ Inicializando Cakekulator Admin Console...');
    this.initTheme();

    if (typeof FirebaseService === 'undefined') {
      this.renderError('FirebaseService no está disponible. Revisa la carga de scripts.');
      return;
    }

    FirebaseService.init();

    if (FirebaseService.auth) {
      FirebaseService.auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentAdmin = user;
          await this.verifyAdminAccess(user);
        } else {
          this.currentAdmin = null;
          this.isAuthorized = false;
          this.renderLoginRequired();
        }
      });
    } else {
      this.renderError('No se pudo inicializar la autenticación de Firebase.');
    }
  },

  initTheme() {
    const isDark = localStorage.getItem('cakekulator_theme') === 'dark' || 
      (!localStorage.getItem('cakekulator_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cakekulator_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cakekulator_theme', 'dark');
    }
  },

  async verifyAdminAccess(user) {
    this.isLoading = true;
    this.renderLoading();

    try {
      const emailLower = (user.email || '').toLowerCase();
      const isMaster = this.MASTER_ADMIN_EMAILS.some(m => emailLower.includes(m.toLowerCase()));

      let isRoleAdmin = false;
      if (FirebaseService.db) {
        const doc = await FirebaseService.db.collection('users').doc(user.uid).get();
        if (doc.exists && doc.data().role === 'admin') {
          isRoleAdmin = true;
        }
      }

      if (isMaster || isRoleAdmin) {
        this.isAuthorized = true;
        await this.loadAllData();
        this.renderMainDashboard();
      } else {
        this.isAuthorized = false;
        this.renderAccessDenied(user);
      }
    } catch (err) {
      console.error('Error al verificar acceso de admin:', err);
      this.renderError('Error de conexión al verificar permisos: ' + err.message);
    } finally {
      this.isLoading = false;
    }
  },

  // ==========================================
  // Carga de Datos desde Firestore
  // ==========================================
  async loadAllData() {
    if (!FirebaseService.db) return;
    try {
      // 1. Cargar Vendedores (users)
      const sellersSnap = await FirebaseService.db.collection('users').get();
      this.sellers = sellersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Cargar Clientes (client_users)
      const clientsSnap = await FirebaseService.db.collection('client_users').get();
      this.clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Cargar Comunicados Globales (system_announcements)
      const annSnap = await FirebaseService.db.collection('system_announcements').orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] }));
      this.announcements = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`✅ Datos cargados: ${this.sellers.length} vendedores, ${this.clients.length} clientes, ${this.announcements.length} comunicados`);
    } catch (err) {
      console.error('Error al cargar datos en panel de admin:', err);
      this.showToast('⚠️ Error al refrescar datos de Firestore', 'error');
    }
  },

  async refreshData() {
    const btn = document.getElementById('admin-btn-refresh');
    if (btn) btn.classList.add('animate-spin');
    await this.loadAllData();
    this.renderActiveTab();
    if (btn) btn.classList.remove('animate-spin');
    this.showToast('✨ Datos actualizados desde la nube');
  },

  // ==========================================
  // Renderizado Principal & Pestañas
  // ==========================================
  renderMainDashboard() {
    const root = document.getElementById('admin-app-root');
    if (!root) return;

    root.innerHTML = `
      <!-- Layout General Admin -->
      <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        
        <!-- Header Superior de la Consola -->
        <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3">
          <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            <!-- Logo & Marca -->
            <div class="flex items-center gap-3">
              <a href="/app" class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-md hover:scale-105 transition cursor-pointer">
                🛡️
              </a>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                    Cakekulator <span class="text-amber-500">Admin</span>
                  </h1>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    CONSOLE
                  </span>
                </div>
                <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>cakekulator-bd (Firestore)</span>
                </div>
              </div>
            </div>

            <!-- Accesos Rápidos & Usuario Admin -->
            <div class="flex items-center gap-2 sm:gap-3">
              
              <!-- Ir a la App -->
              <a href="/app" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition">
                <span>🎂</span> <span>Ver App Vendedor</span>
              </a>

              <a href="/cliente" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition">
                <span>🛍️</span> <span>Portal Clientes</span>
              </a>

              <!-- Botón Refrescar -->
              <button 
                id="admin-btn-refresh" 
                onclick="AdminApp.refreshData()" 
                title="Sincronizar datos" 
                class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                🔄
              </button>

              <!-- Modo Oscuro / Claro -->
              <button 
                onclick="AdminApp.toggleTheme()" 
                title="Cambiar tema" 
                class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                🌓
              </button>

              <!-- Perfil Admin -->
              <div class="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                ${this.currentAdmin.photoURL ? `
                  <img src="${this.currentAdmin.photoURL}" class="w-8 h-8 rounded-full ring-2 ring-amber-400" alt="">
                ` : `
                  <div class="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                    ${(this.currentAdmin.displayName || 'A').charAt(0)}
                  </div>
                `}
                <button 
                  onclick="AdminApp.logout()" 
                  title="Cerrar sesión" 
                  class="text-xs text-red-500 hover:text-red-700 font-bold p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                >
                  Salir
                </button>
              </div>

            </div>

          </div>

          <!-- Barra de Navegación por Pestañas -->
          <div class="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 mt-3 overflow-x-auto no-scrollbar">
            <button onclick="AdminApp.switchTab('overview')" id="tab-btn-overview" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>📊</span> <span>Resumen Ejecutivo</span>
            </button>
            <button onclick="AdminApp.switchTab('sellers')" id="tab-btn-sellers" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>👩‍🍳</span> <span>Vendedores (${this.sellers.length})</span>
            </button>
            <button onclick="AdminApp.switchTab('clients')" id="tab-btn-clients" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>🛍️</span> <span>Clientes (${this.clients.length})</span>
            </button>
            <button onclick="AdminApp.switchTab('memberships')" id="tab-btn-memberships" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>👑</span> <span>Regalar Membresías PRO</span>
            </button>
            <button onclick="AdminApp.switchTab('broadcast')" id="tab-btn-broadcast" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>📢</span> <span>Comunicados Globales</span>
            </button>
            <button onclick="AdminApp.switchTab('config')" id="tab-btn-config" class="admin-tab-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              <span>⚙️</span> <span>Configuración & Admins</span>
            </button>
          </div>
        </header>

        <!-- Contenedor Dinámico de la Pestaña Activa -->
        <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div id="admin-tab-content"></div>
        </main>

        <!-- Footer -->
        <footer class="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
          Cakekulator Cloud Management Console &bull; Entorno Seguro con Firebase Authentication & Firestore
        </footer>

      </div>

      <!-- Modales de Administración -->
      <div id="admin-modals-root"></div>
    `;

    this.renderActiveTab();
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    this.renderActiveTab();
  },

  renderActiveTab() {
    // Actualizar estilo visual de los botones de pestañas
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('bg-amber-500', 'text-white', 'shadow-sm');
      btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    });
    const activeBtn = document.getElementById(`tab-btn-${this.activeTab}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-amber-500', 'text-white', 'shadow-sm');
      activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
    }

    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    if (this.activeTab === 'overview') this.renderOverviewTab(container);
    else if (this.activeTab === 'sellers') this.renderSellersTab(container);
    else if (this.activeTab === 'clients') this.renderClientsTab(container);
    else if (this.activeTab === 'memberships') this.renderMembershipsTab(container);
    else if (this.activeTab === 'broadcast') this.renderBroadcastTab(container);
    else if (this.activeTab === 'config') this.renderConfigTab(container);
  },

  // ==========================================
  // PESTAÑA 1: RESUMEN EJECUTIVO (METRICAS)
  // ==========================================
  renderOverviewTab(container) {
    const totalSellers = this.sellers.length;
    const totalClients = this.clients.length;
    const proUsers = this.sellers.filter(s => s.plan === 'pro' || s.isPro === true);
    const trialUsers = this.sellers.filter(s => s.plan === 'trial');
    const freeUsers = this.sellers.filter(s => s.plan === 'free' && !s.isPro);
    const adminUsers = this.sellers.filter(s => s.role === 'admin');

    const totalRecipesCreated = this.sellers.reduce((acc, s) => acc + (s.recipesCount || 0), 0);
    const totalQuotesCreated = this.sellers.reduce((acc, s) => acc + (s.quotesCount || 0), 0);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Tarjetas de Métricas Principales (KPIs) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vendedores</span>
              <span class="p-2 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 text-lg">👩‍🍳</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">${totalSellers}</span>
              <span class="text-[11px] text-emerald-500 font-bold">+100% activo</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Pasteleros y profesionales registrados</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Suscripciones PRO</span>
              <span class="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 text-lg">👑</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-amber-500 font-heading">${proUsers.length}</span>
              <span class="text-[11px] text-slate-400">($${(proUsers.length * 4990).toLocaleString('es-CL')} / mes est.)</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Membresías pagadas o regaladas</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">En Período de Prueba</span>
              <span class="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 text-lg">⏳</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-blue-500 font-heading">${trialUsers.length}</span>
              <span class="text-[11px] text-blue-400">14 días gratis</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Potenciales suscriptores PRO</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes del Portal</span>
              <span class="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 text-lg">🛍️</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-emerald-600 font-heading">${totalClients}</span>
              <span class="text-[11px] text-emerald-500">compradores</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Usuarios buscando pastelerías</p>
          </div>

        </div>

        <!-- Banner de Acciones Rápidas del Administrador -->
        <div class="bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span class="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">Acción Rápida</span>
              <h3 class="text-xl sm:text-2xl font-black font-heading mt-1">¿Deseas regalar una membresía PRO a un cliente?</h3>
              <p class="text-xs text-white/90 max-w-xl">
                Otorga meses o acceso vitalicio ilimitado a pastelerías amigas, familiares o ganadores de promociones sin requerir tarjeta de crédito.
              </p>
            </div>
            <button 
              onclick="AdminApp.switchTab('memberships')" 
              class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-2xl shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              🎁 Regalar Membresía PRO ↗
            </button>
          </div>
        </div>

        <!-- Dos Columnas: Distribución de Planes & Actividad Global -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Distribución de Planes -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>📊</span> Distribución de Planes de Usuario
            </h4>
            <div class="space-y-2 pt-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-600 dark:text-slate-300">Plan PRO (Suscritos)</span>
                <span class="font-black text-amber-500">${proUsers.length} (${totalSellers > 0 ? Math.round((proUsers.length / totalSellers) * 100) : 0}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full" style="width: ${totalSellers > 0 ? Math.round((proUsers.length / totalSellers) * 100) : 0}%"></div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">En Prueba Gratuita (Trial)</span>
                <span class="font-black text-blue-500">${trialUsers.length} (${totalSellers > 0 ? Math.round((trialUsers.length / totalSellers) * 100) : 0}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full" style="width: ${totalSellers > 0 ? Math.round((trialUsers.length / totalSellers) * 100) : 0}%"></div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <span class="font-medium text-slate-600 dark:text-slate-300">Plan Free (Límites activos)</span>
                <span class="font-black text-slate-500">${freeUsers.length} (${totalSellers > 0 ? Math.round((freeUsers.length / totalSellers) * 100) : 0}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div class="bg-slate-400 h-full rounded-full" style="width: ${totalSellers > 0 ? Math.round((freeUsers.length / totalSellers) * 100) : 0}%"></div>
              </div>
            </div>
          </div>

          <!-- Actividad Global de la Plataforma -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚀</span> Métricas de Uso de la Plataforma
            </h4>
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="p-3 bg-pink-50/70 dark:bg-slate-800 rounded-2xl border border-pink-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">🍰</span>
                <span class="text-xl font-black text-pink-600 dark:text-pink-300">${totalRecipesCreated}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Recetas Creadas</span>
              </div>

              <div class="p-3 bg-emerald-50/70 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">📋</span>
                <span class="text-xl font-black text-emerald-600 dark:text-emerald-300">${totalQuotesCreated}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Cotizaciones Enviadas</span>
              </div>

              <div class="p-3 bg-amber-50/70 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">🛡️</span>
                <span class="text-xl font-black text-amber-600 dark:text-amber-300">${adminUsers.length}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Administradores</span>
              </div>

              <div class="p-3 bg-purple-50/70 dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">📢</span>
                <span class="text-xl font-black text-purple-600 dark:text-purple-300">${this.announcements.filter(a => a.active).length}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Avisos Activos</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Tabla Rápida: Últimos 5 Vendedores Registrados -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>👥</span> Vendedores Recientes
            </h4>
            <button onclick="AdminApp.switchTab('sellers')" class="text-xs text-amber-500 hover:underline font-bold">
              Ver todos (${totalSellers}) ↗
            </button>
          </div>
          <div class="overflow-x-auto">
            ${this.renderUserRows(this.sellers.slice(0, 5))}
          </div>
        </div>

      </div>
    `;
  },

  // ==========================================
  // PESTAÑA 2: GESTION DE VENDEDORES (users)
  // ==========================================
  renderSellersTab(container) {
    const filtered = this.getFilteredUsers(this.sellers);

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Barra de Búsqueda, Filtros y Acciones -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div class="relative w-full sm:w-96">
              <input 
                type="text" 
                placeholder="Buscar por nombre, email o pastelería..." 
                value="${this.searchTerm}" 
                oninput="AdminApp.onSearch(this.value)"
                class="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <span class="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button 
                onclick="AdminApp.openCreateUserModal()" 
                class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>+</span> <span>Nuevo Vendedor</span>
              </button>

              <button 
                onclick="AdminApp.exportUsersToCSV('sellers')" 
                class="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Exportar a Excel (CSV)"
              >
                <span>📥</span> <span class="hidden sm:inline">Exportar CSV</span>
              </button>
            </div>

          </div>

          <!-- Filtros Rápidos por Plan -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button onclick="AdminApp.setPlanFilter('all')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              Todos (${this.sellers.length})
            </button>
            <button onclick="AdminApp.setPlanFilter('pro')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'pro' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              👑 Solo PRO (${this.sellers.filter(s => s.plan === 'pro' || s.isPro).length})
            </button>
            <button onclick="AdminApp.setPlanFilter('trial')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'trial' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              ⏳ En Prueba (${this.sellers.filter(s => s.plan === 'trial').length})
            </button>
            <button onclick="AdminApp.setPlanFilter('free')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'free' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              Free (${this.sellers.filter(s => s.plan === 'free' && !s.isPro).length})
            </button>
            <button onclick="AdminApp.setPlanFilter('admin')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'admin' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              🛡️ Admins (${this.sellers.filter(s => s.role === 'admin').length})
            </button>
            <button onclick="AdminApp.setPlanFilter('suspended')" class="px-2.5 py-1 rounded-lg font-bold transition ${this.planFilter === 'suspended' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              🚫 Suspendidos (${this.sellers.filter(s => s.status === 'suspended').length})
            </button>
          </div>

        </div>

        <!-- Tabla de Vendedores -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          ${filtered.length === 0 ? `
            <div class="p-12 text-center text-slate-400 space-y-2">
              <span class="text-4xl block">🔍</span>
              <p class="font-bold text-sm">No se encontraron vendedores con los filtros actuales.</p>
              <p class="text-xs">Prueba borrando el término de búsqueda o cambiando el filtro de plan.</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              ${this.renderUserRows(filtered)}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==========================================
  // PESTAÑA 3: CLIENTES DEL PORTAL (client_users)
  // ==========================================
  renderClientsTab(container) {
    let list = this.clients;
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(c => 
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.profile?.phone && c.profile.phone.includes(q)) ||
        (c.profile?.commune && c.profile.commune.toLowerCase().includes(q))
      );
    }

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Barra de Búsqueda -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="relative w-full sm:w-96">
            <input 
              type="text" 
              placeholder="Buscar por cliente, email, teléfono o comuna..." 
              value="${this.searchTerm}" 
              oninput="AdminApp.onSearch(this.value)"
              class="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <span class="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          </div>

          <button 
            onclick="AdminApp.exportUsersToCSV('clients')" 
            class="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>📥</span> <span>Exportar Clientes CSV</span>
          </button>
        </div>

        <!-- Tabla de Clientes -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          ${list.length === 0 ? `
            <div class="p-12 text-center text-slate-400 space-y-2">
              <span class="text-4xl block">🛍️</span>
              <p class="font-bold text-sm">No se encontraron clientes registrados en la plataforma.</p>
            </div>
          ` : `
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="p-3.5 pl-5">Cliente</th>
                  <th class="p-3.5">Contacto & Ubicación</th>
                  <th class="p-3.5">Favoritos</th>
                  <th class="p-3.5">Solicitudes Publicadas</th>
                  <th class="p-3.5 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${list.map(c => {
                  const name = c.displayName || c.profile?.name || 'Cliente sin nombre';
                  const email = c.email || 'Sin correo';
                  const phone = c.profile?.phone || 'Sin teléfono';
                  const commune = c.profile?.commune || 'Santiago';
                  const favCount = (c.favorites || []).length;
                  const reqCount = (c.requests || []).length;

                  return `
                    <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td class="p-3.5 pl-5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-600 font-bold flex items-center justify-center text-xs shrink-0">
                            ${name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span class="font-bold text-slate-900 dark:text-white block">${name}</span>
                            <span class="text-[11px] text-slate-400 block">${email}</span>
                          </div>
                        </div>
                      </td>
                      <td class="p-3.5">
                        <div class="space-y-0.5">
                          <span class="font-bold text-slate-800 dark:text-slate-200 block">${phone}</span>
                          <span class="text-[10px] text-slate-400 block">📍 ${commune}</span>
                        </div>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-full font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300">
                          ⭐ ${favCount} pastelerías
                        </span>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded-full font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                          🎂 ${reqCount} pedidos
                        </span>
                      </td>
                      <td class="p-3.5 pr-5 text-right">
                        <button 
                          onclick="AdminApp.viewClientDetails('${c.id}')" 
                          class="px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg transition"
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>

      </div>
    `;
  },

  // ==========================================
  // PESTAÑA 4: REGALAR MEMBRESÍAS PRO
  // ==========================================
  renderMembershipsTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Tarjeta Informativa de Membresías -->
        <div class="bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">👑</span>
            <h3 class="font-heading font-black text-xl text-white">Centro de Asignación y Regalo de Membresías</h3>
          </div>
          <p class="text-xs text-white/90 max-w-2xl leading-relaxed">
            Desde este panel puedes otorgar acceso PRO instantáneo a cualquier pastelero registrado o por correo. Los cambios se sincronizan en la nube inmediatamente y activarán las funciones en el celular del usuario sin que tenga que pagar nada.
          </p>
        </div>

        <!-- Selector Rápido de Usuario para Regalar PRO -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎁</span> Selecciona un Vendedor para Asignar o Extender Membresía
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Buscar y Seleccionar Usuario</label>
              <select id="membership-select-user" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400">
                <option value="">-- Elige un vendedor registrado --</option>
                ${this.sellers.map(s => `
                  <option value="${s.id}">
                    ${s.displayName || s.email} (${s.businessName || 'Sin Taller'}) &bull; [${(s.plan || 'free').toUpperCase()}]
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Membresía o Duración a Otorgar</label>
              <select id="membership-select-duration" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400">
                <option value="1m">🎁 1 Mes PRO Completo (+30 días)</option>
                <option value="3m">🎁 3 Meses PRO (+90 días)</option>
                <option value="6m">🎁 6 Meses PRO (+180 días)</option>
                <option value="1y">🎁 1 Año Completo PRO (+365 días)</option>
                <option value="lifetime" selected>👑 PRO Vitalicio / Permanente (Sin Vencimiento)</option>
                <option value="trial_30">⏳ Extender Período de Prueba (+30 días)</option>
                <option value="free">❌ Revocar a Plan Gratuito (Free)</option>
              </select>
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button 
              onclick="AdminApp.submitDirectGiftMembership()" 
              class="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>✨</span> <span>Aplicar Membresía en Firestore</span>
            </button>
          </div>
        </div>

        <!-- Lista de Usuarios PRO Activos -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>👑</span> Vendedores con Membresía PRO Activa (${this.sellers.filter(s => s.plan === 'pro' || s.isPro).length})
            </h4>
          </div>
          <div class="overflow-x-auto">
            ${this.renderUserRows(this.sellers.filter(s => s.plan === 'pro' || s.isPro))}
          </div>
        </div>

      </div>
    `;
  },

  // ==========================================
  // PESTAÑA 5: COMUNICADOS GLOBALES (BROADCAST)
  // ==========================================
  renderBroadcastTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Creador de Comunicados -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>📢</span> Publicar Comunicado Global para Usuarios
              </h4>
              <p class="text-xs text-slate-400">Este mensaje aparecerá fijado en la parte superior de la aplicación para todos los usuarios.</p>
            </div>
            <span class="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 text-xl">📢</span>
          </div>

          <form onsubmit="AdminApp.submitNewAnnouncement(event)" class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-500 mb-1">Título del Aviso</label>
                <input type="text" id="ann-title" required placeholder="Ej. ¡Nueva función de Escáner OCR disponible!" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div>
                <label class="block font-bold text-slate-500 mb-1">Tipo de Aviso</label>
                <select id="ann-type" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="info">ℹ️ Informativo / Novedad</option>
                  <option value="promo">🎁 Promoción / Membresía</option>
                  <option value="warning">⚠️ Mantenimiento o Alerta</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-500 mb-1">Contenido / Mensaje</label>
              <textarea id="ann-message" required rows="2" placeholder="Escribe el mensaje claro y conciso para los pasteleros..." class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-400"></textarea>
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2 font-bold cursor-pointer text-slate-600 dark:text-slate-300">
                <input type="checkbox" id="ann-active" checked class="rounded text-amber-500 focus:ring-amber-400 w-4 h-4" />
                <span>Activar inmediatamente al publicar</span>
              </label>

              <button type="submit" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5">
                <span>🚀</span> <span>Publicar en Toda la App</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Listado de Comunicados Existentes -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-5">
          <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Historial de Comunicados (${this.announcements.length})
          </h4>

          ${this.announcements.length === 0 ? `
            <div class="p-8 text-center text-slate-400">
              <p class="text-xs">No hay comunicados publicados aún.</p>
            </div>
          ` : `
            <div class="space-y-2.5">
              ${this.announcements.map(a => `
                <div class="p-3.5 rounded-2xl border ${a.active ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'} flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">${a.type === 'promo' ? '🎁' : (a.type === 'warning' ? '⚠️' : 'ℹ️')}</span>
                      <h5 class="font-bold text-xs text-slate-900 dark:text-white">${a.title}</h5>
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${a.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
                        ${a.active ? 'EN VIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-300">${a.message}</p>
                    <span class="text-[10px] text-slate-400 block">${new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || Date.now()).toLocaleDateString('es-CL')}</span>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button 
                      onclick="AdminApp.toggleAnnouncementStatus('${a.id}', ${!a.active})" 
                      class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
                    >
                      ${a.active ? 'Pausar' : 'Activar'}
                    </button>
                    <button 
                      onclick="AdminApp.deleteAnnouncement('${a.id}')" 
                      class="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // ==========================================
  // PESTAÑA 6: CONFIGURACIÓN & ADMINISTRADORES
  // ==========================================
  renderConfigTab(container) {
    const adminSellers = this.sellers.filter(s => s.role === 'admin' || this.MASTER_ADMIN_EMAILS.includes((s.email || '').toLowerCase()));

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Gestión de Administradores -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>🛡️</span> Administradores con Acceso a la Consola
              </h4>
              <p class="text-xs text-slate-400">Los usuarios con rol Admin tienen acceso completo a este panel, gestión de suscripciones y comunicados.</p>
            </div>
            <button 
              onclick="AdminApp.promptAddAdminEmail()" 
              class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              + Autorizar Nuevo Admin
            </button>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            ${this.MASTER_ADMIN_EMAILS.map(email => `
              <div class="py-2.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">${email}</span>
                  <span class="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full">SUPER ADMIN</span>
                </div>
                <span class="text-[11px] text-slate-400 font-mono">Maestro del Sistema</span>
              </div>
            `).join('')}

            ${adminSellers.filter(s => !this.MASTER_ADMIN_EMAILS.includes((s.email || '').toLowerCase())).map(s => `
              <div class="py-2.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">${s.email} (${s.displayName || 'Admin'})</span>
                  <span class="text-[9px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-black px-2 py-0.5 rounded-full">ROL ADMIN</span>
                </div>
                <button onclick="AdminApp.revokeAdminRole('${s.id}')" class="text-xs text-red-500 hover:underline font-bold">
                  Quitar Privilegios
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Herramientas de Mantenimiento & Exportación -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 class="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>💾</span> Copias de Seguridad & Exportación de Datos
          </h4>
          <p class="text-xs text-slate-400">Descarga los registros en formato compatible con Excel / Google Sheets para contabilidad o campañas.</p>

          <div class="flex flex-wrap gap-3 pt-2">
            <button 
              onclick="AdminApp.exportUsersToCSV('sellers')" 
              class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>📥</span> Exportar Vendedores (.CSV)
            </button>

            <button 
              onclick="AdminApp.exportUsersToCSV('clients')" 
              class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <span>📥</span> Exportar Clientes (.CSV)
            </button>
          </div>
        </div>

      </div>
    `;
  },

  // ==========================================
  // Componente: Filas de Tabla de Usuarios
  // ==========================================
  renderUserRows(usersList) {
    if (!usersList || usersList.length === 0) {
      return '<div class="p-6 text-center text-slate-400 text-xs">No hay registros</div>';
    }

    return `
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="p-3.5 pl-5">Usuario / Negocio</th>
            <th class="p-3.5">Plan & Membresía</th>
            <th class="p-3.5">Rol & Estado</th>
            <th class="p-3.5">Actividad</th>
            <th class="p-3.5 pr-5 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          ${usersList.map(u => {
            const name = u.displayName || u.email || 'Usuario';
            const business = u.businessName || 'Taller sin nombre';
            const email = u.email || 'Sin correo';
            const isPro = u.plan === 'pro' || u.isPro === true;
            const isTrial = u.plan === 'trial';
            const isSuspended = u.status === 'suspended';
            const isAdmin = u.role === 'admin';

            let planBadge = '';
            if (isPro) {
              const exp = u.subscriptionExpiryDate ? new Date(u.subscriptionExpiryDate).toLocaleDateString('es-CL') : 'Vitalicio';
              planBadge = `<span class="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-xs">👑 PRO (${exp})</span>`;
            } else if (isTrial) {
              planBadge = `<span class="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">⏳ PRUEBA</span>`;
            } else {
              planBadge = `<span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">⚪ FREE</span>`;
            }

            return `
              <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <td class="p-3.5 pl-5">
                  <div class="flex items-center gap-2.5">
                    ${u.photoURL ? `
                      <img src="${u.photoURL}" class="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0" alt="">
                    ` : `
                      <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                        ${name.charAt(0).toUpperCase()}
                      </div>
                    `}
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-900 dark:text-white truncate">${name}</span>
                        ${isAdmin ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black">ADMIN</span>' : ''}
                      </div>
                      <span class="text-[11px] text-pink-600 dark:text-pink-400 font-semibold block truncate">🎂 ${business}</span>
                      <span class="text-[10px] text-slate-400 font-mono block truncate">${email}</span>
                    </div>
                  </div>
                </td>

                <td class="p-3.5">
                  <div>
                    ${planBadge}
                  </div>
                </td>

                <td class="p-3.5">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-emerald-500'}"></span>
                    <span class="font-bold ${isSuspended ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}">
                      ${isSuspended ? 'Suspendido' : 'Activo'}
                    </span>
                  </div>
                </td>

                <td class="p-3.5">
                  <div class="space-y-0.5 text-[11px] text-slate-500">
                    <span>${u.recipesCount || 0} recetas &bull; ${u.quotesCount || 0} cotiz.</span>
                  </div>
                </td>

                <td class="p-3.5 pr-5 text-right">
                  <button 
                    onclick="AdminApp.openManageModal('${u.id}')" 
                    class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-300 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    ⚡ Gestionar
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  // ==========================================
  // MODAL DE GESTIÓN DE USUARIO (MEMBRESÍAS & ROLES)
  // ==========================================
  openManageModal(userId) {
    const user = this.sellers.find(s => s.id === userId);
    if (!user) return;
    this.selectedUser = user;

    const modalRoot = document.getElementById('admin-modals-root');
    if (!modalRoot) return;

    const isPro = user.plan === 'pro' || user.isPro === true;
    const isSuspended = user.status === 'suspended';
    const isAdmin = user.role === 'admin';

    modalRoot.innerHTML = `
      <div id="admin-user-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto modal-opening">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left modal-animate-in space-y-5 my-auto max-h-[94vh] overflow-y-auto">
          
          <!-- Encabezado del Usuario -->
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              ${user.photoURL ? `
                <img src="${user.photoURL}" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400 shadow-sm" alt="">
              ` : `
                <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  ${(user.displayName || 'U').charAt(0)}
                </div>
              `}
              <div>
                <h3 class="font-black text-base text-slate-900 dark:text-white leading-tight">${user.displayName || 'Usuario'}</h3>
                <p class="text-xs text-slate-400 font-mono">${user.email}</p>
                <span class="text-[10px] text-pink-600 dark:text-pink-400 font-semibold block mt-0.5">
                  🎂 ${user.businessName || 'Sin Nombre Comercial'}
                </span>
              </div>
            </div>
            <button onclick="AdminApp.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl p-1 rounded-full cursor-pointer">✕</button>
          </div>

          <!-- SECCIÓN 1: REGALAR O CAMBIAR MEMBRESÍA PRO -->
          <div class="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="font-black text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>👑</span> Estado de Membresía Actual:
              </h4>
              <span class="text-xs font-black ${isPro ? 'text-amber-600' : 'text-slate-500'}">
                ${isPro ? 'PRO ACTIVO' : (user.plan === 'trial' ? 'EN TRIAL' : 'PLAN FREE')}
              </span>
            </div>

            <p class="text-[11px] text-slate-600 dark:text-slate-400">
              Selecciona una acción para otorgar o extender la membresía de este usuario en Firestore:
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', '1m')" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-2xs">
                🎁 +1 Mes PRO
              </button>
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', '3m')" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-2xs">
                🎁 +3 Meses PRO
              </button>
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', '1y')" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-2xs">
                🎁 +1 Año PRO
              </button>
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', 'lifetime')" class="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-black text-xs transition active:scale-95 text-center cursor-pointer shadow-sm col-span-2 sm:col-span-1">
                👑 PRO Vitalicio
              </button>
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', 'trial_30')" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-2xs">
                ⏳ +30d Prueba
              </button>
              <button onclick="AdminApp.applyMembershipToUser('${user.id}', 'free')" class="p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-500 hover:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs transition active:scale-95 text-center cursor-pointer shadow-2xs text-red-500">
                ❌ Pasar a Free
              </button>
            </div>
          </div>

          <!-- SECCIÓN 2: ATRIBUCIONES & ESTADO -->
          <div class="space-y-3 text-xs">
            <h4 class="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Atribuciones & Seguridad de la Cuenta
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Rol del Usuario -->
              <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-200 block">Rol de Administrador</span>
                  <span class="text-[10px] text-slate-400">Permite acceso a este panel</span>
                </div>
                <button 
                  onclick="AdminApp.toggleUserRole('${user.id}')" 
                  class="px-3 py-1.5 rounded-xl font-black text-xs ${isAdmin ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'} transition cursor-pointer"
                >
                  ${isAdmin ? 'ADMIN' : 'VENDEDOR'}
                </button>
              </div>

              <!-- Estado de la Cuenta -->
              <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 dark:text-slate-200 block">Estado de Cuenta</span>
                  <span class="text-[10px] text-slate-400">Bloquear o habilitar acceso</span>
                </div>
                <button 
                  onclick="AdminApp.toggleUserSuspension('${user.id}')" 
                  class="px-3 py-1.5 rounded-xl font-black text-xs ${isSuspended ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'} transition cursor-pointer"
                >
                  ${isSuspended ? 'SUSPENDIDA' : 'ACTIVA'}
                </button>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: NOTAS INTERNAS DEL ADMIN -->
          <div class="space-y-1.5 text-xs">
            <label class="block font-bold text-slate-500">Notas Privadas del Administrador</label>
            <textarea 
              id="admin-user-notes" 
              rows="2" 
              placeholder="Escribe notas internas sobre este cliente (convenio, pagos por transferencia, etc.)..." 
              class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-amber-400"
            >${user.adminNotes || ''}</textarea>
            <button 
              onclick="AdminApp.saveUserNotes('${user.id}')" 
              class="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Guardar Nota
            </button>
          </div>

        </div>
      </div>
    `;
  },

  closeModal() {
    const root = document.getElementById('admin-modals-root');
    if (root) root.innerHTML = '';
    this.selectedUser = null;
  },

  // ==========================================
  // Acciones de Modificación en Firestore
  // ==========================================
  async applyMembershipToUser(userId, durationType) {
    if (!FirebaseService.db) return;

    try {
      const now = new Date();
      let newPlan = 'pro';
      let isPro = true;
      let expiryDate = null;
      let label = '';

      if (durationType === '1m') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiryDate = d.toISOString();
        label = '1 Mes PRO';
      } else if (durationType === '3m') {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        expiryDate = d.toISOString();
        label = '3 Meses PRO';
      } else if (durationType === '6m') {
        const d = new Date();
        d.setDate(d.getDate() + 180);
        expiryDate = d.toISOString();
        label = '6 Meses PRO';
      } else if (durationType === '1y') {
        const d = new Date();
        d.setDate(d.getDate() + 365);
        expiryDate = d.toISOString();
        label = '1 Año PRO';
      } else if (durationType === 'lifetime') {
        expiryDate = null; // Sin vencimiento
        label = 'PRO Vitalicio (Permanente)';
      } else if (durationType === 'trial_30') {
        newPlan = 'trial';
        isPro = true;
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiryDate = d.toISOString();
        label = 'Prueba extendida por 30 días';
      } else if (durationType === 'free') {
        newPlan = 'free';
        isPro = false;
        expiryDate = null;
        label = 'Plan Free / Gratuito';
      }

      const updatePayload = {
        plan: newPlan,
        isPro: isPro,
        subscriptionExpiryDate: expiryDate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMembershipChange: {
          assignedBy: this.currentAdmin.email,
          assignedAt: new Date().toISOString(),
          type: label
        }
      };

      await FirebaseService.db.collection('users').doc(userId).set(updatePayload, { merge: true });

      // Actualizar memoria local
      const user = this.sellers.find(s => s.id === userId);
      if (user) {
        user.plan = newPlan;
        user.isPro = isPro;
        user.subscriptionExpiryDate = expiryDate;
      }

      this.closeModal();
      this.renderActiveTab();
      this.showToast(`🎉 Membresía asignada: ${label}`);
    } catch (e) {
      console.error('Error al otorgar membresía:', e);
      this.showToast('❌ Error al actualizar membresía en Firestore', 'error');
    }
  },

  async submitDirectGiftMembership() {
    const userSelect = document.getElementById('membership-select-user');
    const durationSelect = document.getElementById('membership-select-duration');
    if (!userSelect || !durationSelect || !userSelect.value) {
      alert('Por favor selecciona un vendedor de la lista.');
      return;
    }
    await this.applyMembershipToUser(userSelect.value, durationSelect.value);
  },

  async toggleUserRole(userId) {
    if (!FirebaseService.db) return;
    const user = this.sellers.find(s => s.id === userId);
    if (!user) return;

    const newRole = user.role === 'admin' ? 'seller' : 'admin';
    try {
      await FirebaseService.db.collection('users').doc(userId).set({
        role: newRole,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      user.role = newRole;
      this.openManageModal(userId);
      this.renderActiveTab();
      this.showToast(`Rol actualizado a: ${newRole.toUpperCase()}`);
    } catch (e) {
      this.showToast('Error al actualizar rol', 'error');
    }
  },

  async toggleUserSuspension(userId) {
    if (!FirebaseService.db) return;
    const user = this.sellers.find(s => s.id === userId);
    if (!user) return;

    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await FirebaseService.db.collection('users').doc(userId).set({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      user.status = newStatus;
      this.openManageModal(userId);
      this.renderActiveTab();
      this.showToast(newStatus === 'suspended' ? '🚫 Usuario suspendido' : '✅ Usuario reactivado');
    } catch (e) {
      this.showToast('Error al cambiar estado', 'error');
    }
  },

  async saveUserNotes(userId) {
    if (!FirebaseService.db) return;
    const notesInput = document.getElementById('admin-user-notes');
    if (!notesInput) return;

    try {
      await FirebaseService.db.collection('users').doc(userId).set({
        adminNotes: notesInput.value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      const user = this.sellers.find(s => s.id === userId);
      if (user) user.adminNotes = notesInput.value.trim();

      this.showToast('✅ Nota interna guardada');
    } catch (e) {
      this.showToast('Error al guardar nota', 'error');
    }
  },

  // ==========================================
  // Crear Nuevo Vendedor Directamente
  // ==========================================
  openCreateUserModal() {
    const root = document.getElementById('admin-modals-root');
    if (!root) return;

    root.innerHTML = `
      <div id="admin-create-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto modal-opening">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left modal-animate-in space-y-4 my-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 class="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>+</span> Registrar Nuevo Vendedor en Firestore
            </h3>
            <button onclick="AdminApp.closeModal()" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">✕</button>
          </div>

          <form onsubmit="AdminApp.submitCreateUser(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-500 mb-1">Nombre Completo *</label>
              <input type="text" id="new-user-name" required placeholder="Ej. Camila Morales" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-slate-500 mb-1">Correo Electrónico (Gmail) *</label>
                <input type="email" id="new-user-email" required placeholder="pastelera@gmail.com" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none" />
              </div>
              <div>
                <label class="block font-bold text-slate-500 mb-1">Nombre de la Pastelería</label>
                <input type="text" id="new-user-business" placeholder="Ej. Dulce Encanto" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-500 mb-1">Membresía Inicial</label>
              <select id="new-user-plan" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none">
                <option value="lifetime">👑 PRO Vitalicio (Sin expiración)</option>
                <option value="1m">🎁 1 Mes PRO (+30 días)</option>
                <option value="trial">⏳ Período de Prueba (14 días)</option>
                <option value="free">⚪ Plan Gratuito (Free)</option>
              </select>
            </div>

            <div class="pt-3 flex gap-2">
              <button type="button" onclick="AdminApp.closeModal()" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold">Cancelar</button>
              <button type="submit" class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl">Crear en Firestore</button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  async submitCreateUser(e) {
    e.preventDefault();
    if (!FirebaseService.db) return;

    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim().toLowerCase();
    const business = document.getElementById('new-user-business').value.trim();
    const plan = document.getElementById('new-user-plan').value;

    const isPro = plan === 'lifetime' || plan === '1m';
    let expiry = null;
    if (plan === '1m') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiry = d.toISOString();
    }

    try {
      const newDocRef = FirebaseService.db.collection('users').doc();
      const payload = {
        uid: newDocRef.id,
        displayName: name,
        email: email,
        businessName: business,
        plan: isPro ? 'pro' : plan,
        isPro: isPro,
        subscriptionExpiryDate: expiry,
        role: 'seller',
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        recipesCount: 0,
        quotesCount: 0
      };

      await newDocRef.set(payload);
      this.sellers.unshift(payload);
      this.closeModal();
      this.renderActiveTab();
      this.showToast('✅ Vendedor creado correctamente en Firestore');
    } catch (err) {
      console.error(err);
      this.showToast('Error al crear usuario', 'error');
    }
  },

  // ==========================================
  // Comunicados Globales (system_announcements)
  // ==========================================
  async submitNewAnnouncement(e) {
    e.preventDefault();
    if (!FirebaseService.db) return;

    const title = document.getElementById('ann-title').value.trim();
    const type = document.getElementById('ann-type').value;
    const message = document.getElementById('ann-message').value.trim();
    const active = document.getElementById('ann-active').checked;

    try {
      const docRef = await FirebaseService.db.collection('system_announcements').add({
        title,
        type,
        message,
        active,
        author: this.currentAdmin.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.announcements.unshift({
        id: docRef.id,
        title,
        type,
        message,
        active,
        author: this.currentAdmin.email,
        createdAt: new Date()
      });

      this.renderActiveTab();
      this.showToast('📢 ¡Comunicado publicado en toda la app!');
    } catch (err) {
      this.showToast('Error al publicar comunicado', 'error');
    }
  },

  async toggleAnnouncementStatus(annId, newStatus) {
    if (!FirebaseService.db) return;
    try {
      await FirebaseService.db.collection('system_announcements').doc(annId).update({ active: newStatus });
      const a = this.announcements.find(x => x.id === annId);
      if (a) a.active = newStatus;
      this.renderActiveTab();
      this.showToast(newStatus ? '📢 Comunicado activado' : 'Comunicado pausado');
    } catch (e) {
      this.showToast('Error al actualizar aviso', 'error');
    }
  },

  async deleteAnnouncement(annId) {
    if (!confirm('¿Seguro que deseas eliminar este comunicado?')) return;
    if (!FirebaseService.db) return;
    try {
      await FirebaseService.db.collection('system_announcements').doc(annId).delete();
      this.announcements = this.announcements.filter(x => x.id !== annId);
      this.renderActiveTab();
      this.showToast('🗑️ Comunicado eliminado');
    } catch (e) {
      this.showToast('Error al eliminar comunicado', 'error');
    }
  },

  // ==========================================
  // Exportar Usuarios a Formato CSV (Excel)
  // ==========================================
  exportUsersToCSV(type = 'sellers') {
    let rows = [];
    let filename = '';

    if (type === 'sellers') {
      filename = `cakekulator_vendedores_${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push(['UID', 'Nombre', 'Email', 'Pasteleria', 'Rol', 'Plan', 'Es_PRO', 'Vencimiento', 'Recetas', 'Cotizaciones', 'Estado']);

      this.sellers.forEach(s => {
        rows.push([
          `"${s.id || ''}"`,
          `"${(s.displayName || '').replace(/"/g, '""')}"`,
          `"${s.email || ''}"`,
          `"${(s.businessName || '').replace(/"/g, '""')}"`,
          `"${s.role || 'seller'}"`,
          `"${s.plan || 'free'}"`,
          s.isPro ? 'SI' : 'NO',
          `"${s.subscriptionExpiryDate || 'Vitalicio'}"`,
          s.recipesCount || 0,
          s.quotesCount || 0,
          `"${s.status || 'active'}"`
        ]);
      });
    } else {
      filename = `cakekulator_clientes_${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push(['UID', 'Nombre', 'Email', 'Telefono', 'Comuna', 'Favoritos', 'Solicitudes']);

      this.clients.forEach(c => {
        rows.push([
          `"${c.id || ''}"`,
          `"${(c.displayName || c.profile?.name || '').replace(/"/g, '""')}"`,
          `"${c.email || ''}"`,
          `"${c.profile?.phone || ''}"`,
          `"${c.profile?.commune || ''}"`,
          (c.favorites || []).length,
          (c.requests || []).length
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    this.showToast(`📥 Archivo ${filename} descargado con éxito`);
  },

  // ==========================================
  // Filtros & Búsqueda
  // ==========================================
  onSearch(val) {
    this.searchTerm = val;
    this.renderActiveTab();
  },

  setPlanFilter(filter) {
    this.planFilter = filter;
    this.renderActiveTab();
  },

  getFilteredUsers(list) {
    let result = list;

    if (this.planFilter === 'pro') {
      result = result.filter(u => u.plan === 'pro' || u.isPro === true);
    } else if (this.planFilter === 'trial') {
      result = result.filter(u => u.plan === 'trial');
    } else if (this.planFilter === 'free') {
      result = result.filter(u => u.plan === 'free' && !u.isPro);
    } else if (this.planFilter === 'admin') {
      result = result.filter(u => u.role === 'admin');
    } else if (this.planFilter === 'suspended') {
      result = result.filter(u => u.status === 'suspended');
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
      );
    }

    return result;
  },

  // ==========================================
  // Pantallas de Acceso & Carga
  // ==========================================
  renderLoading() {
    const root = document.getElementById('admin-app-root');
    if (!root) return;
    root.innerHTML = `
      <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white text-2xl flex items-center justify-center animate-bounce mb-4 shadow-lg shadow-amber-500/20">
          🛡️
        </div>
        <h2 class="font-heading font-black text-xl mb-1">Verificando Privilegios de Administrador...</h2>
        <p class="text-xs text-slate-400">Consultando credenciales en Firebase Cloud Firestore</p>
      </div>
    `;
  },

  renderLoginRequired() {
    const root = document.getElementById('admin-app-root');
    if (!root) return;
    root.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div class="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20">
            🛡️
          </div>
          <div>
            <h2 class="font-heading font-black text-2xl text-white">Consola de Administración</h2>
            <p class="text-xs text-slate-400 mt-1">Acceso restringido para el equipo administrativo de Cakekulator.</p>
          </div>

          <div class="pt-2">
            <button 
              onclick="AdminApp.loginWithGoogle()" 
              class="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Acceder con Cuenta de Administrador</span>
            </button>
          </div>

          <div class="border-t border-slate-800 pt-3">
            <a href="/app" class="text-xs text-slate-400 hover:text-amber-400 transition">
              ← Volver a la App Principal
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderAccessDenied(user) {
    const root = document.getElementById('admin-app-root');
    if (!root) return;
    root.innerHTML = `
      <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div class="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center text-3xl mx-auto">
            🚫
          </div>
          <h2 class="font-heading font-black text-xl text-white">Acceso No Autorizado</h2>
          <p class="text-xs text-slate-400">
            Has iniciado sesión como <strong class="text-white">${user.email}</strong>, pero esta cuenta no tiene privilegios de Administrador.
          </p>

          <div class="pt-3 space-y-2">
            <button 
              onclick="AdminApp.logout()" 
              class="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cambiar de Cuenta de Google
            </button>

            <a 
              href="/app" 
              class="block w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition"
            >
              Volver a la App de Pastelería
            </a>
          </div>
        </div>
      </div>
    `;
  },

  async loginWithGoogle() {
    if (!FirebaseService.auth || !FirebaseService.googleProvider) return;
    try {
      await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
    } catch (e) {
      alert('Error al iniciar sesión: ' + e.message);
    }
  },

  async logout() {
    if (FirebaseService.auth) {
      await FirebaseService.auth.signOut();
      window.location.reload();
    }
  },

  showToast(message, type = 'success') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.className = 'fixed bottom-6 right-6 z-50 text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-300 max-w-sm pointer-events-none flex items-center gap-2';
      document.body.appendChild(toast);
    }
    toast.className = `fixed bottom-6 right-6 z-50 text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-300 max-w-sm pointer-events-none flex items-center gap-2 ${type === 'error' ? 'bg-red-900 border-red-700 text-white' : 'bg-slate-900 border-slate-700 text-white'}`;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3500);
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
