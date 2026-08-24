// ==========================================
// Cakekulator - Módulo de Autenticación y Control de Sesión con Google
// ==========================================

const AuthModule = {
  currentUser: null,
  syncStatus: 'local', // 'local' | 'synced' | 'syncing' | 'error'
  hasCheckedAuth: false,

  init() {
    const isConfigured = FirebaseService.init();

    if (isConfigured && FirebaseService.auth) {
      FirebaseService.auth.onAuthStateChanged(user => {
        this.currentUser = user;
        this.hasCheckedAuth = true;
        this.renderAuthUI();

        if (user) {
          console.log('👤 Sesión activa:', user.displayName, user.email);
          this.closeLoginModal();
          this.syncStatus = 'syncing';
          this.renderAuthUI();
          
          if (typeof DB !== 'undefined' && DB.initCloudSync) {
            DB.initCloudSync(user.uid).then(() => {
              this.syncStatus = 'synced';
              this.renderAuthUI();
            }).catch(err => {
              console.error('Error al sincronizar con la nube:', err);
              this.syncStatus = 'error';
              this.renderAuthUI();
            });
          }
        } else {
          this.syncStatus = 'local';
          this.renderAuthUI();
          // Si no hay sesión iniciada, mostrar modal de bienvenida para pedir login
          this.showLoginRequiredModal();
        }
      });
    } else {
      this.hasCheckedAuth = true;
      this.renderAuthUI();
    }
  },

  renderAuthUI() {
    const container = document.getElementById('auth-header-container');
    if (!container) return;

    if (!FirebaseService.isConfigured) {
      container.innerHTML = `
        <button 
          onclick="AuthModule.showConfigModal()" 
          title="Conectar con Firebase y Google Cloud"
          class="flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-700 border border-pink-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition duration-200"
        >
          <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
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
      if (this.syncStatus === 'synced') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300" title="Sincronizado en la nube"></span>';
      } else if (this.syncStatus === 'syncing') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white animate-ping" title="Sincronizando..."></span>';
      } else if (this.syncStatus === 'error') {
        syncBadge = '<span class="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-300" title="Error de sincronización"></span>';
      }

      container.innerHTML = `
        <div class="relative">
          <button 
            onclick="AuthModule.toggleUserDropdown()" 
            id="user-profile-btn"
            class="flex items-center gap-2 bg-white hover:bg-pink-50/70 border border-gray-200/80 hover:border-pink-200 px-2 sm:px-2.5 py-1 rounded-2xl shadow-xs transition duration-200"
          >
            <div class="relative">
              ${photoURL ? `
                <img src="${photoURL}" alt="${name}" class="w-7 h-7 rounded-full object-cover ring-1 ring-pink-300">
              ` : `
                <div class="w-7 h-7 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-xs">
                  ${firstName.charAt(0).toUpperCase()}
                </div>
              `}
              <div class="absolute -bottom-0.5 -right-0.5">
                ${syncBadge}
              </div>
            </div>
            <span class="text-xs font-bold text-gray-800 hidden sm:inline max-w-[100px] truncate">${firstName}</span>
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <!-- Dropdown Menu -->
          <div id="user-dropdown-menu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              ${photoURL ? `
                <img src="${photoURL}" alt="${name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-pink-300">
              ` : `
                <div class="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-sm">
                  ${firstName.charAt(0).toUpperCase()}
                </div>
              `}
              <div class="truncate">
                <h4 class="font-bold text-xs text-gray-900 truncate">${name}</h4>
                <p class="text-[11px] text-gray-400 truncate">${this.currentUser.email || ''}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full ${this.syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                  <span class="text-[10px] font-semibold text-emerald-600">Nube Firebase Activa</span>
                </div>
              </div>
            </div>

            <div class="p-1 space-y-0.5">
              <button 
                onclick="AuthModule.forceSyncNow()" 
                class="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition flex items-center gap-2"
              >
                <span>🔄</span> Sincronizar Ahora con Firestore
              </button>
              <button 
                onclick="AuthModule.showConfigModal()" 
                class="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition flex items-center gap-2"
              >
                <span>⚙️</span> Configuración de Firebase
              </button>
              <button 
                onclick="AuthModule.logout()" 
                class="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2"
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
          onclick="AuthModule.loginWithGoogle()" 
          class="flex items-center gap-2 bg-white hover:bg-pink-50/50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-pink-300 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition duration-200"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="hidden sm:inline">Ingresar con Google</span>
          <span class="sm:hidden">Ingresar</span>
        </button>
      `;
    }
  },

  toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  },

  async loginWithGoogle() {
    if (!FirebaseService.isConfigured) {
      this.showConfigModal();
      return;
    }

    try {
      const result = await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
      console.log('✅ Inicio de sesión exitoso:', result.user.displayName);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('El navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes para este sitio.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('Dominio no autorizado en Firebase. Agrega tu dominio (ej: localhost o dominio web) en Firebase Console > Authentication > Settings > Authorized domains.');
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

        // Limpiar datos de sesión para proteger la privacidad entre usuarios
        if (typeof DB !== 'undefined' && DB.clearSessionData) {
          DB.clearSessionData();
        }
        if (typeof App !== 'undefined' && App.renderCurrentTab) {
          App.renderCurrentTab();
        }
        console.log('Sesión cerrada exitosamente.');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  },

  async forceSyncNow() {
    if (!this.currentUser) return;
    this.syncStatus = 'syncing';
    this.renderAuthUI();
    try {
      await DB.pushLocalToCloud(this.currentUser.uid);
      await DB.pullCloudToLocal(this.currentUser.uid);
      this.syncStatus = 'synced';
      this.renderAuthUI();
      alert('✅ Datos sincronizados correctamente con Firebase Cloud Firestore.');
      // Actualizar vista actual
      if (typeof App !== 'undefined' && App.renderCurrentTab) {
        App.renderCurrentTab();
      }
    } catch (e) {
      console.error('Error forzando sincronización:', e);
      this.syncStatus = 'error';
      this.renderAuthUI();
      alert('⚠️ Ocurrió un error al sincronizar con la nube.');
    }
  },

  showConfigModal() {
    let modal = document.getElementById('firebase-config-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'firebase-config-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    const currentConfig = FirebaseService.getConfig();

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔥</span>
            <div>
              <h3 class="font-bold text-gray-900 text-base">Conexión con Firebase & Google</h3>
              <p class="text-xs text-gray-400">Guarda tus recetas y cotizaciones en la nube</p>
            </div>
          </div>
          <button onclick="document.getElementById('firebase-config-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 p-1">
            ✕
          </button>
        </div>

        <div class="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 text-xs text-gray-600 space-y-1.5">
          <p class="font-bold text-pink-700 flex items-center gap-1">
            <span>💡</span> Pasos rápidos para conectar:
          </p>
          <ol class="list-decimal list-inside space-y-1 text-[11px] text-gray-600 pl-1">
            <li>Crea un proyecto en <a href="https://console.firebase.google.com" target="_blank" class="text-pink-600 underline font-bold">Firebase Console</a></li>
            <li>En <strong>Authentication</strong> activa <strong>Google</strong> como proveedor.</li>
            <li>En <strong>Firestore Database</strong> crea tu base de datos en modo prueba o producción.</li>
            <li>En Configuración del Proyecto > General > <em>Tus apps (Web)</em>, copia tu <strong>firebaseConfig</strong> y pégalo abajo:</li>
          </ol>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">API Key</label>
            <input type="text" id="fb-api-key" value="${currentConfig.apiKey && !currentConfig.apiKey.includes('TU_API_KEY') ? currentConfig.apiKey : ''}" placeholder="AIzaSy..." class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Project ID</label>
              <input type="text" id="fb-project-id" value="${currentConfig.projectId && !currentConfig.projectId.includes('tu-proyecto') ? currentConfig.projectId : ''}" placeholder="mi-pasteleria-app" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Auth Domain</label>
              <input type="text" id="fb-auth-domain" value="${currentConfig.authDomain && !currentConfig.authDomain.includes('tu-proyecto') ? currentConfig.authDomain : ''}" placeholder="mi-app.firebaseapp.com" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">App ID</label>
              <input type="text" id="fb-app-id" value="${currentConfig.appId && !currentConfig.appId.includes('1:1234567890') ? currentConfig.appId : ''}" placeholder="1:123456:web:abcd..." class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Storage Bucket</label>
              <input type="text" id="fb-storage-bucket" value="${currentConfig.storageBucket && !currentConfig.storageBucket.includes('tu-proyecto') ? currentConfig.storageBucket : ''}" placeholder="mi-app.appspot.com" class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400">
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button 
            type="button" 
            onclick="FirebaseService.resetConfig()" 
            class="text-xs text-gray-400 hover:text-red-500 underline"
          >
            Restablecer a Local
          </button>
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              onclick="document.getElementById('firebase-config-modal').classList.add('hidden')" 
              class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onclick="AuthModule.saveConfigFromModal()" 
              class="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md shadow-pink-200 transition"
            >
              Guardar y Conectar
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
    const appId = document.getElementById('fb-app-id')?.value.trim();
    const storageBucket = document.getElementById('fb-storage-bucket')?.value.trim() || `${projectId}.appspot.com`;

    if (!apiKey || !projectId) {
      alert('Por favor ingresa al menos la API Key y el Project ID de tu proyecto de Firebase.');
      return;
    }

    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId: "",
      appId: appId || ""
    };

    FirebaseService.saveCustomConfig(config);
  },

  showLoginRequiredModal() {
    let modal = document.getElementById('login-prompt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'login-prompt-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-300';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-pink-100 text-center relative animate-in zoom-in-95 duration-200">
        <!-- Logo e Icono -->
        <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 p-0.5 shadow-lg shadow-pink-200 mb-4 flex items-center justify-center">
          <div class="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-3xl">
            🎂
          </div>
        </div>

        <h3 class="text-2xl font-black text-gray-900 tracking-tight mb-1">¡Bienvenido a Cakekulator!</h3>
        <p class="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
          Inicia sesión con tu cuenta de Google para sincronizar tus recetas, costos e insumos en la nube de Firebase.
        </p>

        <!-- Beneficios -->
        <div class="bg-pink-50/60 rounded-2xl p-4 text-left space-y-2 mb-6 border border-pink-100/60">
          <div class="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
            <span class="text-pink-600 font-bold">✓</span> Tus recetas y cálculos respaldados en Firestore.
          </div>
          <div class="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
            <span class="text-pink-600 font-bold">✓</span> Accede desde tu celular o computadora.
          </div>
          <div class="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
            <span class="text-pink-600 font-bold">✓</span> Sincronización automática de precios e insumos.
          </div>
        </div>

        <!-- Botón de inicio de sesión con Google -->
        <button 
          onclick="AuthModule.loginWithGoogle()"
          class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-pink-300 font-bold py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-sm mb-3 group"
        >
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        <!-- Opción de continuar como invitado / offline -->
        <button 
          onclick="AuthModule.closeLoginModal()"
          class="text-xs text-gray-400 hover:text-gray-600 font-semibold py-1 transition underline"
        >
          Continuar en modo local sin cuenta
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeLoginModal() {
    const modal = document.getElementById('login-prompt-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
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
