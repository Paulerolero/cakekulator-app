// ==========================================
// Cakekulator - Módulo de Autenticación y Sincronización en Tiempo Real
// ==========================================

const AuthModule = {
  currentUser: null,
  syncStatus: 'local', // 'local' | 'synced' | 'syncing' | 'error' | 'offline'
  syncStatusText: 'Local',
  hasCheckedAuth: false,
  isAuthenticating: false,

  init() {
    const isConfigured = FirebaseService.init();

    // Registrar eventos de ventana para sincronización continua automática
    this.initBackgroundSyncEvents();

    if (isConfigured && FirebaseService.auth) {
      FirebaseService.auth.onAuthStateChanged(user => {
        this.currentUser = user;
        this.hasCheckedAuth = true;
        this.isAuthenticating = false;

        if (user) {
          console.log('👤 Sesión activa en Cakekulator:', user.displayName || user.email);
          this.closeLoginModal();
          this.updateSyncStatus('syncing', 'Conectando con Firestore...');
          
          if (typeof DB !== 'undefined' && DB.initCloudSync) {
            DB.initCloudSync(user.uid).then(() => {
              this.updateSyncStatus('synced', 'Sincronizado en tiempo real');
            }).catch(err => {
              console.error('Error al sincronizar con la nube:', err);
              this.updateSyncStatus('error', 'Error al sincronizar');
            });
          }
        } else {
          this.updateSyncStatus('local', 'Modo Local');
          // Detener listeners si se desloguea
          if (typeof DB !== 'undefined' && DB.stopRealtimeListeners) {
            DB.stopRealtimeListeners();
            DB.stopPeriodicSync();
          }
          // Si no hay sesión iniciada, mostrar modal de bienvenida para pedir login
          this.showLoginRequiredModal();
        }
      });
    } else {
      this.hasCheckedAuth = true;
      this.updateSyncStatus('local', 'Modo Local');
    }
  },

  // Inicializar eventos para mantener datos actualizados automáticamente
  initBackgroundSyncEvents() {
    // Al regresar a la pestaña o enfocar el navegador
    const handleFocusOrVisible = () => {
      if (this.currentUser && typeof DB !== 'undefined') {
        console.log('👀 Aplicación en primer plano: verificando actualizaciones en Firebase...');
        if (DB.lastSyncTimestamp && (Date.now() - DB.lastSyncTimestamp > 15000)) {
          this.updateSyncStatus('syncing', 'Actualizando datos...');
          DB.pullCloudToLocal(this.currentUser.uid).then(() => {
            this.updateSyncStatus('synced', 'Sincronizado en tiempo real');
          }).catch(e => console.warn('Aviso en sync de foco:', e));
        } else {
          this.renderAuthUI();
        }
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocusOrVisible();
      }
    });

    // Eventos de conectividad de red
    window.addEventListener('online', () => {
      console.log('🌐 Conexión a internet restaurada');
      if (this.currentUser && typeof DB !== 'undefined') {
        this.updateSyncStatus('syncing', 'Reconectando con la nube...');
        DB.initCloudSync(this.currentUser.uid);
      } else {
        this.renderAuthUI();
      }
    });

    window.addEventListener('offline', () => {
      console.log('⚠️ Sin conexión a internet');
      this.updateSyncStatus('offline', 'Sin conexión (Modo Offline)');
    });
  },

  updateSyncStatus(status, text) {
    this.syncStatus = status;
    if (text) this.syncStatusText = text;
    this.renderAuthUI();
  },

  formatLastSync() {
    if (!this.currentUser) return 'Sin conexión en la nube';
    if (typeof DB === 'undefined' || !DB.lastSyncTimestamp) return 'Recién conectado';

    const diff = Math.floor((Date.now() - DB.lastSyncTimestamp) / 1000);
    if (diff < 5) return 'hace unos segundos';
    if (diff < 60) return `hace ${diff} seg`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    
    const d = new Date(DB.lastSyncTimestamp);
    return `hoy a las ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  },

  renderAuthUI() {
    const container = document.getElementById('auth-header-container');
    if (!container) return;

    if (!FirebaseService.isConfigured) {
      container.innerHTML = `
        <button 
          onclick="AuthModule.showConfigModal()" 
          title="Conectar con Firebase y Google Cloud"
          class="flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-700 border border-pink-200/80 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-semibold shadow-xs transition duration-200 hover:scale-[1.02]"
        >
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span class="hidden sm:inline">Conectar Nube</span>
          <span class="sm:hidden">Nube</span>
        </button>
      `;
      return;
    }

    if (this.currentUser) {
      const photoURL = this.currentUser.photoURL || '';
      const name = this.currentUser.displayName || this.currentUser.email || 'Usuario';
      const firstName = name.split(' ')[0];

      let syncBadge = '';
      let statusTooltip = 'Sincronizado en tiempo real';
      
      if (this.syncStatus === 'synced') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300"></span>';
        statusTooltip = 'Sincronizado con Firestore en tiempo real';
      } else if (this.syncStatus === 'syncing') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-ping"></span>';
        statusTooltip = 'Sincronizando cambios con Firestore...';
      } else if (this.syncStatus === 'error') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-300"></span>';
        statusTooltip = 'Error en sincronización';
      } else if (this.syncStatus === 'offline') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-gray-400 rounded-full border-2 border-white ring-1 ring-gray-200"></span>';
        statusTooltip = 'Modo offline - Datos guardados localmente';
      }

      container.innerHTML = `
        <div class="relative">
          <button 
            onclick="AuthModule.toggleUserDropdown()" 
            id="user-profile-btn"
            title="${statusTooltip}"
            class="flex items-center gap-2 bg-white/90 hover:bg-pink-50/70 border border-pink-100 hover:border-pink-300 px-2 sm:px-3 py-1 rounded-2xl shadow-xs transition duration-200 select-none group"
          >
            <div class="relative">
              ${photoURL ? `
                <img src="${photoURL}" alt="${name}" class="w-7 h-7 rounded-full object-cover ring-1 ring-pink-300 group-hover:ring-pink-400 transition">
              ` : `
                <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  ${firstName.charAt(0).toUpperCase()}
                </div>
              `}
              <div class="absolute -bottom-0.5 -right-0.5">
                ${syncBadge}
              </div>
            </div>
            <div class="text-left hidden sm:block">
              <span class="text-xs font-bold text-gray-800 block leading-tight max-w-[100px] truncate">${firstName}</span>
              <span class="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>⚡</span> En vivo
              </span>
            </div>
            <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <!-- Dropdown Menu de Usuario Pastelero -->
          <div id="user-dropdown-menu" class="hidden absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-pink-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <!-- Header con Datos de Usuario -->
            <div class="px-4 py-3 border-b border-pink-50 bg-gradient-to-b from-pink-50/50 to-transparent">
              <div class="flex items-center gap-3">
                ${photoURL ? `
                  <img src="${photoURL}" alt="${name}" class="w-11 h-11 rounded-full object-cover ring-2 ring-pink-300 shadow-sm">
                ` : `
                  <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    ${firstName.charAt(0).toUpperCase()}
                  </div>
                `}
                <div class="truncate flex-1">
                  <h4 class="font-bold text-xs text-gray-900 truncate">${name}</h4>
                  <p class="text-[11px] text-gray-400 truncate">${this.currentUser.email || ''}</p>
                  
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="w-2 h-2 rounded-full ${this.syncStatus === 'synced' ? 'bg-emerald-500 ring-2 ring-emerald-200' : (this.syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-red-400')}"></span>
                    <span class="text-[10px] font-bold ${this.syncStatus === 'synced' ? 'text-emerald-700' : 'text-amber-700'}">${this.syncStatusText}</span>
                  </div>
                </div>
              </div>

              <!-- Banner de Estado de Respaldo -->
              <div class="mt-2.5 bg-white/80 border border-pink-100 rounded-xl p-2 flex items-center justify-between text-[10px] text-gray-500">
                <span>🕒 Último respaldo:</span>
                <span class="font-bold text-gray-700" id="user-sync-time-label">${this.formatLastSync()}</span>
              </div>
            </div>

            <!-- Opciones y Acciones -->
            <div class="p-2 space-y-1">
              <button 
                onclick="AuthModule.forceSyncNow()" 
                id="btn-force-sync"
                class="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-2xl transition flex items-center justify-between group"
              >
                <span class="flex items-center gap-2">
                  <span class="group-hover:rotate-180 transition-transform duration-500">🔄</span>
                  <span>Sincronizar Ahora</span>
                </span>
                <span class="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">Nube</span>
              </button>

              <button 
                onclick="AuthModule.showConfigModal()" 
                class="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-2xl transition flex items-center gap-2"
              >
                <span>⚙️</span> Estado de la Conexión
              </button>

              <div class="border-t border-gray-100 my-1"></div>

              <button 
                onclick="AuthModule.logout()" 
                class="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl transition flex items-center gap-2"
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button 
          onclick="AuthModule.showLoginRequiredModal()" 
          class="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-3.5 py-1.5 rounded-2xl text-xs shadow-sm shadow-pink-200/80 hover:shadow-md hover:shadow-pink-300/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z" class="hidden"/>
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
          </svg>
          <span class="hidden sm:inline">Iniciar Sesión</span>
          <span class="sm:hidden">Entrar</span>
        </button>
      `;
    }
  },

  toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.classList.toggle('hidden');
      // Actualizar timestamp
      const timeLabel = document.getElementById('user-sync-time-label');
      if (timeLabel) timeLabel.textContent = this.formatLastSync();
    }
  },

  async loginWithGoogle() {
    if (!FirebaseService.isConfigured) {
      this.showConfigModal();
      return;
    }

    if (this.isAuthenticating) return;
    this.isAuthenticating = true;
    this.renderLoginModalLoading(true);

    try {
      const result = await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
      console.log('✅ Inicio de sesión exitoso con Google:', result.user.displayName);
      this.closeLoginModal();
    } catch (error) {
      this.isAuthenticating = false;
      this.renderLoginModalLoading(false);
      console.error('Error al iniciar sesión con Google:', error);
      
      if (error.code === 'auth/popup-blocked') {
        alert('El navegador bloqueó la ventana emergente de Google. Por favor autoriza las ventanas emergentes (popups) para este sitio web.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('Dominio no autorizado en Firebase. Agrega tu dominio (ej: cakekulator-app.vercel.app o localhost) en Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        alert('Para iniciar sesión debes abrir la aplicación a través de un servidor web (http://localhost o tu enlace en Vercel https://...).');
      } else if (error.code !== 'auth/popup-closed-by-user') {
        alert(`Error al iniciar sesión con Google: ${error.message}`);
      }
    }
  },

  async logout() {
    try {
      if (FirebaseService.auth) {
        await FirebaseService.auth.signOut();
        this.currentUser = null;
        this.syncStatus = 'local';
        const menu = document.getElementById('user-dropdown-menu');
        if (menu) menu.classList.add('hidden');
        this.renderAuthUI();

        if (typeof DB !== 'undefined' && DB.clearSessionData) {
          DB.clearSessionData();
        }
        if (typeof App !== 'undefined' && App.renderCurrentTab) {
          App.renderCurrentTab();
        }
        console.log('Sesión cerrada correctamente.');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },

  async forceSyncNow() {
    if (!this.currentUser) return;
    this.updateSyncStatus('syncing', 'Sincronizando...');
    
    const btn = document.getElementById('btn-force-sync');
    if (btn) btn.classList.add('opacity-60', 'pointer-events-none');

    try {
      await DB.pushLocalToCloud(this.currentUser.uid);
      await DB.pullCloudToLocal(this.currentUser.uid);
      this.updateSyncStatus('synced', 'Sincronizado');
      
      // Actualizar etiqueta en dropdown
      const timeLabel = document.getElementById('user-sync-time-label');
      if (timeLabel) timeLabel.textContent = this.formatLastSync();

      // Toast feedback
      this.showToast('✅ ¡Todos tus datos están sincronizados con la nube de Firebase!');
      
      if (typeof App !== 'undefined' && App.renderCurrentTab) {
        App.renderCurrentTab(true);
      }
    } catch (e) {
      console.error('Error forzando sincronización:', e);
      this.updateSyncStatus('error', 'Error al sincronizar');
      this.showToast('⚠️ No se pudo sincronizar en este momento. Revisa tu conexión.');
    } finally {
      if (btn) btn.classList.remove('opacity-60', 'pointer-events-none');
    }
  },

  showToast(message) {
    let toast = document.getElementById('cakekulator-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cakekulator-toast';
      toast.className = 'fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-gray-700/80 transition-all duration-300 max-w-sm pointer-events-none';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3500);
  },

  // Modal de Inicio de Sesión Moderno y Acorde a la Pastelería
  showLoginRequiredModal() {
    let modal = document.getElementById('login-prompt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'login-prompt-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-300';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-pink-100 text-center relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        <!-- Elemento decorativo de fondo -->
        <div class="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-pink-200/40 to-rose-200/30 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-36 h-36 bg-gradient-to-tr from-amber-200/30 to-pink-200/30 rounded-full blur-2xl pointer-events-none"></div>

        <!-- Botón de Cerrar Modal (Invitado) -->
        <button 
          onclick="AuthModule.closeLoginModal()" 
          title="Cerrar y continuar sin cuenta"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Icono de Marca Pastelera -->
        <div class="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-400 to-pink-400 p-0.5 shadow-lg shadow-pink-200/80 mb-4 flex items-center justify-center">
          <div class="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-3xl select-none">
            🎂
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 text-pink-700 text-[11px] font-bold mb-2">
          <span>✨</span> Sincronización en la Nube
        </div>

        <h3 class="text-2xl font-black text-gray-900 tracking-tight mb-1 font-heading">
          Tu Pastelería Siempre Conectada
        </h3>
        <p class="text-xs text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
          Accede a tus recetas, costos e insumos desde cualquier celular, tablet o computador sin perder nada.
        </p>

        <!-- Tarjetas de Beneficios con diseño pastelero -->
        <div class="bg-gradient-to-b from-pink-50/70 to-rose-50/40 rounded-2xl p-4 text-left space-y-2.5 mb-6 border border-pink-100/70">
          <div class="flex items-start gap-3">
            <span class="text-lg leading-none">🎂</span>
            <div>
              <h5 class="text-xs font-bold text-gray-800">Recetas y Fichas Técnicas</h5>
              <p class="text-[11px] text-gray-500">Tus costes, ingredientes y porciones siempre respaldados.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lg leading-none">📦</span>
            <div>
              <h5 class="text-xs font-bold text-gray-800">Insumos e Inventario</h5>
              <p class="text-[11px] text-gray-500">Actualiza precios en tu celular y se reflejan en tu PC al instante.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lg leading-none">⚡</span>
            <div>
              <h5 class="text-xs font-bold text-gray-800">Sincronización en Vivo</h5>
              <p class="text-[11px] text-gray-500">Firestore guarda tus cambios automáticamente segundo a segundo.</p>
            </div>
          </div>
        </div>

        <!-- Botón de Inicio de Sesión con Google -->
        <div id="login-modal-action-container">
          <button 
            onclick="AuthModule.loginWithGoogle()"
            id="google-login-main-btn"
            class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50/90 text-gray-800 border-2 border-gray-200 hover:border-pink-300 font-bold py-3.5 px-4 rounded-2xl shadow-sm hover:shadow-md hover:shadow-pink-100 transition-all duration-200 text-sm mb-3 group cursor-pointer"
          >
            <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <p class="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-4">
          <svg class="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          Conexión segura y cifrada con Firebase Cloud
        </p>

        <!-- Botón secundario para modo local -->
        <button 
          onclick="AuthModule.closeLoginModal()"
          class="text-xs text-gray-400 hover:text-pink-600 font-semibold py-1 transition"
        >
          Continuar en modo local (sin sincronizar)
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  renderLoginModalLoading(isLoading) {
    const container = document.getElementById('login-modal-action-container');
    if (!container) return;

    if (isLoading) {
      container.innerHTML = `
        <div class="w-full flex items-center justify-center gap-2.5 bg-pink-50 text-pink-700 font-bold py-3.5 px-4 rounded-2xl border border-pink-200 text-sm mb-3">
          <div class="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Iniciando sesión con Google...</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button 
          onclick="AuthModule.loginWithGoogle()"
          id="google-login-main-btn"
          class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50/90 text-gray-800 border-2 border-gray-200 hover:border-pink-300 font-bold py-3.5 px-4 rounded-2xl shadow-sm hover:shadow-md hover:shadow-pink-100 transition-all duration-200 text-sm mb-3 group cursor-pointer"
        >
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      `;
    }
  },

  closeLoginModal() {
    const modal = document.getElementById('login-prompt-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  // Modal de Diagnóstico / Configuración de Firebase
  showConfigModal() {
    let modal = document.getElementById('firebase-config-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'firebase-config-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    const currentConfig = FirebaseService.getConfig();
    const isLive = FirebaseService.isConfigured && this.currentUser;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔥</span>
            <div>
              <h3 class="font-bold text-gray-900 text-base font-heading">Estado de Conexión Nube</h3>
              <p class="text-xs text-gray-400">Firebase Firestore & Google Authentication</p>
            </div>
          </div>
          <button onclick="document.getElementById('firebase-config-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 p-1">
            ✕
          </button>
        </div>

        <!-- Estado en tiempo real -->
        <div class="p-3.5 rounded-2xl ${isLive ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'} text-xs space-y-1.5">
          <div class="flex items-center justify-between font-bold ${isLive ? 'text-emerald-800' : 'text-amber-800'}">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              ${isLive ? 'Conexión Activa y Sincronizando' : 'Pendiente de inicio de sesión'}
            </span>
            <span class="text-[11px] font-mono">${currentConfig.projectId || 'Sin proyecto'}</span>
          </div>
          <p class="text-[11px] ${isLive ? 'text-emerald-700' : 'text-amber-700'}">
            ${isLive 
              ? `Sesión iniciada como <strong>${this.currentUser.email}</strong>. Sincronización continua en segundo plano cada 20 segundos y listeners en tiempo real.` 
              : 'Las credenciales están cargadas. Inicia sesión con tu cuenta de Google para comenzar el respaldo.'}
          </p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">API Key</label>
            <input type="text" id="fb-api-key" value="${currentConfig.apiKey || ''}" placeholder="AIzaSy..." class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Project ID</label>
              <input type="text" id="fb-project-id" value="${currentConfig.projectId || ''}" placeholder="cakekulator-bd" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Auth Domain</label>
              <input type="text" id="fb-auth-domain" value="${currentConfig.authDomain || ''}" placeholder="cakekulator-bd.firebaseapp.com" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <button 
            type="button" 
            onclick="FirebaseService.resetConfig()" 
            class="text-xs text-gray-400 hover:text-red-500 underline"
          >
            Restablecer credenciales
          </button>
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              onclick="document.getElementById('firebase-config-modal').classList.add('hidden')" 
              class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button 
              type="button" 
              onclick="AuthModule.saveConfigFromModal()" 
              class="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-200 transition"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  saveConfigFromModal() {
    const apiKey = document.getElementById('fb-api-key')?.value.trim();
    const projectId = document.getElementById('fb-project-id')?.value.trim();
    const authDomain = document.getElementById('fb-auth-domain')?.value.trim() || `${projectId}.firebaseapp.com`;

    if (!apiKey || !projectId) {
      alert('Por favor ingresa al menos la API Key y el Project ID.');
      return;
    }

    const current = FirebaseService.getConfig();
    const config = {
      ...current,
      apiKey,
      authDomain,
      projectId
    };

    FirebaseService.saveCustomConfig(config);
  }
};

// Cerrar dropdown al hacer click afuera
document.addEventListener('click', (e) => {
  const btn = document.getElementById('user-profile-btn');
  const menu = document.getElementById('user-dropdown-menu');
  if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
  }
});
