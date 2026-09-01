// ==========================================
// Cakekulator - Configuración de Firebase
// ==========================================

// INSTRUCCIONES:
// Reemplaza los siguientes valores con las credenciales de tu proyecto en Firebase Console:
// (Firebase Console > Configuración del Proyecto > General > Tus apps > Web app)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBiskv-QsWuvLtUFpwRPsHBxN8b02jB1bo",
  authDomain: "cakekulator-bd.firebaseapp.com",
  projectId: "cakekulator-bd",
  storageBucket: "cakekulator-bd.firebasestorage.app",
  messagingSenderId: "447811822569",
  appId: "1:447811822569:web:13ea8f3231a810053e2178",
  measurementId: "G-WX1N2VG9QP",
  vapidKey: ""
};

const FirebaseService = {
  app: null,
  auth: null,
  db: null,
  googleProvider: null,
  isConfigured: false,

  getConfig() {
    try {
      const savedConfig = localStorage.getItem('cakekulator_firebase_config');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (e) {
      console.warn('No se pudo leer la configuración personalizada de Firebase', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  },

  saveCustomConfig(configObj) {
    localStorage.setItem('cakekulator_firebase_config', JSON.stringify(configObj));
    window.location.reload();
  },

  resetConfig() {
    localStorage.removeItem('cakekulator_firebase_config');
    window.location.reload();
  },

  init() {
    const config = this.getConfig();

    // Comprobar si tiene claves reales y no los placeholders
    const hasRealKeys = config.apiKey && 
      !config.apiKey.includes('TU_API_KEY') && 
      !config.projectId.includes('tu-proyecto');

    if (!hasRealKeys) {
      console.info('ℹ️ Firebase está en modo local (sin credenciales de nube configuradas).');
      this.isConfigured = false;
      return false;
    }

    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(config);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        // Habilitar persistencia offline en Firestore si está disponible
        try {
          this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
            if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
              // Múltiples pestañas abiertas o no soportado por navegador
            }
          });
        } catch (e) {}

        this.googleProvider = new firebase.auth.GoogleAuthProvider();
        this.googleProvider.setCustomParameters({ prompt: 'select_account' });

        // Inicializar Firebase Cloud Messaging si el navegador lo soporta
        if (typeof firebase.messaging === 'function' && firebase.messaging.isSupported()) {
          try {
            this.messaging = firebase.messaging();
            console.log('✅ Firebase Messaging (FCM) disponible');
          } catch (e) {
            console.warn('⚠️ No se pudo inicializar Firebase Messaging:', e);
          }
        }

        this.isConfigured = true;
        console.log('✅ Firebase inicializado correctamente');
        return true;
      } else {
        console.warn('⚠️ SDK de Firebase no encontrado.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error al inicializar Firebase:', error);
      this.isConfigured = false;
      return false;
    }
  }
};
