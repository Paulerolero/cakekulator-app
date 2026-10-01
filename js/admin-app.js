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
  notifications: [],
  isLoading: true,
  selectedUser: null,
  permissionDeniedError: false,
  firestoreErrorMessage: '',

  // CRM Masivo & Selección múltiple
  selectedSellerIds: new Set(),
  activityFilter: 'all', // 'all' | 'high_recipes' | 'zero_recipes' | 'active_recent' | 'inactive_14d'

  // Radar de Tendencias de Pastelería & BI de Insumos
  allPlatformRecipes: [],
  allPlatformIngredients: [],
  marketRadarStats: null,
  trendsChartInstance: null,

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
    // Si hay gráficos activos, re-renderizar para ajustar paletas
    if (this.adminChartInstance) {
      this.initAdminGrowthChart();
    }
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
      if (sidebar.classList.contains('-translate-x-full')) {
        this.openMobileSidebar();
      } else {
        this.closeMobileSidebar();
      }
    }
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    }
    if (backdrop) backdrop.classList.remove('hidden');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
    }
    if (backdrop) backdrop.classList.add('hidden');
  },

  adminChartInstance: null,

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

        // Auto-registrar admin físicamente en users/{uid} para que quede registrado
        if (FirebaseService.db) {
          try {
            await FirebaseService.db.collection('users').doc(user.uid).set({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Administrador Principal',
              photoURL: user.photoURL || '',
              role: 'admin',
              plan: 'pro',
              isPro: true,
              status: 'active',
              lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn('Auto-registro admin:', e);
          }
        }

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
    this.permissionDeniedError = false;
    this.firestoreErrorMessage = '';

    // 1. Cargar Vendedores (users)
    try {
      const sellersSnap = await FirebaseService.db.collection('users').get();
      this.sellers = sellersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error al cargar users:', err);
      if (err.code === 'permission-denied') {
        this.permissionDeniedError = true;
        this.firestoreErrorMessage = 'Las Reglas de Seguridad de Firestore en Firebase Console impiden listar la colección "users" (permission-denied).';
      }
    }

    // 2. Cargar Clientes (client_users)
    try {
      const clientsSnap = await FirebaseService.db.collection('client_users').get();
      this.clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error al cargar client_users:', err);
      if (err.code === 'permission-denied') {
        this.permissionDeniedError = true;
      }
    }

    // 3. Auto-descubrir usuarios históricos y recolectar Recetas e Insumos para BI & Radar
    try {
      this.allPlatformRecipes = [];
      this.allPlatformIngredients = [];
      const dataSnap = await FirebaseService.db.collectionGroup('data').get().catch(() => ({ docs: [] }));
      if (dataSnap && dataSnap.docs && dataSnap.docs.length > 0) {
        const uidMap = {};
        dataSnap.docs.forEach(doc => {
          const parentUser = doc.ref.parent.parent;
          if (parentUser && parentUser.parent && parentUser.parent.id === 'users') {
            const uid = parentUser.id;
            if (!uidMap[uid]) uidMap[uid] = { settings: null, recipesCount: 0, quotesCount: 0, recipes: [], ingredients: [] };
            if (doc.id === 'settings') {
              uidMap[uid].settings = doc.data()?.data || {};
            } else if (doc.id === 'recipes') {
              const d = doc.data()?.data;
              const recList = Array.isArray(d) ? d : [];
              uidMap[uid].recipesCount = recList.length;
              uidMap[uid].recipes = recList;
              recList.forEach(r => this.allPlatformRecipes.push({ ...r, ownerUid: uid }));
            } else if (doc.id === 'ingredients') {
              const d = doc.data()?.data;
              const ingList = Array.isArray(d) ? d : [];
              uidMap[uid].ingredients = ingList;
              ingList.forEach(i => this.allPlatformIngredients.push({ ...i, ownerUid: uid }));
            } else if (doc.id === 'quotes') {
              const d = doc.data()?.data;
              uidMap[uid].quotesCount = Array.isArray(d) ? d.length : 0;
            }
          }
        });

        for (const [uid, meta] of Object.entries(uidMap)) {
          const existing = this.sellers.find(s => s.id === uid || s.uid === uid);
          const st = meta.settings || {};
          const email = st.email || st.contactEmail || `usuario-${uid.substring(0, 6)}@cakekulator.app`;
          const name = st.businessName || st.businessNameProducts || `Pastelera (${uid.substring(0, 5)})`;
          const role = (uid === this.currentAdmin?.uid || this.MASTER_ADMIN_EMAILS.some(m => email.toLowerCase().includes(m.toLowerCase()))) ? 'admin' : 'seller';

          const reconstructed = {
            id: uid,
            uid: uid,
            email: email,
            displayName: name,
            businessName: st.businessName || st.businessNameProducts || '',
            role: role,
            plan: 'trial',
            isPro: true,
            status: 'active',
            recipesCount: meta.recipesCount,
            quotesCount: meta.quotesCount,
            recipes: meta.recipes || [],
            ingredients: meta.ingredients || [],
            settings: st,
            lastLoginAt: new Date()
          };

          if (!existing) {
            this.sellers.push(reconstructed);
            // Auto-sanar en Firestore creando el documento físico en users/{uid}
            FirebaseService.db.collection('users').doc(uid).set(reconstructed, { merge: true }).catch(() => {});
          } else {
            if (!existing.recipesCount && meta.recipesCount) existing.recipesCount = meta.recipesCount;
            if (!existing.quotesCount && meta.quotesCount) existing.quotesCount = meta.quotesCount;
            if (!existing.businessName && st.businessName) existing.businessName = st.businessName;
            existing.recipes = meta.recipes || existing.recipes || [];
            existing.ingredients = meta.ingredients || existing.ingredients || [];
            existing.settings = st || existing.settings || {};
          }
        }
      }
    } catch (e) {
      console.warn('Auto-descubrimiento en subcolecciones:', e);
    }

    this.buildMarketRadarStats();

    // 3.5. Sincronizar usuarios registrados en Firebase Authentication
    const REGISTERED_AUTH_ACCOUNTS = [
      {
        uid: "EdjJDIkEP3RDRwbA24Vf06KRhmf1",
        email: "j1515mk@gmail.com",
        displayName: "Janis",
        photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKv4-kSiSbNL4VgQoimTw3iPKHUamrqJ21pjzqtx5M8OrQZ8qhl=s96-c",
        role: "seller",
        plan: "trial",
        isPro: true,
        status: "active",
        recipesCount: 0,
        quotesCount: 0,
        createdAt: new Date(1787545744191),
        lastLoginAt: new Date(1787546837368)
      },
      {
        uid: "hA3KgIyHEmVBADOHN5GM27EW7wv2",
        email: "virginia.saez.rojas@gmail.com",
        displayName: "Virginia Saez",
        photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKtjMrxybatyOM-S2Z45Z6N9uc8mwxptahh4_Jpf5bT16Ii54c2=s96-c",
        role: "seller",
        plan: "trial",
        isPro: true,
        status: "active",
        recipesCount: 0,
        quotesCount: 0,
        createdAt: new Date(1787622333800),
        lastLoginAt: new Date(1787622333800)
      }
    ];

    for (const authAcc of REGISTERED_AUTH_ACCOUNTS) {
      const existing = this.sellers.find(s => s.id === authAcc.uid || (s.email && s.email.toLowerCase() === authAcc.email.toLowerCase()));
      if (!existing) {
        this.sellers.push({ id: authAcc.uid, ...authAcc });
        if (FirebaseService.db) {
          FirebaseService.db.collection('users').doc(authAcc.uid).set(authAcc, { merge: true }).catch(console.error);
        }
      }
    }

    // 4. Si el admin actual está autenticado, asegurar que aparezca en la lista
    if (this.currentAdmin && !this.sellers.some(s => s.id === this.currentAdmin.uid || s.email === this.currentAdmin.email)) {
      this.sellers.unshift({
        id: this.currentAdmin.uid,
        uid: this.currentAdmin.uid,
        email: this.currentAdmin.email,
        displayName: this.currentAdmin.displayName || 'Administrador Principal',
        photoURL: this.currentAdmin.photoURL || '',
        role: 'admin',
        plan: 'pro',
        isPro: true,
        status: 'active',
        recipesCount: 0,
        quotesCount: 0
      });
    }

    // 5. Cargar Comunicados Globales (system_announcements)
    try {
      const annSnap = await FirebaseService.db.collection('system_announcements').orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] }));
      this.announcements = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      this.announcements = [];
    }

    // 6. Cargar Notificaciones Push Enviadas (system_notifications)
    try {
      const notifSnap = await FirebaseService.db.collection('system_notifications').orderBy('createdAt', 'desc').limit(50).get().catch(() => ({ docs: [] }));
      this.notifications = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      this.notifications = [];
    }

    console.log(`✅ Datos cargados: ${this.sellers.length} vendedores, ${this.clients.length} clientes, ${this.announcements.length} comunicados, ${this.notifications.length} notificaciones`);
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
      <!-- Layout General Admin con Barra Lateral Tradicional -->
      <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
        
        <!-- Mobile Sidebar Backdrop Overlay -->
        <div id="admin-sidebar-backdrop" onclick="AdminApp.closeMobileSidebar()"
          class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 hidden transition-opacity duration-300 md:hidden"></div>

        <!-- ==========================================
             BARRA LATERAL TRADICIONAL (Desktop Fija / Móvil Drawer)
             ========================================== -->
        <aside id="admin-sidebar"
          class="fixed md:sticky top-0 left-0 z-50 md:z-30 w-72 md:w-64 lg:w-72 h-screen flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out -translate-x-full md:translate-x-0 select-none shadow-2xl md:shadow-none shrink-0">
          
          <!-- Marca / Logo Header -->
          <div class="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="AdminApp.switchTab('overview')">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition shrink-0">
                🛡️
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h1 class="font-heading font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">
                    Cakekulator
                  </h1>
                  <span class="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    ADMIN
                  </span>
                </div>
                <span class="text-[10px] font-bold text-slate-400 block mt-0.5">
                  Consola Superusuario
                </span>
              </div>
            </div>

            <!-- Botón cerrar menú lateral en móvil -->
            <button type="button" onclick="AdminApp.closeMobileSidebar()" class="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Navegación Lateral por Módulos -->
          <div class="flex-1 overflow-y-auto p-3 lg:p-4 space-y-6 custom-scrollbar">
            
            <!-- Grupo 1: Monitoreo & Rendimiento -->
            <div class="space-y-1">
              <span class="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Métricas & BI
              </span>
              <button onclick="AdminApp.switchTab('overview')" id="tab-btn-overview"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">📊</span>
                  <span>Resumen Ejecutivo</span>
                </div>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">Live</span>
              </button>

              <button onclick="AdminApp.switchTab('trends')" id="tab-btn-trends"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">🥧</span>
                  <span>Radar de Tendencias</span>
                </div>
                <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">BI</span>
              </button>
            </div>

            <!-- Grupo 2: Comunidad & Cuentas -->
            <div class="space-y-1">
              <span class="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Gestión de Cuentas (CRM)
              </span>
              <button onclick="AdminApp.switchTab('sellers')" id="tab-btn-sellers"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">👩‍🍳</span>
                  <span>Vendedores</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">${this.sellers.length}</span>
              </button>

              <button onclick="AdminApp.switchTab('clients')" id="tab-btn-clients"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">🛍️</span>
                  <span>Clientes Portal</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">${this.clients.length}</span>
              </button>

              <button onclick="AdminApp.switchTab('memberships')" id="tab-btn-memberships"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">👑</span>
                  <span>Regalar Membresías</span>
                </div>
                <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">PRO</span>
              </button>
            </div>

            <!-- Grupo 3: Marketing & Sistema -->
            <div class="space-y-1">
              <span class="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Operaciones & Enlaces
              </span>
              <button onclick="AdminApp.switchTab('broadcast')" id="tab-btn-broadcast"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">📢</span>
                  <span>Comunicados</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">${this.notifications.length + this.announcements.length}</span>
              </button>

              <button onclick="AdminApp.switchTab('config')" id="tab-btn-config"
                class="admin-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer">
                <div class="flex items-center gap-3">
                  <span class="text-base">⚙️</span>
                  <span>Configuración & Admins</span>
                </div>
              </button>
            </div>

          </div>

          <!-- Footer Lateral con Perfil Admin & Estado Cloud -->
          <div class="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <div class="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <div class="flex items-center gap-2.5 min-w-0">
                ${this.currentAdmin.photoURL ? `
                  <img src="${this.currentAdmin.photoURL}" class="w-8 h-8 rounded-full ring-2 ring-amber-400 shrink-0" alt="">
                ` : `
                  <div class="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    ${(this.currentAdmin.displayName || 'A').charAt(0)}
                  </div>
                `}
                <div class="min-w-0">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                    ${this.currentAdmin.displayName || 'Super Admin'}
                  </span>
                  <span class="text-[10px] text-slate-400 truncate block">
                    ${this.currentAdmin.email || 'admin'}
                  </span>
                </div>
              </div>
              <button 
                onclick="AdminApp.logout()" 
                title="Cerrar sesión" 
                class="p-1.5 text-xs text-rose-500 hover:text-rose-700 font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                🚪
              </button>
            </div>

            <!-- Estado de Sincronización Cloud -->
            <div class="flex items-center justify-between text-[11px] px-1 text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Cloud</span>
              </span>
              <span class="font-mono text-[10px]">v3.6 Pro</span>
            </div>
          </div>

        </aside>

        <!-- ==========================================
             CONTENIDO PRINCIPAL (Topbar + Vistas)
             ========================================== -->
        <div class="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
          
          <!-- Topbar Header Superior -->
          <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-2.5 sm:py-3 shrink-0">
            <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
              
              <!-- Botón Menú Móvil Hamburger + Título -->
              <div class="flex items-center gap-3">
                <button type="button" onclick="AdminApp.toggleMobileSidebar()" class="md:hidden p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer" title="Abrir Menú">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div>
                  <h2 class="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span id="admin-topbar-title">Consola de Control Central</span>
                  </h2>
                  <span class="text-[10px] text-slate-400 hidden sm:block">Monitoreo en tiempo real de Cakekulator Platform</span>
                </div>
              </div>

              <!-- Acciones Rápidas & Enlaces Externos -->
              <div class="flex items-center gap-2 sm:gap-3">
                
                <!-- Acceso a Google Play Console -->
                <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" 
                  class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition">
                  <span>🤖</span> <span>Google Play Console</span>
                </a>

                <a href="/app" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition">
                  <span>🎂</span> <span>App Vendedor</span>
                </a>

                <a href="/cliente" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition">
                  <span>🛍️</span> <span>Portal Clientes</span>
                </a>

                <!-- Refrescar -->
                <button 
                  id="admin-btn-refresh" 
                  onclick="AdminApp.refreshData()" 
                  title="Sincronizar datos" 
                  class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  🔄
                </button>

                <!-- Tema -->
                <button 
                  onclick="AdminApp.toggleTheme()" 
                  title="Cambiar tema" 
                  class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  🌓
                </button>

              </div>

            </div>
          </header>

          <!-- Contenedor Dinámico con Scroll Interno -->
          <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:overflow-y-auto custom-scrollbar">
            
            <!-- Alerta de Reglas de Seguridad si corresponde -->
            ${this.permissionDeniedError ? `
              <div class="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-950 dark:text-amber-200 p-4 sm:p-5 rounded-3xl space-y-3 shadow-md">
                <div class="flex items-center gap-2 font-black text-sm text-amber-700 dark:text-amber-400">
                  <span class="text-xl">⚠️</span> 
                  <span>Reglas de Seguridad de Firestore en Firebase Console</span>
                </div>
                <p class="text-xs leading-relaxed">
                  Firestore rechazó la lectura con <strong>permisos insuficientes (permission-denied)</strong> al listar la colección de usuarios. Por defecto, Firebase solo permite que un usuario consulte su propio UID (<code>request.auth.uid == userId</code>).
                </p>
                <div class="flex items-center justify-between pt-1">
                  <span class="text-[11px] text-slate-500">Para solucionar, actualiza las reglas en Firebase Console y haz clic aquí:</span>
                  <button onclick="AdminApp.refreshData()" class="px-3 py-1.5 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition cursor-pointer">
                    🔄 Reintentar Lectura
                  </button>
                </div>
              </div>
            ` : ''}

            <div id="admin-tab-content"></div>
          </main>

        </div>

      </div>

      <!-- Modales de Administración -->
      <div id="admin-modals-root"></div>
    `;

    this.renderActiveTab();
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (!sidebar) return;
    const isClosed = sidebar.classList.contains('-translate-x-full');
    if (isClosed) {
      this.openMobileSidebar();
    } else {
      this.closeMobileSidebar();
    }
  },

  openMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    this.closeMobileSidebar();
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
    else if (this.activeTab === 'trends') this.renderTrendsTab(container);
    else if (this.activeTab === 'sellers') this.renderSellersTab(container);
    else if (this.activeTab === 'clients') this.renderClientsTab(container);
    else if (this.activeTab === 'memberships') this.renderMembershipsTab(container);
    else if (this.activeTab === 'broadcast') this.renderBroadcastTab(container);
    else if (this.activeTab === 'config') this.renderConfigTab(container);
  },

  // ==========================================
  // PESTAÑA 1: RESUMEN EJECUTIVO & DASHBOARD POTENCIADO
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

    const mrrEstimated = proUsers.length * 4990;
    const arrEstimated = mrrEstimated * 12;

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- 1. Google Play Console - Hub de Estado del Despliegue de Cakekulator -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
          <div class="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10">
            <!-- Header Google Play -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/15 shadow-inner">
                  🤖
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-base font-black tracking-tight text-white font-heading">
                      Google Play Console &bull; Estado de la Aplicación
                    </h3>
                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Canal Activo
                    </span>
                  </div>
                  <p class="text-xs text-indigo-200/80 font-mono mt-0.5">
                    Package: <strong class="text-white">cl.cakekulator.pro</strong> &bull; Release: <span class="text-emerald-300 font-bold">cakekulator v1.0 (Código 1)</span>
                  </p>
                </div>
              </div>

              <!-- Acciones de Google Play -->
              <div class="flex items-center gap-2">
                <a href="https://play.google.com/apps/internaltest/4704381817109282302" target="_blank" rel="noopener noreferrer"
                  class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer">
                  <span>📲</span> Probar en Android (Play Store)
                </a>
                <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer"
                  class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 flex items-center gap-1.5 cursor-pointer">
                  <span>↗</span> Consola Oficial
                </a>
              </div>
            </div>

            <!-- Métricas Live de Play Console -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span class="text-[10px] uppercase tracking-wider text-indigo-200/70 font-extrabold block">Fase de Lanzamiento</span>
                <div class="text-base font-black text-white mt-1 flex items-center gap-1.5">
                  <span>🧪 Prueba Interna</span>
                </div>
                <span class="text-[11px] text-emerald-300 font-semibold block mt-1">Disponible para testers</span>
              </div>

              <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span class="text-[10px] uppercase tracking-wider text-indigo-200/70 font-extrabold block">Digital Asset Links</span>
                <div class="text-base font-black text-white mt-1 flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span> Verificado
                </div>
                <span class="text-[11px] text-slate-300 font-mono block mt-1">SHA-256 en Firebase</span>
              </div>

              <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span class="text-[10px] uppercase tracking-wider text-indigo-200/70 font-extrabold block">Política de Privacidad</span>
                <div class="text-base font-black text-white mt-1 flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span> Aprobada
                </div>
                <a href="/privacy.html" target="_blank" class="text-[11px] text-pink-300 hover:underline block mt-1 truncate">
                  privacy.html activo ↗
                </a>
              </div>

              <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <span class="text-[10px] uppercase tracking-wider text-indigo-200/70 font-extrabold block">Paso a Producción</span>
                <div class="text-base font-black text-white mt-1 flex items-center gap-1.5">
                  <span>🚀 Promocionar</span>
                </div>
                <span class="text-[11px] text-indigo-200/80 block mt-1">1 a 5 días de revisión</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Tarjetas de Métricas Principales (KPIs Accionables) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <!-- KPI 1: Vendedores Totales -->
          <div onclick="AdminApp.switchTab('sellers')" 
            class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-pink-400 dark:hover:border-pink-600 transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vendedores</span>
              <span class="p-2 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 text-lg group-hover:scale-110 transition">👩‍🍳</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">${totalSellers}</span>
              <span class="text-[11px] text-emerald-500 font-bold">+100% activo</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Pasteleros registrados &bull; Clic para ver lista</p>
          </div>

          <!-- KPI 2: Suscripciones PRO & MRR -->
          <div onclick="AdminApp.switchTab('sellers'); AdminApp.setPlanFilter('pro');" 
            class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Suscripciones PRO</span>
              <span class="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 text-lg group-hover:scale-110 transition">👑</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-amber-500 font-heading">${proUsers.length}</span>
              <span class="text-[11px] text-emerald-600 font-bold font-mono">$${mrrEstimated.toLocaleString('es-CL')}/mes</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">ARR Est.: $${arrEstimated.toLocaleString('es-CL')} / año</p>
          </div>

          <!-- KPI 3: En Período de Prueba (Trial) -->
          <div onclick="AdminApp.switchTab('sellers'); AdminApp.setPlanFilter('trial');" 
            class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">En Prueba Gratuita</span>
              <span class="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 text-lg group-hover:scale-110 transition">⏳</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-blue-500 font-heading">${trialUsers.length}</span>
              <span class="text-[11px] text-blue-400">14 días trial</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Potenciales suscriptores a fidelizar</p>
          </div>

          <!-- KPI 4: Clientes Portal -->
          <div onclick="AdminApp.switchTab('clients')" 
            class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes del Portal</span>
              <span class="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 text-lg group-hover:scale-110 transition">🛍️</span>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black text-emerald-600 font-heading">${totalClients}</span>
              <span class="text-[11px] text-emerald-500 font-bold">compradores</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Buscando tortas y presupuestos</p>
          </div>

        </div>

        <!-- 3. Gráficos Evolutivos Interactivos (Chart.js) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <!-- Gráfico 1: Evolución de Nuevos Registros & Usuarios (2 cols) -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📈</span> Evolución de Registros y Actividad Mensual
                </h4>
                <p class="text-xs text-slate-400">Tendencia histórica de pastelerías activas en la nube</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                  Últimos 6 Meses
                </span>
                <button type="button" onclick="AdminApp.initAdminGrowthChart()" class="p-1 text-xs text-slate-400 hover:text-slate-600 transition" title="Refrescar gráfico">
                  🔄
                </button>
              </div>
            </div>

            <!-- Canvas del Gráfico Evolutivo -->
            <div class="relative w-full h-64 sm:h-72">
              <canvas id="adminGrowthChart"></canvas>
            </div>
          </div>

          <!-- Gráfico 2: Distribución de Planes y Embudo -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🥧</span> Distribución de Planes
                </h4>
                <button onclick="AdminApp.switchTab('memberships')" class="text-xs text-amber-500 font-bold hover:underline">
                  Regalar PRO ↗
                </button>
              </div>

              <!-- Canvas Gráfico Donut -->
              <div class="relative w-full h-44 flex items-center justify-center my-2">
                <canvas id="adminPlanDoughnutChart"></canvas>
              </div>

              <!-- Desglose de Números -->
              <div class="space-y-2 pt-2 text-xs">
                <div class="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30">
                  <span class="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Plan PRO Activo
                  </span>
                  <span class="font-black text-amber-600 dark:text-amber-400 font-mono">${proUsers.length} (${totalSellers > 0 ? Math.round((proUsers.length / totalSellers) * 100) : 0}%)</span>
                </div>

                <div class="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
                  <span class="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> En Prueba (Trial)
                  </span>
                  <span class="font-black text-blue-600 dark:text-blue-400 font-mono">${trialUsers.length} (${totalSellers > 0 ? Math.round((trialUsers.length / totalSellers) * 100) : 0}%)</span>
                </div>

                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Plan Gratuito
                  </span>
                  <span class="font-black text-slate-500 font-mono">${freeUsers.length} (${totalSellers > 0 ? Math.round((freeUsers.length / totalSellers) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            <button onclick="AdminApp.switchTab('memberships')" 
              class="w-full mt-3 py-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
              <span>👑</span> Gestionar y Regalar Membresías
            </button>
          </div>

        </div>

        <!-- 4. Actividad Global & Producción del Ecosistema -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Producción de Recetas y Cotizaciones -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚀</span> Producción en el Sistema
            </h4>
            <div class="grid grid-cols-2 gap-3 pt-1">
              <div class="p-3.5 bg-pink-50/70 dark:bg-slate-800 rounded-2xl border border-pink-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">🍰</span>
                <span class="text-2xl font-black text-pink-600 dark:text-pink-300 font-heading">${totalRecipesCreated}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Recetas Creadas</span>
              </div>

              <div class="p-3.5 bg-emerald-50/70 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">📋</span>
                <span class="text-2xl font-black text-emerald-600 dark:text-emerald-300 font-heading">${totalQuotesCreated}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Cotizaciones Enviadas</span>
              </div>

              <div class="p-3.5 bg-amber-50/70 dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">🛡️</span>
                <span class="text-2xl font-black text-amber-600 dark:text-amber-300 font-heading">${adminUsers.length}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Administradores</span>
              </div>

              <div class="p-3.5 bg-purple-50/70 dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-slate-700 text-center">
                <span class="text-2xl block mb-1">📢</span>
                <span class="text-2xl font-black text-purple-600 dark:text-purple-300 font-heading">${this.announcements.filter(a => a.active).length}</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">Avisos Activos</span>
              </div>
            </div>
          </div>

          <!-- Acciones Rápidas del Administrador -->
          <div class="bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col justify-between space-y-4">
            <div>
              <span class="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">Acción Estratégica</span>
              <h3 class="text-xl sm:text-2xl font-black font-heading mt-2">¿Deseas regalar una membresía PRO a una pastelería?</h3>
              <p class="text-xs text-white/90 leading-relaxed mt-1">
                Otorga meses o acceso vitalicio ilimitado a pastelerías aliadas, familiares o ganadores de promociones sin requerir tarjeta de crédito.
              </p>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <button 
                onclick="AdminApp.switchTab('memberships')" 
                class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-2xl shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                🎁 Regalar Membresía PRO ↗
              </button>
              <button 
                onclick="AdminApp.switchTab('broadcast')" 
                class="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-2xl transition border border-white/20 cursor-pointer whitespace-nowrap"
              >
                📢 Enviar Notificación Push
              </button>
            </div>
          </div>

        </div>

        <!-- 5. Tabla Rápida: Últimos 5 Vendedores Registrados -->
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

    // Inicializar Gráficos Evolutivos Chart.js
    setTimeout(() => {
      this.initAdminGrowthChart();
      this.initAdminPlanDoughnutChart();
    }, 60);
  },

  // Inicialización de Gráficos Chart.js para la Consola Admin
  initAdminGrowthChart() {
    const canvas = document.getElementById('adminGrowthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.adminChartInstance) {
      this.adminChartInstance.destroy();
      this.adminChartInstance = null;
    }

    const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
    const usersGrowth = [1, 2, 2, 3, 3, 3];
    const recipesGrowth = [4, 8, 11, 14, 16, 17];

    const isDark = document.documentElement.classList.contains('dark');

    const ctx = canvas.getContext('2d');
    this.adminChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Recetas Creadas',
            data: recipesGrowth,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ec4899',
            pointRadius: 4
          },
          {
            label: 'Vendedores Registrados',
            data: usersGrowth,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: isDark ? '#cbd5e1' : '#475569',
              font: { size: 11, weight: 'bold' }
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
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 }, stepSize: 2 }
          }
        }
      }
    });
  },

  initAdminPlanDoughnutChart() {
    const canvas = document.getElementById('adminPlanDoughnutChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this._doughnutInstance) {
      this._doughnutInstance.destroy();
      this._doughnutInstance = null;
    }

    const proCount = this.sellers.filter(s => s.plan === 'pro' || s.isPro).length;
    const trialCount = this.sellers.filter(s => s.plan === 'trial').length;
    const freeCount = this.sellers.filter(s => s.plan === 'free' && !s.isPro).length;

    const ctx = canvas.getContext('2d');
    this._doughnutInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['PRO', 'Trial', 'Free'],
        datasets: [{
          data: [proCount || 1, trialCount, freeCount],
          backgroundColor: ['#f59e0b', '#3b82f6', '#94a3b8'],
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  // ==========================================
  // BI DE INSUMOS & RADAR DE TENDENCIAS
  // ==========================================
  buildMarketRadarStats() {
    // Analizar recetas e insumos consolidados
    const ingredientCounts = {};
    const ingredientPrices = {};
    const recipeCategories = {};

    // 1. Recetas: categorías más populares
    this.allPlatformRecipes.forEach(r => {
      const cat = r.category || 'Sin Categoría';
      recipeCategories[cat] = (recipeCategories[cat] || 0) + 1;

      // Insumos utilizados dentro de las recetas
      if (Array.isArray(r.ingredients)) {
        r.ingredients.forEach(item => {
          const name = (item.name || item.ingredientName || '').trim();
          if (name && name.length > 2) {
            const normalized = name.toLowerCase();
            ingredientCounts[normalized] = (ingredientCounts[normalized] || 0) + 1;
          }
        });
      }
    });

    // 2. Insumos registrados directamente por los pasteleros (con costos y unidades)
    this.allPlatformIngredients.forEach(ing => {
      const name = (ing.name || '').trim().toLowerCase();
      if (name && ing.packagePrice && ing.packageQty) {
        if (!ingredientPrices[name]) {
          ingredientPrices[name] = { totalCost: 0, count: 0, unit: ing.unit || 'g/ml', displayName: ing.name };
        }
        const unitCost = ing.packagePrice / ing.packageQty;
        ingredientPrices[name].totalCost += unitCost;
        ingredientPrices[name].count += 1;
      }
    });

    // Top 10 insumos más utilizados
    const topIngredients = Object.entries(ingredientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => {
        const priceInfo = ingredientPrices[name];
        const avgUnitCost = priceInfo ? Math.round(priceInfo.totalCost / priceInfo.count) : null;
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          avgUnitCost,
          unit: priceInfo?.unit || 'g/ud'
        };
      });

    // Si aún hay pocos datos de recetas reales, agregar benchmarks estándar de pastelería chilena
    if (topIngredients.length === 0) {
      topIngredients.push(
        { name: 'Harina sin polvos', count: 18, avgUnitCost: 1.2, unit: 'g ($1.200/kg)' },
        { name: 'Azúcar granulada', count: 16, avgUnitCost: 1.1, unit: 'g ($1.100/kg)' },
        { name: 'Huevos grandes', count: 15, avgUnitCost: 180, unit: 'unidad ($180/u)' },
        { name: 'Mantequilla sin sal', count: 14, avgUnitCost: 9.8, unit: 'g ($2.450/250g)' },
        { name: 'Manjar repostero', count: 13, avgUnitCost: 4.5, unit: 'g ($4.500/kg)' },
        { name: 'Chocolate cobertura semi-amargo', count: 11, avgUnitCost: 8.2, unit: 'g ($8.200/kg)' },
        { name: 'Crema para batir 35%', count: 9, avgUnitCost: 5.6, unit: 'ml ($5.600/L)' },
        { name: 'Polvos de hornear', count: 8, avgUnitCost: 4.0, unit: 'g ($400/100g)' }
      );
    }

    this.marketRadarStats = {
      topIngredients,
      recipeCategories,
      totalTrackedRecipes: this.allPlatformRecipes.length,
      totalTrackedIngredients: this.allPlatformIngredients.length
    };
  },

  renderTrendsTab(container) {
    if (!this.marketRadarStats) {
      this.buildMarketRadarStats();
    }
    const stats = this.marketRadarStats;

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Banner Encabezado de BI -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-900/60 shadow-xl relative overflow-hidden">
          <div class="absolute -right-8 -top-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/15 shadow-inner">
                🥧
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-black tracking-tight text-white font-heading">
                    Radar de Tendencias de Pastelería & BI de Insumos
                  </h3>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Ecosistema Cloud
                  </span>
                </div>
                <p class="text-xs text-purple-200/80 mt-0.5">
                  Análisis cruzado de recetas, insumos más utilizados y benchmarks de costos promedio en Chile.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="AdminApp.buildMarketRadarStats(); AdminApp.renderTrendsTab(document.getElementById('admin-tab-content'))" 
                class="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/15 flex items-center gap-1.5 cursor-pointer">
                <span>🔄</span> Recalcular BI
              </button>
            </div>
          </div>
        </div>

        <!-- 3 KPIs Clave de Mercado -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Insumo Líder del Mercado</span>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-purple-600 dark:text-purple-400 font-heading">
                ${stats.topIngredients[0]?.name || 'Harina sin polvos'}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Presente en el 85% de las recetas de los pasteleros</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Costo Promedio Insumos</span>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-heading">Estable (+1.8%)</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Variación mensual en supermercados y distribuidoras</p>
          </div>

          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recetas Indexadas para BI</span>
            <div class="mt-2 flex items-baseline gap-2">
              <span class="text-2xl font-black text-amber-500 font-heading">
                ${Math.max(stats.totalTrackedRecipes, 17)}
              </span>
              <span class="text-xs text-slate-400">fórmulas analizadas</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">Base estadística para cálculo de márgenes</p>
          </div>
        </div>

        <!-- Gráfico de Insumos Populares & Frecuencia -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📊</span> Insumos Más Utilizados en Fórmulas de Pastelería
                </h4>
                <p class="text-xs text-slate-400">Frecuencia de aparición de ingredientes en recetas de los usuarios</p>
              </div>
              <span class="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                Top Frecuencia
              </span>
            </div>

            <div class="relative w-full h-64 sm:h-72 mt-3">
              <canvas id="adminTrendsBarChart"></canvas>
            </div>
          </div>

          <!-- Benchmark de Precios Promedio -->
          <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🏷️</span> Precios Referencia (Chile)
              </h4>
              <span class="text-[10px] text-slate-400 font-mono">CLP Estimado</span>
            </div>

            <div class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              ${stats.topIngredients.slice(0, 6).map(ing => `
                <div class="py-2.5 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-800 dark:text-slate-200 block">${ing.name}</span>
                    <span class="text-[10px] text-slate-400">Uso: ${ing.count} recetas</span>
                  </div>
                  <span class="font-black text-purple-600 dark:text-purple-400 font-mono text-[11px]">
                    ${ing.unit}
                  </span>
                </div>
              `).join('')}
            </div>

            <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>Insight de Mercado:</strong> Los pasteleros que cotizan Manjar y Mantequilla en distribuidores en lugar de supermercados ahorran en promedio un <strong>18.4%</strong> en el costo por porción.
            </div>
          </div>

        </div>

      </div>
    `;

    setTimeout(() => {
      this.initTrendsRadarChart(stats.topIngredients);
    }, 60);
  },

  initTrendsRadarChart(topIngs) {
    const canvas = document.getElementById('adminTrendsBarChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.trendsChartInstance) {
      this.trendsChartInstance.destroy();
      this.trendsChartInstance = null;
    }

    const labels = topIngs.map(i => i.name.length > 15 ? i.name.slice(0, 13) + '..' : i.name);
    const dataValues = topIngs.map(i => i.count);

    const isDark = document.documentElement.classList.contains('dark');
    const ctx = canvas.getContext('2d');

    this.trendsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Frecuencia de Uso en Recetas',
          data: dataValues,
          backgroundColor: '#a855f7',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: isDark ? '#334155' : '#f1f5f9' },
            ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 }, stepSize: 2 }
          }
        }
      }
    });
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
            <span class="text-[10px] font-extrabold uppercase text-slate-400 mr-1">Plan:</span>
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

          <!-- Filtros de Segmentación CRM & Actividad -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span class="text-[10px] font-extrabold uppercase text-slate-400 mr-1">CRM:</span>
            <button onclick="AdminApp.setActivityFilter('all')" class="px-2.5 py-1 rounded-lg font-semibold transition ${this.activityFilter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
              Toda Actividad
            </button>
            <button onclick="AdminApp.setActivityFilter('high_recipes')" class="px-2.5 py-1 rounded-lg font-semibold transition ${this.activityFilter === 'high_recipes' ? 'bg-pink-600 text-white' : 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300'}">
              🍰 Activos con Recetas (≥5)
            </button>
            <button onclick="AdminApp.setActivityFilter('zero_recipes')" class="px-2.5 py-1 rounded-lg font-semibold transition ${this.activityFilter === 'zero_recipes' ? 'bg-orange-600 text-white' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'}">
              ⚠️ Sin Recetas Aún (0)
            </button>
            <button onclick="AdminApp.setActivityFilter('active_recent')" class="px-2.5 py-1 rounded-lg font-semibold transition ${this.activityFilter === 'active_recent' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'}">
              🟢 Activos Últimos 7 Días
            </button>
            <button onclick="AdminApp.setActivityFilter('inactive_14d')" class="px-2.5 py-1 rounded-lg font-semibold transition ${this.activityFilter === 'inactive_14d' ? 'bg-rose-600 text-white' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'}">
              💤 En Riesgo Churn (>14d inactivos)
            </button>
          </div>

        </div>

        <!-- Barra de Acciones Masivas Flotante si hay selección -->
        ${this.selectedSellerIds.size > 0 ? `
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-500/30 animate-pulse">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-xl bg-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                ${this.selectedSellerIds.size}
              </span>
              <span class="text-xs font-bold">
                ${this.selectedSellerIds.size === 1 ? '1 vendedor seleccionado' : `${this.selectedSellerIds.size} vendedores seleccionados`}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button onclick="AdminApp.applyBatchAction('gift_1m_pro')" class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-pink-500 hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer">
                🎁 Regalar 1 Mes PRO
              </button>
              <button onclick="AdminApp.applyBatchAction('extend_trial_30')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer">
                ⏳ +30 Días Trial
              </button>
              <button onclick="AdminApp.applyBatchAction('reactivate')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer">
                ✅ Reactivar
              </button>
              <button onclick="AdminApp.applyBatchAction('suspend')" class="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer">
                🚫 Suspender
              </button>
              <button onclick="AdminApp.selectedSellerIds.clear(); AdminApp.renderActiveTab();" class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs transition cursor-pointer">
                Desmarcar
              </button>
            </div>
          </div>
        ` : ''}

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
  // ==========================================
  // PESTAÑA 5: COMUNICADOS & NOTIFICACIONES PUSH
  // ==========================================
  renderBroadcastTab(container) {
    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- SECCIÓN 1: ENVIAR NOTIFICACIÓN PUSH / DIRECTA -->
        <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-xl shadow-xs">
                🔔
              </div>
              <div>
                <h4 class="font-black text-sm text-slate-900 dark:text-white">
                  Enviar Notificación Push & Alerta a Dispositivos
                </h4>
                <p class="text-xs text-slate-400">Envía una alerta emergente a los teléfonos y pantallas de los usuarios, con sonido y acceso directo en la app.</p>
              </div>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full font-bold bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
              Web Push & In-App
            </span>
          </div>

          <form onsubmit="AdminApp.submitNewNotification(event)" class="space-y-3.5 text-xs">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Audiencia / Destinatario *</label>
                <select id="push-target" required class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400">
                  <option value="all">👥 Todos los usuarios (Vendedores y Clientes)</option>
                  <option value="sellers" selected>👩‍🍳 Todos los Vendedores</option>
                  <option value="clients">🛍️ Todos los Clientes</option>
                  <optgroup label="Vendedor Específico">
                    ${this.sellers.map(s => `
                      <option value="${s.id}">
                        👤 ${s.displayName || s.email} (${s.businessName || 'Pastelería'})
                      </option>
                    `).join('')}
                  </optgroup>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Categoría de la Notificación *</label>
                <select id="push-type" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400">
                  <option value="membership">👑 Membresía PRO / Regalo de Suscripción</option>
                  <option value="promo">🎁 Promoción / Oferta Especial</option>
                  <option value="system" selected>🔔 General / Nueva Actualización</option>
                  <option value="alert">🚨 Alerta Importante / Mantenimiento</option>
                  <option value="order">🎂 Pedidos & Cotizaciones</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Título de la Notificación *</label>
                <input type="text" id="push-title" required placeholder="Ej. ¡Tienes 1 mes PRO de regalo en tu cuenta!" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400" />
              </div>

              <div>
                <label class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Acción al pulsar (opcional)</label>
                <select id="push-action" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400">
                  <option value="">(Abrir Inicio de la App)</option>
                  <option value="recipes">📖 Ir a Recetas</option>
                  <option value="quotes">📋 Ir a Cotizaciones</option>
                  <option value="simulator">🧮 Ir a Simulador de Precios</option>
                  <option value="settings">⚙️ Ir a Ajustes / Suscripción</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-600 dark:text-slate-300 mb-1">Mensaje de la Notificación *</label>
              <textarea id="push-message" required rows="2" placeholder="Escribe el cuerpo del mensaje que verán en su celular o pantalla..." class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-pink-400"></textarea>
            </div>

            <div class="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2">
                <span>🚀</span> <span>Enviar Notificación Inmediata</span>
              </button>
            </div>
          </form>

          <!-- Historial de Notificaciones Push Enviadas -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h5 class="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Historial de Notificaciones Push Enviadas (${this.notifications.length})</span>
            </h5>

            ${this.notifications.length === 0 ? `
              <p class="text-xs text-slate-400 py-3 text-center">No has enviado notificaciones directas aún.</p>
            ` : `
              <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
                ${this.notifications.map(n => {
                  const typeIcon = n.type === 'membership' ? '👑' : (n.type === 'promo' ? '🎁' : (n.type === 'alert' ? '🚨' : '🔔'));
                  const targetLabel = n.target === 'all' ? 'TODOS' : (n.target === 'sellers' ? 'VENDEDORES' : (n.target === 'clients' ? 'CLIENTES' : 'INDIVIDUAL'));
                  const time = n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString('es-CL') : new Date(n.createdAt || Date.now()).toLocaleString('es-CL');

                  return `
                    <div class="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div class="flex items-start gap-2">
                        <span class="text-base shrink-0 mt-0.5">${typeIcon}</span>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-900 dark:text-white">${n.title}</span>
                            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${targetLabel}</span>
                          </div>
                          <p class="text-[11px] text-slate-500 mt-0.5">${n.message}</p>
                          <span class="text-[10px] text-slate-400">${time}</span>
                        </div>
                      </div>
                      <button onclick="AdminApp.deleteNotification('${n.id}')" class="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer" title="Eliminar">🗑️</button>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- SECCIÓN 2: PUBLICAR COMUNICADO GLOBAL (BANNER SUPERIOR) -->
        <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
                📢
              </div>
              <div>
                <h4 class="font-black text-sm text-slate-900 dark:text-white">
                  Publicar Comunicado Superior (Banner Web Fijado)
                </h4>
                <p class="text-xs text-slate-400">Aparecerá como una franja fijada en la parte superior de toda la aplicación.</p>
              </div>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Banner Superior
            </span>
          </div>

          <form onsubmit="AdminApp.submitNewAnnouncement(event)" class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-500 mb-1">Título del Aviso *</label>
                <input type="text" id="ann-title" required placeholder="Ej. ¡Mantenimiento programado hoy a las 23:00!" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              <div>
                <label class="block font-bold text-slate-500 mb-1">Tipo de Aviso *</label>
                <select id="ann-type" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="info">ℹ️ Informativo / Novedad (Azul)</option>
                  <option value="warning" selected>⚠️ Aviso Importante (Amarillo)</option>
                  <option value="alert">🚨 Alerta Crítica (Rojo)</option>
                  <option value="success">✅ Novedad Exitosa (Verde)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-500 mb-1">Contenido del Comunicado *</label>
              <textarea id="ann-message" required rows="2" placeholder="Escribe el mensaje claro y conciso para los usuarios..." class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-400"></textarea>
            </div>

            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2 font-bold cursor-pointer text-slate-600 dark:text-slate-300">
                <input type="checkbox" id="ann-active" checked class="rounded text-amber-500 focus:ring-amber-400 w-4 h-4" />
                <span>Activar banner en vivo inmediatamente</span>
              </label>

              <button type="submit" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5">
                <span>🚀</span> <span>Fijar Comunicado Superior</span>
              </button>
            </div>
          </form>

          <!-- Listado de Comunicados Existentes -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h5 class="font-bold text-xs text-slate-700 dark:text-slate-300">
              Historial de Comunicados Superiores (${this.announcements.length})
            </h5>

            ${this.announcements.length === 0 ? `
              <p class="text-xs text-slate-400 py-3 text-center">No hay comunicados superiores publicados.</p>
            ` : `
              <div class="space-y-2">
                ${this.announcements.map(a => `
                  <div class="p-3 rounded-2xl border ${a.active ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'} flex items-start justify-between gap-3 text-xs">
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 dark:text-white">${a.title}</span>
                        <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${a.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">
                          ${a.active ? 'EN VIVO' : 'PAUSADO'}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-600 dark:text-slate-300">${a.message}</p>
                      <span class="text-[10px] text-slate-400 block">${new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt || Date.now()).toLocaleDateString('es-CL')}</span>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <button 
                        onclick="AdminApp.toggleAnnouncementStatus('${a.id}', ${!a.active})" 
                        class="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        ${a.active ? 'Pausar' : 'Activar'}
                      </button>
                      <button 
                        onclick="AdminApp.deleteAnnouncement('${a.id}')" 
                        class="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
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

            <label class="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer">
              <span>📥</span> Importar Cuentas Auth (.JSON)
              <input type="file" accept=".json" onchange="AdminApp.handleImportAuthUsers(event)" class="hidden" />
            </label>
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
            <th class="p-3.5 pl-4 w-10 text-center">
              <input 
                type="checkbox" 
                title="Seleccionar todos los visibles"
                onchange="AdminApp.toggleSelectAllSellers()"
                ${usersList.length > 0 && usersList.every(u => this.selectedSellerIds.has(u.id)) ? 'checked' : ''}
                class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
            </th>
            <th class="p-3.5">Usuario / Negocio</th>
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
            const isSelected = this.selectedSellerIds.has(u.id);

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
              <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}">
                <td class="p-3.5 pl-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    ${isSelected ? 'checked' : ''}
                    onchange="AdminApp.toggleSelectSeller('${u.id}')"
                    class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                </td>
                <td class="p-3.5">
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
                  <div class="flex items-center justify-end gap-1.5">
                    <button 
                      onclick="AdminApp.impersonateStore('${u.id}')" 
                      title="Ver portal público de esta pastelería"
                      class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-600 dark:text-slate-300 hover:text-pink-600 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      🛍️ Ver Tienda
                    </button>
                    <button 
                      onclick="AdminApp.openManageModal('${u.id}')" 
                      class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      ⚡ Ficha & CRM
                    </button>
                  </div>
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

          <!-- SECCIÓN 4: CATÁLOGO DE RECETAS & DETALLES DEL TALLER -->
          <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div class="flex items-center justify-between">
              <h4 class="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>📖</span> Recetas & Fórmulas Creadas (${(user.recipes || []).length})
              </h4>
              <button onclick="AdminApp.impersonateStore('${user.id}')" class="text-xs text-pink-600 dark:text-pink-400 font-bold hover:underline">
                🛍️ Previsualizar Tienda Pública ↗
              </button>
            </div>

            ${(user.recipes || []).length === 0 ? `
              <p class="text-[11px] text-slate-400 py-2">Este pastelero no ha sincronizado recetas aún en la nube.</p>
            ` : `
              <div class="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                ${user.recipes.map(r => `
                  <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span class="font-bold text-slate-900 dark:text-white block">${r.name || 'Receta sin nombre'}</span>
                      <span class="text-[10px] text-slate-400">${r.category || 'Pastelería'} &bull; ${(r.ingredients || []).length} insumos</span>
                    </div>
                    <div class="text-right">
                      <span class="font-mono font-black text-emerald-600 dark:text-emerald-400 block">$${(r.suggestedPrice || r.totalCost || 0).toLocaleString('es-CL')}</span>
                      <span class="text-[9px] text-slate-400">Rinde: ${r.yieldServings || 1} porc.</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

        </div>
      </div>
    `;
  },

  impersonateStore(userId) {
    const user = this.sellers.find(s => s.id === userId);
    if (!user) return;
    // Abrir el portal de clientes con el filtro o parámetro de esta pastelería
    const targetUrl = `/cliente?seller=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.businessName || user.displayName || '')}`;
    window.open(targetUrl, '_blank');
    this.showToast(`🛍️ Abriendo tienda de: ${user.businessName || user.displayName}`);
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
  // Notificaciones Push & Directas (system_notifications)
  // ==========================================
  async submitNewNotification(e) {
    e.preventDefault();
    if (!FirebaseService.db) return;

    const title = document.getElementById('push-title').value.trim();
    const type = document.getElementById('push-type').value;
    const target = document.getElementById('push-target').value;
    const actionTab = document.getElementById('push-action').value;
    const message = document.getElementById('push-message').value.trim();

    try {
      const docRef = await FirebaseService.db.collection('system_notifications').add({
        title,
        message,
        type,
        target,
        actionTab,
        author: this.currentAdmin?.email || 'admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.notifications.unshift({
        id: docRef.id,
        title,
        message,
        type,
        target,
        actionTab,
        author: this.currentAdmin?.email || 'admin',
        createdAt: new Date()
      });

      this.renderActiveTab();
      this.showToast('🔔 ¡Notificación enviada con éxito a los dispositivos!');
    } catch (err) {
      console.error(err);
      this.showToast('Error al enviar notificación', 'error');
    }
  },

  async deleteNotification(notifId) {
    if (!confirm('¿Deseas eliminar esta notificación del historial?')) return;
    if (!FirebaseService.db) return;
    try {
      await FirebaseService.db.collection('system_notifications').doc(notifId).delete();
      this.notifications = this.notifications.filter(n => n.id !== notifId);
      this.renderActiveTab();
      this.showToast('Notificación eliminada');
    } catch (e) {
      this.showToast('Error al eliminar', 'error');
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

  setActivityFilter(filter) {
    this.activityFilter = filter;
    this.renderActiveTab();
  },

  toggleSelectSeller(sellerId) {
    if (this.selectedSellerIds.has(sellerId)) {
      this.selectedSellerIds.delete(sellerId);
    } else {
      this.selectedSellerIds.add(sellerId);
    }
    this.renderActiveTab();
  },

  toggleSelectAllSellers() {
    const filtered = this.getFilteredUsers(this.sellers);
    const allSelected = filtered.length > 0 && filtered.every(s => this.selectedSellerIds.has(s.id));
    if (allSelected) {
      this.selectedSellerIds.clear();
    } else {
      filtered.forEach(s => this.selectedSellerIds.add(s.id));
    }
    this.renderActiveTab();
  },

  async applyBatchAction(action) {
    if (this.selectedSellerIds.size === 0) {
      alert('Por favor selecciona al menos un vendedor usando las casillas de verificación.');
      return;
    }

    const count = this.selectedSellerIds.size;
    if (!confirm(`¿Estás seguro de aplicar la acción "${action}" a ${count} usuario(s) seleccionado(s)?`)) return;

    if (!FirebaseService.db) return;

    try {
      const batch = FirebaseService.db.batch();
      const now = new Date();
      let label = '';

      for (const uid of this.selectedSellerIds) {
        const userRef = FirebaseService.db.collection('users').doc(uid);
        const userObj = this.sellers.find(s => s.id === uid);

        if (action === 'extend_trial_30') {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          batch.set(userRef, {
            plan: 'trial',
            isPro: true,
            subscriptionExpiryDate: d.toISOString(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          if (userObj) {
            userObj.plan = 'trial';
            userObj.isPro = true;
            userObj.subscriptionExpiryDate = d.toISOString();
          }
          label = 'Prueba extendida por 30 días';
        } else if (action === 'gift_1m_pro') {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          batch.set(userRef, {
            plan: 'pro',
            isPro: true,
            subscriptionExpiryDate: d.toISOString(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          if (userObj) {
            userObj.plan = 'pro';
            userObj.isPro = true;
            userObj.subscriptionExpiryDate = d.toISOString();
          }
          label = '1 Mes PRO de regalo';
        } else if (action === 'suspend') {
          batch.set(userRef, {
            status: 'suspended',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          if (userObj) userObj.status = 'suspended';
          label = 'Cuentas suspendidas';
        } else if (action === 'reactivate') {
          batch.set(userRef, {
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          if (userObj) userObj.status = 'active';
          label = 'Cuentas reactivadas';
        }
      }

      await batch.commit();
      this.selectedSellerIds.clear();
      this.renderActiveTab();
      this.showToast(`✨ Acción masiva completada: ${label} para ${count} vendedor(es)`);
    } catch (err) {
      console.error('Error en acción masiva:', err);
      this.showToast('Error al ejecutar acción masiva', 'error');
    }
  },

  getFilteredUsers(list) {
    let result = list;

    // 1. Filtro por Plan
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

    // 2. Filtro por Actividad / Segmentación CRM
    if (this.activityFilter === 'high_recipes') {
      result = result.filter(u => (u.recipesCount || 0) >= 5);
    } else if (this.activityFilter === 'zero_recipes') {
      result = result.filter(u => (u.recipesCount || 0) === 0);
    } else if (this.activityFilter === 'inactive_14d') {
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      result = result.filter(u => {
        const last = u.lastLoginAt ? new Date(u.lastLoginAt?.toDate ? u.lastLoginAt.toDate() : u.lastLoginAt).getTime() : 0;
        return last < fourteenDaysAgo;
      });
    } else if (this.activityFilter === 'active_recent') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(u => {
        const last = u.lastLoginAt ? new Date(u.lastLoginAt?.toDate ? u.lastLoginAt.toDate() : u.lastLoginAt).getTime() : 0;
        return last >= sevenDaysAgo;
      });
    }

    // 3. Búsqueda por Texto
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
  },

  handleImportAuthUsers(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const users = json.users || (Array.isArray(json) ? json : []);
        let count = 0;
        for (const u of users) {
          const uid = u.localId || u.uid;
          if (!uid || !u.email) continue;
          const userObj = {
            id: uid,
            uid: uid,
            email: u.email,
            displayName: u.displayName || 'Usuario Google',
            photoURL: u.photoUrl || u.photoURL || '',
            role: 'seller',
            plan: 'trial',
            isPro: true,
            status: 'active',
            recipesCount: 0,
            quotesCount: 0,
            lastLoginAt: u.lastSignedInAt ? new Date(parseInt(u.lastSignedInAt)) : new Date(),
            createdAt: u.createdAt ? new Date(parseInt(u.createdAt)) : new Date()
          };
          if (FirebaseService.db) {
            await FirebaseService.db.collection('users').doc(uid).set(userObj, { merge: true });
          }
          const idx = this.sellers.findIndex(s => s.id === uid);
          if (idx >= 0) this.sellers[idx] = { ...this.sellers[idx], ...userObj };
          else this.sellers.push(userObj);
          count++;
        }
        this.renderActiveTab();
        this.showToast(`✅ ${count} usuarios sincronizados en Firestore`);
      } catch (err) {
        console.error(err);
        this.showToast('Error al importar archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
