// ==========================================
// Cakekulator Cliente - Módulo de Autenticación con Google y Sincronización en la Nube
// ==========================================

const UserAuthModule = {
  currentUser: null,
  syncStatus: 'local', // 'local' | 'synced' | 'syncing' | 'error' | 'offline'
  syncStatusText: 'Modo Local',
  isInitialized: false,

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Inicializar Firebase si aún no está inicializado
    if (typeof FirebaseService !== 'undefined') {
      FirebaseService.init();

      if (FirebaseService.auth) {
        FirebaseService.auth.onAuthStateChanged(user => {
          this.currentUser = user;
          if (user) {
            console.log('👤 Sesión de Cliente activa:', user.displayName || user.email);
            this.updateSyncStatus('syncing', 'Sincronizando con la nube...');
            this.syncFromCloud(user.uid).then(() => {
              this.updateSyncStatus('synced', 'Sincronizado');
              this.renderAuthUI();
              if (typeof UserProfileModule !== 'undefined' && UserProfileModule.renderProfileView) {
                UserProfileModule.renderProfileView();
              }
            }).catch(err => {
              console.warn('Aviso en sincronización de cliente:', err);
              this.updateSyncStatus('error', 'Error al sincronizar');
              this.renderAuthUI();
            });
          } else {
            this.updateSyncStatus('local', 'Modo Local');
            this.renderAuthUI();
          }
        });
      }
    }

    this.renderAuthUI();
  },

  // Estado visual de sincronización
  updateSyncStatus(status, text) {
    this.syncStatus = status;
    this.syncStatusText = text;
    this.renderAuthUI();
  },

  // Renderizar componentes de autenticación en la interfaz del cliente
  renderAuthUI() {
    // 1. Botón / Avatar en la barra superior (Header)
    const headerAuthContainer = document.getElementById('user-header-auth-container');
    if (headerAuthContainer) {
      if (this.currentUser) {
        const photo = this.currentUser.photoURL || '';
        const name = this.currentUser.displayName || 'Cliente';
        const initial = name.charAt(0).toUpperCase();

        headerAuthContainer.innerHTML = `
          <div class="relative group">
            <button onclick="UserAuthModule.toggleUserMenu()" class="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-slate-700 shadow-2xs hover:border-pink-300 transition">
              ${photo ? `
                <img src="${photo}" alt="${name}" class="w-7 h-7 rounded-xl object-cover ring-1 ring-pink-300 dark:ring-slate-600" />
              ` : `
                <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-black text-xs flex items-center justify-center">
                  ${initial}
                </div>
              `}
              <span class="w-2 h-2 rounded-full ${this.syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-400'} ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            <!-- Dropdown del usuario -->
            <div id="user-header-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-pink-100 dark:border-slate-800 p-3 z-50 space-y-2 animate-scale-up">
              <div class="border-b border-gray-100 dark:border-slate-800 pb-2">
                <p class="font-extrabold text-xs text-gray-900 dark:text-white truncate">${name}</p>
                <p class="text-[10px] text-gray-400 truncate">${this.currentUser.email || ''}</p>
                <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                  <span>☁️</span> <span>${this.syncStatusText}</span>
                </span>
              </div>
              
              <button onclick="UserApp.switchTab('profile'); UserAuthModule.closeUserMenu();" class="w-full text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-pink-600 flex items-center gap-2 p-1.5 rounded-xl hover:bg-pink-50 dark:hover:bg-slate-800 transition">
                <span>👤</span> <span>Mi Perfil & Preferencias</span>
              </button>

              <button onclick="UserAuthModule.logout()" class="w-full text-left text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-2 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                <span>🚪</span> <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        `;
      } else {
        headerAuthContainer.innerHTML = `
          <button onclick="UserAuthModule.loginWithGoogle()" class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-pink-300 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Acceder</span>
          </button>
        `;
      }
    }

    // 2. Tarjeta de Estado de Cuenta en la vista de Perfil
    const profileAuthCard = document.getElementById('user-profile-auth-card');
    if (profileAuthCard) {
      if (this.currentUser) {
        profileAuthCard.innerHTML = `
          <div class="p-4 bg-gradient-to-br from-pink-50 via-rose-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-pink-200 dark:border-slate-700 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <img src="${this.currentUser.photoURL || 'assets/icons/favicon-user.png'}" class="w-10 h-10 rounded-2xl object-cover ring-2 ring-pink-400/40" />
                <div>
                  <h4 class="font-extrabold text-xs text-gray-900 dark:text-white">${this.currentUser.displayName || 'Cliente Cakekulator'}</h4>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400">${this.currentUser.email}</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                <span>☁️</span> Sincronizado
              </span>
            </div>

            <p class="text-[11px] text-gray-600 dark:text-gray-300">
              Tus preferencias, direcciones y locales favoritos se guardan automáticamente en tu perfil de cliente.
            </p>

            <div class="flex items-center justify-between pt-2 border-t border-pink-100 dark:border-slate-700 text-xs">
              <button onclick="UserAuthModule.pushToCloud()" class="text-pink-600 dark:text-pink-400 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                <span>🔄</span> Sincronizar Ahora
              </button>
              <button onclick="UserAuthModule.logout()" class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer">
                Cerrar Sesión
              </button>
            </div>
          </div>
        `;
      } else {
        profileAuthCard.innerHTML = `
          <div class="p-4 bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-pink-200/80 dark:border-slate-700 shadow-xs space-y-3 text-center">
            <div class="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-slate-700 text-pink-600 dark:text-pink-300 text-xl flex items-center justify-center mx-auto shadow-inner">
              ☁️
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-gray-900 dark:text-white">Guarda tus Favoritos y Pedidos</h4>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Inicia sesión con Google para no perder tus preferencias ni locales guardados.</p>
            </div>
            <button onclick="UserAuthModule.loginWithGoogle()" class="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl text-xs font-extrabold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer">
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar con Google</span>
            </button>
          </div>
        `;
      }
    }
  },

  toggleUserMenu() {
    const dropdown = document.getElementById('user-header-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
  },

  closeUserMenu() {
    const dropdown = document.getElementById('user-header-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  },

  // Iniciar sesión con Google
  async loginWithGoogle() {
    try {
      if (!FirebaseService.auth || !FirebaseService.googleProvider) {
        FirebaseService.init();
      }

      const result = await FirebaseService.auth.signInWithPopup(FirebaseService.googleProvider);
      this.currentUser = result.user;
      
      // Actualizar perfil local con los datos de Google si están vacíos
      const localProfile = UserDB.getProfile();
      if (!localProfile.name || localProfile.name === 'Valentina Henríquez') {
        localProfile.name = result.user.displayName || localProfile.name;
      }
      if (!localProfile.email) {
        localProfile.email = result.user.email || localProfile.email;
      }
      UserDB.saveProfile(localProfile);

      UserApp.showToast(`👋 ¡Bienvenido/a ${result.user.displayName || ''}!`);
      this.init();
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
      UserApp.showToast('⚠️ No se pudo completar el inicio de sesión.');
    }
  },

  // Cerrar sesión
  async logout() {
    try {
      if (FirebaseService.auth) {
        await FirebaseService.auth.signOut();
      }
      this.currentUser = null;
      this.closeUserMenu();
      this.updateSyncStatus('local', 'Modo Local');
      UserApp.showToast('ℹ️ Sesión cerrada en la App de Clientes');
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    }
  },

  // ==========================================
  // SINCRONIZACIÓN AISLADA EN LA NUBE (Colección: client_users/{uid})
  // Totalmente separada de la base de datos de vendedores (users/{uid})
  // ==========================================
  async syncFromCloud(uid) {
    if (!FirebaseService.db || !uid) return;

    try {
      const clientDocRef = FirebaseService.db.collection('client_users').doc(uid);
      const doc = await clientDocRef.get();

      if (doc.exists) {
        const cloudData = doc.data();
        
        // 1. Sincronizar perfil
        if (cloudData.profile) {
          const currentProfile = UserDB.getProfile();
          const mergedProfile = { ...currentProfile, ...cloudData.profile };
          UserDB.saveProfile(mergedProfile);
        }

        // 2. Sincronizar favoritos
        if (Array.isArray(cloudData.favorites)) {
          UserDB.saveFavorites(cloudData.favorites);
        }

        // 3. Sincronizar solicitudes creadas por el cliente
        if (Array.isArray(cloudData.requests) && cloudData.requests.length > 0) {
          const currentRequests = UserDB.getRequests();
          // Combinar solicitudes
          const requestMap = new Map();
          currentRequests.forEach(r => requestMap.set(r.id, r));
          cloudData.requests.forEach(r => requestMap.set(r.id, r));
          UserDB.saveRequests(Array.from(requestMap.values()));
        }
      } else {
        // Primera vez del cliente: subir su perfil inicial a client_users/{uid}
        await this.pushToCloud(uid);
      }
    } catch (err) {
      console.warn('Aviso al sincronizar desde Firebase:', err);
      throw err;
    }
  },

  async pushToCloud(customUid = null) {
    const uid = customUid || (this.currentUser ? this.currentUser.uid : null);
    if (!FirebaseService.db || !uid) return;

    try {
      const profile = UserDB.getProfile();
      const favorites = UserDB.getFavorites();
      const requests = UserDB.getRequests();

      const clientPayload = {
        uid: uid,
        email: this.currentUser ? this.currentUser.email : profile.email,
        displayName: this.currentUser ? this.currentUser.displayName : profile.name,
        profile: profile,
        favorites: favorites,
        requests: requests,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      await FirebaseService.db.collection('client_users').doc(uid).set(clientPayload, { merge: true });
      this.updateSyncStatus('synced', 'Sincronizado');
      console.log('✅ Datos de cliente guardados en Firestore (client_users)');
    } catch (err) {
      console.error('Error al guardar datos de cliente en Firestore:', err);
      this.updateSyncStatus('error', 'Error al sincronizar');
    }
  }
};
