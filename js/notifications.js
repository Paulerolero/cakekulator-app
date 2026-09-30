// ==========================================================
// Cakekulator - Módulo de Notificaciones Push & Web (FCM)
// ==========================================================

const NotificationsModule = {
  currentToken: localStorage.getItem('cakekulator_fcm_token') || null,
  settings: {
    enabled: localStorage.getItem('cakekulator_notif_enabled') === 'true',
    notifyOrders: localStorage.getItem('cakekulator_notif_orders') !== 'false',
    notifyQuotes: localStorage.getItem('cakekulator_notif_quotes') !== 'false',
    notifyBirthdays: localStorage.getItem('cakekulator_notif_birthdays') !== 'false',
    notifyStock: localStorage.getItem('cakekulator_notif_stock') !== 'false',
  },

  cloudNotifications: [],
  readNotificationIds: JSON.parse(localStorage.getItem('cakekulator_read_notifs') || '[]'),
  lastKnownNotifTime: parseInt(localStorage.getItem('cakekulator_last_notif_ts') || '0', 10),

  isSupported() {
    return ('Notification' in window) && ('serviceWorker' in navigator);
  },

  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
  },

  async init() {
    // 1. Iniciar escucha de notificaciones de la nube (Firestore) para el centro de notificaciones
    this.initCloudNotificationsListener();

    if (!this.isSupported()) {
      console.info('ℹ️ Notificaciones Web no soportadas en este navegador.');
      return;
    }

    // 2. Si ya tiene permiso otorgado, configurar escucha en primer plano y obtener token
    if (Notification.permission === 'granted') {
      this.setupForegroundListener();
      this.syncToken();
      // Ejecutar chequeo de alertas diarias
      setTimeout(() => this.checkDailyAlerts(), 2500);
    }
  },

  setupForegroundListener() {
    if (typeof FirebaseService !== 'undefined' && FirebaseService.messaging) {
      try {
        FirebaseService.messaging.onMessage((payload) => {
          console.log('🔔 Mensaje FCM recibido en primer plano:', payload);
          const title = payload.notification?.title || payload.data?.title || 'Cakekulator';
          const body = payload.notification?.body || payload.data?.body || 'Nueva notificación recibida.';
          const icon = payload.notification?.icon || payload.data?.icon || 'assets/icons/icon-192.png';

          this.showLocalNotification(title, {
            body: body,
            icon: icon,
            data: payload.data
          });

          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(`🔔 ${title}: ${body}`);
          }
        });
      } catch (e) {
        console.warn('No se pudo vincular el listener de primer plano FCM:', e);
      }
    }
  },

  async requestPermission() {
    if (!this.isSupported()) {
      alert('Tu navegador o dispositivo no soporta notificaciones push.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.settings.enabled = true;
        localStorage.setItem('cakekulator_notif_enabled', 'true');
        
        await this.syncToken();
        this.setupForegroundListener();
        
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('🎉 ¡Notificaciones push activadas con éxito!');
        }

        // Si estamos en la pestaña de ajustes, refrescar vista
        if (typeof App !== 'undefined' && App.currentTab === 'settings') {
          App.renderSettings();
        }

        this.sendTestNotification();
        return true;
      } else if (permission === 'denied') {
        alert('Las notificaciones fueron bloqueadas. Puedes habilitarlas haciendo clic en el icono de candado o configuración del sitio en tu navegador.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      return false;
    }
  },

  getVapidKey() {
    const config = typeof FirebaseService !== 'undefined' ? FirebaseService.getConfig() : {};
    return config.vapidKey || localStorage.getItem('cakekulator_vapid_key') || '';
  },

  async saveVapidKey(key) {
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem('cakekulator_vapid_key', trimmed);
      if (typeof FirebaseService !== 'undefined') {
        const cfg = FirebaseService.getConfig();
        cfg.vapidKey = trimmed;
      }
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('🔑 Clave VAPID guardada. Sincronizando con FCM...');
      }
      await this.syncToken();
      if (typeof App !== 'undefined' && App.currentTab === 'settings') {
        App.renderSettings();
      }
    }
  },

  async syncToken() {
    if (!this.isSupported() || Notification.permission !== 'granted') return null;

    try {
      // Registrar el Service Worker de Firebase Messaging si aún no está activo
      let registration = null;
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        registration = regs.find(r => r.active && r.active.scriptURL.includes('firebase-messaging-sw.js')) || null;
        if (!registration) {
          registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        }
      } catch (swErr) {
        console.warn('Registro directo de firebase-messaging-sw.js:', swErr);
      }

      if (!registration) {
        registration = await navigator.serviceWorker.ready;
      }

      if (typeof FirebaseService !== 'undefined' && FirebaseService.messaging) {
        const vapidKey = this.getVapidKey();
        const tokenParams = {
          serviceWorkerRegistration: registration
        };
        if (vapidKey) {
          tokenParams.vapidKey = vapidKey;
        }

        try {
          const token = await FirebaseService.messaging.getToken(tokenParams);

          if (token) {
            this.currentToken = token;
            localStorage.setItem('cakekulator_fcm_token', token);
            console.log('🔑 Token FCM obtenido con éxito:', token);
            await this.saveTokenToCloud(token);
            return token;
          }
        } catch (fcmError) {
          console.warn('ℹ️ Detalle de Firebase Messaging getToken:', fcmError);
          if (fcmError.code === 'messaging/missing-app-config-values' || (fcmError.message && fcmError.message.includes('vapidKey'))) {
            console.info('⚠️ Se necesita la clave VAPID pública de Firebase Console > Cloud Messaging > Certificados Web Push.');
          }
        }
      }
    } catch (err) {
      console.warn('Error sincronizando token FCM:', err);
    }
    return this.currentToken;
  },

  async saveTokenToCloud(token) {
    if (!token) return;
    try {
      if (typeof AuthModule !== 'undefined' && AuthModule.currentUser && typeof FirebaseService !== 'undefined' && FirebaseService.db) {
        const uid = AuthModule.currentUser.uid;
        const deviceId = btoa(navigator.userAgent.slice(0, 50)).replace(/[/+=]/g, '').slice(0, 20);
        
        await FirebaseService.db.collection('users').doc(uid).collection('fcm_tokens').doc(deviceId).set({
          token: token,
          userAgent: navigator.userAgent,
          updatedAt: new Date().toISOString(),
          platform: navigator.platform || 'web'
        }, { merge: true });
        
        console.log('☁️ Token FCM respaldado en Firestore para el usuario activo');
      }
    } catch (e) {
      console.warn('No se pudo guardar el token FCM en Firestore:', e);
    }
  },

  showLocalNotification(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const defaultOptions = {
      icon: 'assets/icons/icon-192.png',
      badge: 'assets/icons/icon-192.png',
      vibrate: [200, 100, 200],
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, defaultOptions);
      }).catch(() => {
        new Notification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  },

  sendTestNotification() {
    if (Notification.permission !== 'granted') {
      this.requestPermission();
      return;
    }

    this.showLocalNotification('🎂 Cakekulator - Notificación de Prueba', {
      body: '¡Excelente! Las notificaciones y alertas están configuradas y funcionando correctamente.',
      icon: 'assets/icons/icon-192.png',
      tag: 'cakekulator-test'
    });

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🔔 Notificación de prueba enviada al dispositivo');
    }
  },

  copyToken() {
    if (!this.currentToken) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('⚠️ Primero activa las notificaciones para generar un Token FCM');
      }
      return;
    }

    navigator.clipboard.writeText(this.currentToken).then(() => {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('📋 ¡Token FCM copiado al portapapeles!');
      }
    }).catch(() => {
      prompt('Copia tu Token FCM:', this.currentToken);
    });
  },

  toggleSetting(key) {
    if (this.settings.hasOwnProperty(key)) {
      this.settings[key] = !this.settings[key];
      localStorage.setItem(`cakekulator_notif_${key.replace('notify', '').toLowerCase()}`, String(this.settings[key]));
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('⚙️ Preferencias de alerta actualizadas');
      }
    }
  },

  // Chequeo de eventos y alertas diarias
  checkDailyAlerts() {
    if (Notification.permission !== 'granted') return;

    // Limitar chequeo a una vez cada 6 horas para evitar saturación
    const lastCheck = parseInt(localStorage.getItem('cakekulator_last_notif_check') || '0', 10);
    const now = Date.now();
    if (now - lastCheck < 6 * 60 * 60 * 1000) return;

    localStorage.setItem('cakekulator_last_notif_check', String(now));

    const todayStr = new Date().toISOString().split('T')[0];
    const quotes = (typeof DB !== 'undefined' && DB.quotes) ? DB.quotes : [];
    const isServicesMode = (typeof App !== 'undefined' && App.currentMode === 'services');

    // 1. Entregas / Citas de Hoy
    if (this.settings.notifyOrders) {
      const todayDeliveries = quotes.filter(q => q.deliveryDate === todayStr && q.status === 'approved');
      if (todayDeliveries.length > 0) {
        this.showLocalNotification(
          isServicesMode ? `💆 Citas Agendadas Hoy (${todayDeliveries.length})` : `🚚 Entregas Programadas Hoy (${todayDeliveries.length})`,
          {
            body: isServicesMode 
              ? `Tienes ${todayDeliveries.length} cita(s) programada(s) para hoy en tu centro.`
              : `Tienes ${todayDeliveries.length} pedido(s) confirmado(s) para entregar el día de hoy.`,
            tag: 'cakekulator-today-orders'
          }
        );
      }
    }

    // 2. Cotizaciones Enviadas por Confirmar
    if (this.settings.notifyQuotes) {
      const pendingQuotes = quotes.filter(q => q.status === 'sent');
      if (pendingQuotes.length > 0) {
        setTimeout(() => {
          this.showLocalNotification(
            `📋 Cotizaciones por Confirmar (${pendingQuotes.length})`,
            {
              body: `Hay ${pendingQuotes.length} presupuesto(s) enviado(s) pendiente(s) de respuesta de tus clientes.`,
              tag: 'cakekulator-pending-quotes'
            }
          );
        }, 1500);
      }
    }
  },

  // ==========================================================
  // ESCUCHA EN TIEMPO REAL DESDE FIRESTORE (CLOUD NOTIFICATIONS)
  // ==========================================================
  initCloudNotificationsListener() {
    if (typeof FirebaseService === 'undefined') return;

    const startListener = () => {
      if (!FirebaseService.db) return;
      try {
        FirebaseService.db.collection('system_notifications')
          .orderBy('createdAt', 'desc')
          .limit(30)
          .onSnapshot((snap) => {
            if (!snap) return;
            const currentUid = (typeof AuthModule !== 'undefined' && AuthModule.currentUser) ? AuthModule.currentUser.uid : null;
            const notifs = [];
            snap.docs.forEach(doc => {
              const d = doc.data();
              const isForMe = !d.target || d.target === 'all' || d.target === 'sellers' || (currentUid && d.target === currentUid);
              if (isForMe) {
                notifs.push({ id: doc.id, ...d });
              }
            });

            this.cloudNotifications = notifs;
            this.handleNewIncomingNotifications(notifs);
            this.updateBadgeCount();
          }, (err) => {
            console.warn('Listener system_notifications:', err);
          });
      } catch (e) {
        console.warn('Error al iniciar listener de notificaciones:', e);
      }
    };

    if (FirebaseService.db) {
      startListener();
    } else {
      setTimeout(startListener, 1500);
    }
  },

  handleNewIncomingNotifications(notifs) {
    if (!notifs || notifs.length === 0) return;
    const latest = notifs[0];
    const latestTs = latest.createdAt ? (latest.createdAt.toMillis ? latest.createdAt.toMillis() : new Date(latest.createdAt).getTime()) : Date.now();

    if (latestTs > this.lastKnownNotifTime && !this.readNotificationIds.includes(latest.id)) {
      this.lastKnownNotifTime = latestTs;
      localStorage.setItem('cakekulator_last_notif_ts', String(latestTs));

      const iconMap = {
        promo: '🎁',
        membership: '👑',
        alert: '🚨',
        order: '🎂',
        system: '🔔'
      };
      const emoji = iconMap[latest.type] || '🔔';

      this.showLocalNotification(`${emoji} ${latest.title}`, {
        body: latest.message,
        icon: 'assets/icons/icon-192.png',
        tag: `notif-${latest.id}`
      });

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`${emoji} ${latest.title}: ${latest.message}`);
      }
    }
  },

  updateBadgeCount() {
    const unread = this.cloudNotifications.filter(n => !this.readNotificationIds.includes(n.id)).length;
    document.querySelectorAll('.notif-badge-count, #notif-badge-count').forEach(el => {
      if (unread > 0) {
        el.textContent = unread > 9 ? '9+' : String(unread);
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  },

  openCenter() {
    let modal = document.getElementById('notifications-center-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notifications-center-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto';

    const unreadCount = this.cloudNotifications.filter(n => !this.readNotificationIds.includes(n.id)).length;

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 dark:border-slate-800 my-auto space-y-4 modal-animate-in max-h-[85vh] flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🔔</span>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base font-heading">Notificaciones</h3>
              <p class="text-[11px] text-gray-400">${unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${unreadCount > 0 ? `
              <button onclick="NotificationsModule.markAllAsRead()" class="text-xs text-pink-600 dark:text-pink-400 hover:underline font-bold px-2 py-1 cursor-pointer">
                Marcar leídas
              </button>
            ` : ''}
            <button onclick="NotificationsModule.closeCenter()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-xl transition cursor-pointer">✕</button>
          </div>
        </div>

        <!-- Lista de Notificaciones -->
        <div class="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
          ${this.cloudNotifications.length === 0 ? `
            <div class="py-12 text-center text-gray-400 space-y-2">
              <span class="text-4xl block">🔕</span>
              <p class="text-xs font-semibold">No tienes notificaciones por el momento</p>
              <p class="text-[11px] text-gray-400">Aquí verás avisos del sistema, promociones y alertas.</p>
            </div>
          ` : this.cloudNotifications.map(n => {
            const isRead = this.readNotificationIds.includes(n.id);
            const typeIcons = {
              promo: '🎁',
              membership: '👑',
              alert: '🚨',
              order: '🎂',
              system: '🔔'
            };
            const icon = typeIcons[n.type] || '🔔';
            const timeStr = n.createdAt ? this.formatRelativeTime(n.createdAt) : 'Reciente';

            return `
              <div 
                onclick="NotificationsModule.handleNotifClick('${n.id}', '${n.actionTab || ''}')"
                class="p-3.5 rounded-2xl border transition-all cursor-pointer ${isRead ? 'bg-gray-50/70 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-300' : 'bg-pink-50/60 dark:bg-pink-950/20 border-pink-200/80 dark:border-pink-900/50 text-gray-900 dark:text-white shadow-2xs'}"
              >
                <div class="flex items-start gap-2.5">
                  <span class="text-lg shrink-0 mt-0.5">${icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <h4 class="font-extrabold text-xs truncate ${isRead ? 'text-gray-700 dark:text-gray-300' : 'text-pink-600 dark:text-pink-400'}">${n.title}</h4>
                      <span class="text-[10px] text-gray-400 whitespace-nowrap">${timeStr}</span>
                    </div>
                    <p class="text-[11px] leading-relaxed mt-0.5 opacity-90">${n.message}</p>
                    ${n.actionTab ? `
                      <span class="inline-block mt-1.5 text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/80 px-2 py-0.5 rounded-md">
                        Ver sección →
                      </span>
                    ` : ''}
                  </div>
                  ${!isRead ? `<span class="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-1"></span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button 
            onclick="NotificationsModule.requestPermission()" 
            class="text-[11px] text-gray-500 hover:text-pink-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>⚙️</span> <span>${Notification.permission === 'granted' ? 'Notificaciones activadas' : 'Activar avisos en el celular'}</span>
          </button>
          <button 
            onclick="NotificationsModule.closeCenter()" 
            class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeCenter() {
    const modal = document.getElementById('notifications-center-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  handleNotifClick(notifId, actionTab) {
    this.markAsRead(notifId);
    if (actionTab && typeof App !== 'undefined' && App.switchTab) {
      this.closeCenter();
      App.switchTab(actionTab);
    }
  },

  markAsRead(notifId) {
    if (!this.readNotificationIds.includes(notifId)) {
      this.readNotificationIds.push(notifId);
      localStorage.setItem('cakekulator_read_notifs', JSON.stringify(this.readNotificationIds));
      this.updateBadgeCount();
      const modal = document.getElementById('notifications-center-modal');
      if (modal && !modal.classList.contains('hidden')) {
        this.openCenter();
      }
    }
  },

  markAllAsRead() {
    this.readNotificationIds = this.cloudNotifications.map(n => n.id);
    localStorage.setItem('cakekulator_read_notifs', JSON.stringify(this.readNotificationIds));
    this.updateBadgeCount();
    this.openCenter();
  },

  formatRelativeTime(createdAt) {
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `hace ${diffMin}m`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `hace ${diffDays}d`;
    } catch (e) {
      return '';
    }
  }
};

// Inicializar módulo al cargar el script
window.NotificationsModule = NotificationsModule;
