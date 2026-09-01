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

  isSupported() {
    return ('Notification' in window) && ('serviceWorker' in navigator);
  },

  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
  },

  async init() {
    if (!this.isSupported()) {
      console.info('ℹ️ Notificaciones Web no soportadas en este navegador.');
      return;
    }

    // Si ya tiene permiso otorgado, configurar escucha en primer plano y obtener token
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
  }
};

// Inicializar módulo al cargar el script
window.NotificationsModule = NotificationsModule;
