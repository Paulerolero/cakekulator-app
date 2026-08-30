// ==========================================
// Cakekulator - Capa de Datos y Cálculos Base
// ==========================================

const DB_KEYS = {
  SETTINGS: 'cakekulator_settings',
  INGREDIENTS: 'cakekulator_ingredients',
  RECIPES: 'cakekulator_recipes',
  QUOTES: 'cakekulator_quotes',
  CUSTOMERS: 'cakekulator_customers',
  MARKET_STORES: 'cakekulator_market_stores',
  PRICE_HISTORY: 'cakekulator_price_history'
};

const LEGACY_DB_KEYS = {
  SETTINGS: 'dulcecalculo_settings',
  INGREDIENTS: 'dulcecalculo_ingredients',
  RECIPES: 'dulcecalculo_recipes',
  QUOTES: 'dulcecalculo_quotes',
  CUSTOMERS: 'dulcecalculo_customers',
  MARKET_STORES: 'dulcecalculo_market_stores'
};

const DB = {
  // Inicialización
  init() {
    // Migración transparente de datos anteriores
    Object.keys(DB_KEYS).forEach(k => {
      const legacyKey = LEGACY_DB_KEYS[k];
      const newKey = DB_KEYS[k];
      if (!localStorage.getItem(newKey) && localStorage.getItem(legacyKey)) {
        localStorage.setItem(newKey, localStorage.getItem(legacyKey));
      }
    });

    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    
    // Cargar o enriquecer ingredientes con insumos de cabina
    if (!localStorage.getItem(DB_KEYS.INGREDIENTS)) {
      const allInitialIngs = [...DEFAULT_INGREDIENTS, ...(typeof DEFAULT_SERVICE_INGREDIENTS !== 'undefined' ? DEFAULT_SERVICE_INGREDIENTS : [])];
      this.saveIngredients(allInitialIngs);
    } else {
      // Si ya existen ingredientes pero faltan los de servicios, incorporarlos
      if (typeof DEFAULT_SERVICE_INGREDIENTS !== 'undefined') {
        const currentIngs = this.getIngredients();
        const hasServices = currentIngs.some(i => i.itemType === 'service');
        if (!hasServices) {
          this.saveIngredients([...currentIngs, ...DEFAULT_SERVICE_INGREDIENTS]);
        }
      }
    }

    // Cargar o enriquecer recetas con protocolos de servicios
    if (!localStorage.getItem(DB_KEYS.RECIPES)) {
      const allInitialRecs = [...DEFAULT_RECIPES, ...(typeof DEFAULT_SERVICE_RECIPES !== 'undefined' ? DEFAULT_SERVICE_RECIPES : [])];
      this.saveRecipes(allInitialRecs);
    } else {
      // Si ya existen recetas pero faltan servicios, incorporarlos
      if (typeof DEFAULT_SERVICE_RECIPES !== 'undefined') {
        const currentRecs = this.getRecipes();
        const hasServices = currentRecs.some(r => r.itemType === 'service' || ['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type));
        if (!hasServices) {
          this.saveRecipes([...currentRecs, ...DEFAULT_SERVICE_RECIPES]);
        }
      }
    }

    if (!localStorage.getItem(DB_KEYS.QUOTES)) {
      this.saveQuotes(DEFAULT_QUOTES);
    }
    if (!localStorage.getItem(DB_KEYS.CUSTOMERS) && typeof DEFAULT_CUSTOMERS !== 'undefined') {
      this.saveCustomers(DEFAULT_CUSTOMERS);
    }
    if (!localStorage.getItem(DB_KEYS.MARKET_STORES) && typeof DEFAULT_MARKET_STORES !== 'undefined') {
      this.saveMarketStores(DEFAULT_MARKET_STORES);
    }
  },

  // Variables de Estado de Sincronización en la Nube
  activeListeners: [],
  periodicSyncInterval: null,
  lastSyncTimestamp: null,
  isSavingLocally: false,

  // Sincronización en la Nube (Cloud Firestore) con detección en tiempo real
  async syncDocumentToCloud(collectionName, data) {
    if (typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured && FirebaseService.db && typeof AuthModule !== 'undefined' && AuthModule.currentUser) {
      try {
        const uid = AuthModule.currentUser.uid;
        this.isSavingLocally = true;

        if (AuthModule && AuthModule.updateSyncStatus) {
          AuthModule.updateSyncStatus('syncing', 'Guardando cambios...');
        }

        // Convertir datos para asegurar que no contengan objetos no serializables
        const cleanData = JSON.parse(JSON.stringify(data));
        const now = Date.now();

        await FirebaseService.db.collection('users').doc(uid).collection('data').doc(collectionName).set({
          data: cleanData,
          updatedAt: now
        }, { merge: true });

        this.lastSyncTimestamp = now;
        console.log(`☁️ Sincronizado en Firestore: ${collectionName}`);

        setTimeout(() => {
          this.isSavingLocally = false;
        }, 800);

        if (AuthModule && AuthModule.updateSyncStatus) {
          AuthModule.updateSyncStatus('synced', 'Sincronizado');
        }
      } catch (err) {
        this.isSavingLocally = false;
        console.error(`❌ Error al sincronizar ${collectionName} en Firestore:`, err);
        if (AuthModule && AuthModule.updateSyncStatus) {
          AuthModule.updateSyncStatus('error', 'Error al sincronizar');
        }
        if (err.code === 'permission-denied') {
          console.error('🚨 Permiso denegado en Firestore: Revisa las Reglas de Seguridad en Firebase Console.');
        }
      }
    } else {
      console.log(`ℹ️ ${collectionName} guardado en almacenamiento local.`);
    }
  },

  // Iniciar conexión y sincronización en tiempo real continua con Firestore
  async initCloudSync(uid) {
    if (typeof FirebaseService === 'undefined' || !FirebaseService.db) return;
    try {
      console.log('🔄 Iniciando sincronización en tiempo real para usuario:', uid);
      if (AuthModule && AuthModule.updateSyncStatus) {
        AuthModule.updateSyncStatus('syncing', 'Conectando con Firestore...');
      }

      const userDocRef = FirebaseService.db.collection('users').doc(uid).collection('data');

      // Primera verificación inicial de datos en la nube
      const [settingsDoc, ingDoc, recDoc, quoteDoc, custDoc, storeDoc] = await Promise.all([
        userDocRef.doc('settings').get(),
        userDocRef.doc('ingredients').get(),
        userDocRef.doc('recipes').get(),
        userDocRef.doc('quotes').get(),
        userDocRef.doc('customers').get(),
        userDocRef.doc('market_stores').get()
      ]);

      const hasCloudData = (settingsDoc.exists && settingsDoc.data()?.data) ||
        (ingDoc.exists && ingDoc.data()?.data) ||
        (recDoc.exists && recDoc.data()?.data) ||
        (quoteDoc.exists && quoteDoc.data()?.data) ||
        (custDoc.exists && custDoc.data()?.data) ||
        (storeDoc.exists && storeDoc.data()?.data);

      if (settingsDoc.exists && settingsDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settingsDoc.data().data));
      }
      if (ingDoc.exists && ingDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.INGREDIENTS, JSON.stringify(ingDoc.data().data));
      }
      if (recDoc.exists && recDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.RECIPES, JSON.stringify(recDoc.data().data));
      }
      if (quoteDoc.exists && quoteDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.QUOTES, JSON.stringify(quoteDoc.data().data));
      }
      if (custDoc.exists && custDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(custDoc.data().data));
      }
      if (storeDoc.exists && storeDoc.data()?.data) {
        localStorage.setItem(DB_KEYS.MARKET_STORES, JSON.stringify(storeDoc.data().data));
      }

      this.lastSyncTimestamp = Date.now();

      // Si es primera vez y no hay datos en la nube pero sí locales, respaldarlos de inmediato
      if (!hasCloudData) {
        console.log('🚀 Primera sesión: Respaldando datos locales en la nube Firestore...');
        await this.pushLocalToCloud(uid);
      }

      // Activar Escucha en Tiempo Real (Listeners onSnapshot)
      this.startRealtimeListeners(uid);

      // Activar Comprobación Periódica en Segundo Plano (cada 20 segundos)
      this.startPeriodicSync(uid, 20000);

      if (AuthModule && AuthModule.updateSyncStatus) {
        AuthModule.updateSyncStatus('synced', 'Sincronizado en tiempo real');
      }

      if (typeof App !== 'undefined' && App.renderCurrentTab) {
        App.renderCurrentTab(true);
      }
    } catch (error) {
      console.error('Error en initCloudSync:', error);
      if (AuthModule && AuthModule.updateSyncStatus) {
        AuthModule.updateSyncStatus('error', 'Error de conexión');
      }
      throw error;
    }
  },

  // Escucha activa de cambios en Firestore en vivo (onSnapshot)
  startRealtimeListeners(uid) {
    if (typeof FirebaseService === 'undefined' || !FirebaseService.db) return;
    this.stopRealtimeListeners();

    const collections = [
      { name: 'settings', key: DB_KEYS.SETTINGS },
      { name: 'ingredients', key: DB_KEYS.INGREDIENTS },
      { name: 'recipes', key: DB_KEYS.RECIPES },
      { name: 'quotes', key: DB_KEYS.QUOTES },
      { name: 'customers', key: DB_KEYS.CUSTOMERS },
      { name: 'market_stores', key: DB_KEYS.MARKET_STORES },
      { name: 'price_history', key: DB_KEYS.PRICE_HISTORY }
    ];

    const userDocRef = FirebaseService.db.collection('users').doc(uid).collection('data');

    collections.forEach(({ name, key }) => {
      try {
        const unsubscribe = userDocRef.doc(name).onSnapshot(docSnapshot => {
          // Si estamos guardando localmente en este milisegundo, ignorar el rebote
          if (this.isSavingLocally) return;

          if (docSnapshot.exists) {
            const remoteData = docSnapshot.data()?.data;
            const remoteUpdatedAt = docSnapshot.data()?.updatedAt || 0;

            if (remoteData) {
              const currentLocalStr = localStorage.getItem(key);
              const remoteStr = JSON.stringify(remoteData);

              // Si hay cambios reales que vienen del servidor/otro dispositivo
              if (currentLocalStr !== remoteStr) {
                console.log(`⚡ Cambio en vivo detectado en Firestore para [${name}], actualizando localmente...`);
                localStorage.setItem(key, remoteStr);
                this.lastSyncTimestamp = Date.now();

                // No interrumpir si el usuario está escribiendo en un input activo
                const activeEl = document.activeElement;
                const isUserTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

                if (!isUserTyping && typeof App !== 'undefined' && App.renderCurrentTab) {
                  App.renderCurrentTab(true);
                }

                if (AuthModule && AuthModule.updateSyncStatus) {
                  AuthModule.updateSyncStatus('synced', 'Actualizado desde la nube');
                }
              }
            }
          }
        }, err => {
          console.warn(`Aviso en listener de Firestore [${name}]:`, err);
        });

        this.activeListeners.push(unsubscribe);
      } catch (e) {
        console.error(`Error configurando listener de ${name}:`, e);
      }
    });

    console.log(`📡 ${this.activeListeners.length} Listeners de Firestore en tiempo real activos.`);
  },

  // Detener listeners en tiempo real
  stopRealtimeListeners() {
    if (this.activeListeners && this.activeListeners.length) {
      this.activeListeners.forEach(unsub => {
        try { if (typeof unsub === 'function') unsub(); } catch (e) { }
      });
      this.activeListeners = [];
      console.log('🛑 Listeners de Firestore detenidos.');
    }
  },

  // Sincronización periódica automática (Heartbeat en segundo plano)
  startPeriodicSync(uid, intervalMs = 20000) {
    this.stopPeriodicSync();

    this.periodicSyncInterval = setInterval(async () => {
      if (!AuthModule || !AuthModule.currentUser || !navigator.onLine) return;

      try {
        // Actualizar etiqueta de estado
        if (AuthModule && AuthModule.updateSyncStatus && AuthModule.syncStatus === 'synced') {
          AuthModule.renderAuthUI();
        }
      } catch (e) {
        console.warn('Chequeo periódico de sincronización:', e);
      }
    }, intervalMs);
  },

  stopPeriodicSync() {
    if (this.periodicSyncInterval) {
      clearInterval(this.periodicSyncInterval);
      this.periodicSyncInterval = null;
    }
  },

  async pushLocalToCloud(uid) {
    if (typeof FirebaseService === 'undefined' || !FirebaseService.db) return;
    const userDocRef = FirebaseService.db.collection('users').doc(uid).collection('data');
    const settings = this.getSettings();
    const ingredients = this.getIngredients();
    const recipes = this.getRecipes();
    const quotes = this.getQuotes();
    const customers = this.getCustomers();
    const marketStores = this.getMarketStores();
    const priceHistory = this.getPriceHistory();
    const now = Date.now();

    await Promise.all([
      userDocRef.doc('settings').set({ data: settings, updatedAt: now }),
      userDocRef.doc('ingredients').set({ data: ingredients, updatedAt: now }),
      userDocRef.doc('recipes').set({ data: recipes, updatedAt: now }),
      userDocRef.doc('quotes').set({ data: quotes, updatedAt: now }),
      userDocRef.doc('customers').set({ data: customers, updatedAt: now }),
      userDocRef.doc('market_stores').set({ data: marketStores, updatedAt: now }),
      userDocRef.doc('price_history').set({ data: priceHistory, updatedAt: now })
    ]);
    this.lastSyncTimestamp = now;
    console.log('✅ Todos los datos locales respaldados en Firestore.');
  },

  async pullCloudToLocal(uid) {
    return this.initCloudSync(uid);
  },

  // Limpiar datos de sesión al cerrar sesión
  clearSessionData() {
    this.stopRealtimeListeners();
    this.stopPeriodicSync();
    this.lastSyncTimestamp = null;
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.removeItem(DB_KEYS.INGREDIENTS);
    localStorage.removeItem(DB_KEYS.RECIPES);
    localStorage.removeItem(DB_KEYS.QUOTES);
    localStorage.removeItem(DB_KEYS.CUSTOMERS);
    localStorage.removeItem(DB_KEYS.MARKET_STORES);
    this.init();
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(DB_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error al cargar settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    this.syncDocumentToCloud('settings', settings);
  },

  // Tiendas del Radar de Ofertas (Supermercados y Distribuidoras)
  getMarketStores() {
    try {
      const data = localStorage.getItem(DB_KEYS.MARKET_STORES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return typeof DEFAULT_MARKET_STORES !== 'undefined' ? DEFAULT_MARKET_STORES : [];
    } catch (e) {
      console.error('Error al cargar tiendas del radar:', e);
      return typeof DEFAULT_MARKET_STORES !== 'undefined' ? DEFAULT_MARKET_STORES : [];
    }
  },

  saveMarketStores(stores) {
    localStorage.setItem(DB_KEYS.MARKET_STORES, JSON.stringify(stores));
    this.syncDocumentToCloud('market_stores', stores);
  },

  addMarketStore(store) {
    const stores = this.getMarketStores();
    if (!store.id) store.id = 'store_' + Date.now();
    stores.push(store);
    this.saveMarketStores(stores);
    return store;
  },

  updateMarketStore(id, updates) {
    const stores = this.getMarketStores();
    const idx = stores.findIndex(s => s.id === id);
    if (idx !== -1) {
      stores[idx] = { ...stores[idx], ...updates };
      this.saveMarketStores(stores);
      return stores[idx];
    }
    return null;
  },

  deleteMarketStore(id) {
    let stores = this.getMarketStores();
    stores = stores.filter(s => s.id !== id);
    this.saveMarketStores(stores);
    return true;
  },

  resetMarketStores() {
    const defaults = typeof DEFAULT_MARKET_STORES !== 'undefined' ? DEFAULT_MARKET_STORES : [];
    this.saveMarketStores(defaults);
    return defaults;
  },

  // Insumos / Ingredientes
  getIngredients() {
    try {
      const data = localStorage.getItem(DB_KEYS.INGREDIENTS);
      return data ? JSON.parse(data) : DEFAULT_INGREDIENTS;
    } catch (e) {
      console.error('Error al cargar ingredientes:', e);
      return [];
    }
  },

  getIngredientById(id) {
    const list = this.getIngredients();
    return list.find(item => item.id === id) || null;
  },

  saveIngredients(ingredients) {
    localStorage.setItem(DB_KEYS.INGREDIENTS, JSON.stringify(ingredients));
    this.syncDocumentToCloud('ingredients', ingredients);
  },

  addIngredient(ingredient) {
    const list = this.getIngredients();
    if (!ingredient.id) {
      ingredient.id = 'ing_' + Date.now();
    }
    list.unshift(ingredient);
    this.saveIngredients(list);
    return ingredient;
  },

  updateIngredient(id, updatedData) {
    const list = this.getIngredients();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      const oldItem = list[index];
      // Registrar cambio de precio automáticamente para el evolutivo de finanzas
      if (updatedData.packagePrice !== undefined && Number(updatedData.packagePrice) !== Number(oldItem.packagePrice)) {
        this.recordPriceChange(id, oldItem.name, Number(oldItem.packagePrice), Number(updatedData.packagePrice), oldItem.packageQty, oldItem.packageUnit);
      }
      list[index] = { ...oldItem, ...updatedData };
      this.saveIngredients(list);
      return list[index];
    }
    return null;
  },

  deleteIngredient(id) {
    let list = this.getIngredients();
    list = list.filter(item => item.id !== id);
    this.saveIngredients(list);
  },

  // Historial de Precios de Insumos (para el Panel de Finanzas)
  getPriceHistory() {
    try {
      const data = localStorage.getItem(DB_KEYS.PRICE_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al cargar historial de precios:', e);
      return [];
    }
  },

  savePriceHistory(history) {
    localStorage.setItem(DB_KEYS.PRICE_HISTORY, JSON.stringify(history));
    this.syncDocumentToCloud('price_history', history);
  },

  recordPriceChange(ingredientId, ingredientName, oldPrice, newPrice, packageQty, packageUnit) {
    const history = this.getPriceHistory();
    history.push({
      ingredientId,
      ingredientName: ingredientName || 'Insumo',
      oldPrice,
      newPrice,
      packageQty: packageQty || 0,
      packageUnit: packageUnit || 'g',
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
    // Limitar a los últimos 2000 registros
    if (history.length > 2000) history.splice(0, history.length - 2000);
    this.savePriceHistory(history);
  },

  // Recetas / Fichas Técnicas
  getRecipes() {
    try {
      const data = localStorage.getItem(DB_KEYS.RECIPES);
      return data ? JSON.parse(data) : DEFAULT_RECIPES;
    } catch (e) {
      console.error('Error al cargar recetas:', e);
      return [];
    }
  },

  getRecipeById(id) {
    const list = this.getRecipes();
    return list.find(item => item.id === id) || null;
  },

  saveRecipes(recipes) {
    localStorage.setItem(DB_KEYS.RECIPES, JSON.stringify(recipes));
    this.syncDocumentToCloud('recipes', recipes);
  },

  addRecipe(recipe) {
    const list = this.getRecipes();
    if (!recipe.id) {
      recipe.id = 'rec_' + Date.now();
    }
    list.unshift(recipe);
    this.saveRecipes(list);
    return recipe;
  },

  updateRecipe(id, updatedData) {
    const list = this.getRecipes();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveRecipes(list);
      return list[index];
    }
    return null;
  },

  deleteRecipe(id) {
    let list = this.getRecipes();
    list = list.filter(item => item.id !== id);
    this.saveRecipes(list);
  },

  duplicateRecipe(id) {
    const original = this.getRecipeById(id);
    if (!original) return null;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'rec_' + Date.now();
    copy.name = `${original.name} (Copia)`;
    return this.addRecipe(copy);
  },

  // Cotizaciones / Presupuestos
  getQuotes() {
    try {
      const data = localStorage.getItem(DB_KEYS.QUOTES);
      return data ? JSON.parse(data) : DEFAULT_QUOTES;
    } catch (e) {
      console.error('Error al cargar cotizaciones:', e);
      return [];
    }
  },

  getQuoteById(id) {
    const list = this.getQuotes();
    return list.find(item => item.id === id) || null;
  },

  saveQuotes(quotes) {
    localStorage.setItem(DB_KEYS.QUOTES, JSON.stringify(quotes));
    this.syncDocumentToCloud('quotes', quotes);
  },

  addQuote(quote) {
    const list = this.getQuotes();
    if (!quote.id) {
      quote.id = 'quote_' + Date.now();
    }
    if (!quote.code) {
      quote.code = 'COT-' + String(list.length + 1).padStart(3, '0');
    }
    if (!quote.createdAt) {
      quote.createdAt = new Date().toISOString();
    }
    list.unshift(quote);
    this.saveQuotes(list);
    return quote;
  },

  updateQuote(id, updatedData) {
    const list = this.getQuotes();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveQuotes(list);
      return list[index];
    }
    return null;
  },

  deleteQuote(id) {
    let list = this.getQuotes();
    list = list.filter(item => item.id !== id);
    this.saveQuotes(list);
  },

  // ==========================================
  // Clientes & Fechas Especiales (CRM Pastelero)
  // ==========================================
  getCustomers() {
    try {
      const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      return typeof DEFAULT_CUSTOMERS !== 'undefined' ? DEFAULT_CUSTOMERS : [];
    } catch (e) {
      console.error('Error al cargar clientes:', e);
      return typeof DEFAULT_CUSTOMERS !== 'undefined' ? DEFAULT_CUSTOMERS : [];
    }
  },

  getCustomerById(id) {
    const list = this.getCustomers();
    return list.find(item => item.id === id) || null;
  },

  saveCustomers(customers) {
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.syncDocumentToCloud('customers', customers);
  },

  addCustomer(customer) {
    const list = this.getCustomers();
    if (!customer.id) {
      customer.id = 'cust_' + Date.now();
    }
    if (!customer.createdAt) {
      customer.createdAt = new Date().toISOString();
    }
    if (customer.isFavorite === undefined) {
      customer.isFavorite = false;
    }
    if (!Array.isArray(customer.specialDates)) {
      customer.specialDates = [];
    }
    if (!Array.isArray(customer.purchases)) {
      customer.purchases = [];
    }
    list.unshift(customer);
    this.saveCustomers(list);
    return customer;
  },

  updateCustomer(id, updatedData) {
    const list = this.getCustomers();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.saveCustomers(list);
      return list[index];
    }
    return null;
  },

  deleteCustomer(id) {
    let list = this.getCustomers();
    list = list.filter(item => item.id !== id);
    this.saveCustomers(list);
    return true;
  },

  toggleCustomerFavorite(id) {
    const list = this.getCustomers();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index].isFavorite = !list[index].isFavorite;
      this.saveCustomers(list);
      return list[index].isFavorite;
    }
    return false;
  },

  addCustomerSpecialDate(customerId, specialDate) {
    const list = this.getCustomers();
    const customer = list.find(item => item.id === customerId);
    if (customer) {
      if (!customer.specialDates) customer.specialDates = [];
      if (!specialDate.id) specialDate.id = 'sd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      customer.specialDates.push(specialDate);
      this.saveCustomers(list);
      return specialDate;
    }
    return null;
  },

  deleteCustomerSpecialDate(customerId, specialDateId) {
    const list = this.getCustomers();
    const customer = list.find(item => item.id === customerId);
    if (customer && customer.specialDates) {
      customer.specialDates = customer.specialDates.filter(sd => sd.id !== specialDateId);
      this.saveCustomers(list);
      return true;
    }
    return false;
  },

  addCustomerPurchase(customerId, purchase) {
    const list = this.getCustomers();
    const customer = list.find(item => item.id === customerId);
    if (customer) {
      if (!customer.purchases) customer.purchases = [];
      if (!purchase.id) purchase.id = 'pur_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      if (!purchase.date) purchase.date = new Date().toISOString().split('T')[0];
      customer.purchases.unshift(purchase);
      this.saveCustomers(list);
      return purchase;
    }
    return null;
  },

  deleteCustomerPurchase(customerId, purchaseId) {
    const list = this.getCustomers();
    const customer = list.find(item => item.id === customerId);
    if (customer && customer.purchases) {
      customer.purchases = customer.purchases.filter(p => p.id !== purchaseId);
      this.saveCustomers(list);
      return true;
    }
    return false;
  },

  findCustomerByPhoneOrName(phone, name) {
    const list = this.getCustomers();
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const cleanName = name ? String(name).trim().toLowerCase() : '';

    return list.find(c => {
      if (cleanPhone && c.phone) {
        const cPhone = String(c.phone).replace(/\D/g, '');
        if (cPhone && (cPhone.includes(cleanPhone) || cleanPhone.includes(cPhone))) {
          return true;
        }
      }
      if (cleanName && c.name) {
        if (c.name.trim().toLowerCase() === cleanName) return true;
      }
      return false;
    }) || null;
  },

  // Exportar / Importar / Reset
  exportAllData() {
    return JSON.stringify({
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      ingredients: this.getIngredients(),
      recipes: this.getRecipes(),
      quotes: this.getQuotes(),
      customers: this.getCustomers(),
      marketStores: this.getMarketStores()
    }, null, 2);
  },

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.ingredients) this.saveIngredients(data.ingredients);
      if (data.recipes) this.saveRecipes(data.recipes);
      if (data.quotes) this.saveQuotes(data.quotes);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.marketStores) this.saveMarketStores(data.marketStores);
      return true;
    } catch (e) {
      console.error('Error importando datos:', e);
      return false;
    }
  },

  resetAllData() {
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.removeItem(DB_KEYS.INGREDIENTS);
    localStorage.removeItem(DB_KEYS.RECIPES);
    localStorage.removeItem(DB_KEYS.QUOTES);
    localStorage.removeItem(DB_KEYS.CUSTOMERS);
    localStorage.removeItem(DB_KEYS.MARKET_STORES);
    this.init();
  }
};

// ==========================================
// Motor de Cálculos y Conversiones de Unidades
// ==========================================

const Calculator = {
  // Factores de conversión a unidad estándar base (g, ml, u)
  unitFactors: {
    // Masa -> base: g
    'g': { base: 'g', factor: 1 },
    'kg': { base: 'g', factor: 1000 },
    'mg': { base: 'g', factor: 0.001 },
    'oz': { base: 'g', factor: 28.3495 },
    'lb': { base: 'g', factor: 453.592 },

    // Volumen -> base: ml
    'ml': { base: 'ml', factor: 1 },
    'cc': { base: 'ml', factor: 1 },
    'l': { base: 'ml', factor: 1000 },
    'L': { base: 'ml', factor: 1000 },
    'tbsp': { base: 'ml', factor: 15 },    // Cucharada
    'cda': { base: 'ml', factor: 15 },
    'tsp': { base: 'ml', factor: 5 },      // Cucharadita
    'cdta': { base: 'ml', factor: 5 },
    'cup': { base: 'ml', factor: 240 },    // Taza repostera
    'taza': { base: 'ml', factor: 240 },

    // Unidades / Conteo -> base: u
    'u': { base: 'u', factor: 1 },
    'un': { base: 'u', factor: 1 },
    'unidad': { base: 'u', factor: 1 },
    'docena': { base: 'u', factor: 12 },
    'par': { base: 'u', factor: 2 }
  },

  // Conversión entre unidades compatibles
  convertQuantity(qty, fromUnit, toUnit) {
    if (!qty || isNaN(qty)) return 0;
    if (fromUnit === toUnit) return Number(qty);

    const fromMeta = this.unitFactors[fromUnit] || { base: fromUnit, factor: 1 };
    const toMeta = this.unitFactors[toUnit] || { base: toUnit, factor: 1 };

    // Si pertenecen a la misma familia base (ej: g y kg, o ml y L)
    if (fromMeta.base === toMeta.base) {
      const baseValue = Number(qty) * fromMeta.factor;
      return baseValue / toMeta.factor;
    }

    // Si no son directamente convertibles (ej. g a ml sin densidad), asumimos densidad agua 1g = 1ml para líquidos/harinas comunes
    if ((fromMeta.base === 'g' && toMeta.base === 'ml') || (fromMeta.base === 'ml' && toMeta.base === 'g')) {
      const baseValue = Number(qty) * fromMeta.factor;
      return baseValue / toMeta.factor;
    }

    return Number(qty);
  },

  // Calcula el costo de un insumo según cantidad y unidad requerida
  getIngredientItemCost(ingredient, requiredQty, requiredUnit) {
    if (!ingredient || !ingredient.packagePrice || !ingredient.packageQty) return 0;

    const waste = Number(ingredient.yieldWastePercent || 0);
    const effectivePackageQty = Number(ingredient.packageQty) * (1 - waste / 100);

    if (effectivePackageQty <= 0) return 0;

    // Convertir cantidad requerida a la unidad en que se compró el insumo
    const convertedReqQty = this.convertQuantity(requiredQty, requiredUnit, ingredient.packageUnit);

    const costPerPurchaseUnit = Number(ingredient.packagePrice) / effectivePackageQty;
    return convertedReqQty * costPerPurchaseUnit;
  },

  // Calcula el costo por unidad base (por gramo, por ml, por unidad)
  getIngredientBaseUnitCost(ingredient) {
    if (!ingredient || !ingredient.packagePrice || !ingredient.packageQty) return { unitCost: 0, baseUnit: 'g' };
    const waste = Number(ingredient.yieldWastePercent || 0);
    const effectivePackageQty = Number(ingredient.packageQty) * (1 - waste / 100);
    const unitMeta = this.unitFactors[ingredient.packageUnit] || { base: ingredient.packageUnit, factor: 1 };

    const totalBaseQty = effectivePackageQty * unitMeta.factor;
    const costPerBase = totalBaseQty > 0 ? Number(ingredient.packagePrice) / totalBaseQty : 0;

    return {
      costPerBase,
      baseUnit: unitMeta.base,
      packageUnitCost: effectivePackageQty > 0 ? Number(ingredient.packagePrice) / effectivePackageQty : 0
    };
  },

  // Calcula el desglose completo de costos de una receta
  calculateRecipeFullCosts(recipe, allIngredientsMap = null) {
    if (!recipe) return null;

    if (!allIngredientsMap) {
      const ingredients = DB.getIngredients();
      allIngredientsMap = new Map(ingredients.map(i => [i.id, i]));
    }

    // 1. Costo Insumos / Ingredientes
    let ingredientsCost = 0;
    const detailedIngredients = (recipe.ingredients || []).map(item => {
      const ing = allIngredientsMap.get(item.ingredientId);
      const cost = ing ? this.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
      ingredientsCost += cost;
      return {
        ...item,
        name: ing ? ing.name : 'Insumo no encontrado',
        packagePrice: ing ? ing.packagePrice : 0,
        packageUnit: ing ? ing.packageUnit : '',
        cost
      };
    });

    // 2. Costo Empaque
    let packagingCost = 0;
    const detailedPackaging = (recipe.packaging || []).map(item => {
      const ing = allIngredientsMap.get(item.ingredientId);
      const cost = ing ? this.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
      packagingCost += cost;
      return {
        ...item,
        name: ing ? ing.name : 'Empaque no encontrado',
        packagePrice: ing ? ing.packagePrice : 0,
        packageUnit: ing ? ing.packageUnit : '',
        cost
      };
    });

    // 3. Costo Mano de Obra
    const laborHours = Number(recipe.laborHours || 0);
    const laborRate = Number(recipe.laborRatePerHour || DB.getSettings().defaultHourlyRate || 4000);
    const laborCost = laborHours * laborRate;

    // 4. Costos Indirectos / Servicios (Gas, luz, agua, arriendo prorrateado)
    const overheadCost = Number(recipe.overheadCost || 0);

    // 5. Costo Total de Producción (Lote Completo)
    const totalBatchCost = ingredientsCost + packagingCost + laborCost + overheadCost;

    // 6. Rendimiento
    const yieldUnits = Math.max(1, Number(recipe.yieldUnits || 1));
    const yieldPortions = Math.max(1, Number(recipe.yieldPortions || yieldUnits));

    // 7. Costos Unitarios
    const costPerUnit = totalBatchCost / yieldUnits;
    const costPerPortion = totalBatchCost / yieldPortions;

    // Insumos + empaque base unitarios (costo primo directo)
    const directCostPerUnit = (ingredientsCost + packagingCost) / yieldUnits;
    const directCostPerPortion = (ingredientsCost + packagingCost) / yieldPortions;

    // 8. Precios Sugeridos por Margen deseado (Aproximados al valor mayor más próximo)
    const targetMargin = Number(recipe.suggestedMargin || DB.getSettings().defaultTargetMargin || 40);
    const marginFraction = targetMargin >= 100 ? 0.99 : targetMargin / 100;

    // Precio de venta = Costo / (1 - Margen)
    const rawBatchPrice = marginFraction < 1 ? totalBatchCost / (1 - marginFraction) : totalBatchCost * 2;
    const rawUnitPrice = marginFraction < 1 ? costPerUnit / (1 - marginFraction) : costPerUnit * 2;
    const rawPortionPrice = marginFraction < 1 ? costPerPortion / (1 - marginFraction) : costPerPortion * 2;

    const suggestedBatchPrice = this.roundUpTo(rawBatchPrice, 100);
    const suggestedUnitPrice = this.roundUpTo(rawUnitPrice, 100);
    const suggestedPortionPrice = this.roundUpTo(rawPortionPrice, 100);

    // Markup equivalente (% sobre el costo): (Precio - Costo) / Costo * 100
    const suggestedMarkup = totalBatchCost > 0 ? ((suggestedBatchPrice - totalBatchCost) / totalBatchCost) * 100 : 0;

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeType: recipe.type || 'units',
      yieldUnits,
      yieldPortions,
      unitName: recipe.unitName || 'unidad',

      // Costos totales lote
      ingredientsCost,
      packagingCost,
      laborCost,
      overheadCost,
      totalBatchCost,

      // Costos unitarios
      costPerUnit,
      costPerPortion,
      directCostPerUnit,
      directCostPerPortion,

      // Precios y márgenes recomendados
      targetMargin,
      suggestedMarkup,
      suggestedBatchPrice,
      suggestedUnitPrice,
      suggestedPortionPrice,

      // Listas con subtotales calculados
      detailedIngredients,
      detailedPackaging,

      // Porcentajes de incidencia sobre el costo total
      breakdownPercents: {
        ingredients: totalBatchCost > 0 ? (ingredientsCost / totalBatchCost) * 100 : 0,
        packaging: totalBatchCost > 0 ? (packagingCost / totalBatchCost) * 100 : 0,
        labor: totalBatchCost > 0 ? (laborCost / totalBatchCost) * 100 : 0,
        overhead: totalBatchCost > 0 ? (overheadCost / totalBatchCost) * 100 : 0
      }
    };
  },

  // Simulación de rentabilidad dado un precio de venta manual
  simulateSellingPrice(totalCost, sellingPrice, paymentCommissionPercent = 0) {
    const cost = Number(totalCost || 0);
    const price = Number(sellingPrice || 0);
    const commRate = Number(paymentCommissionPercent || 0) / 100;

    const commissionAmount = price * commRate;
    const netRevenue = price - commissionAmount;
    const netProfit = netRevenue - cost;

    // Margen sobre venta: (Ganancia / Precio) * 100
    const profitMargin = price > 0 ? (netProfit / price) * 100 : 0;

    // Markup sobre costo: (Ganancia / Costo) * 100
    const markup = cost > 0 ? (netProfit / cost) * 100 : 0;

    // Multiplicador de costo (ej: 2.5x)
    const costMultiplier = cost > 0 ? price / cost : 0;

    // Punto de equilibrio en unidades (si hay costos fijos)
    const breakEvenMultiplier = netProfit > 0 ? price / netProfit : 0;

    return {
      cost,
      sellingPrice: price,
      commissionPercent: paymentCommissionPercent,
      commissionAmount,
      netRevenue,
      netProfit,
      profitMargin,
      markup,
      costMultiplier,
      isProfitable: netProfit > 0,
      breakEvenMultiplier
    };
  },

  // Estimar porciones sugeridas de torta circular según diámetro de molde en cm
  estimateCakePortionsByDiameter(diameterCm) {
    const d = Number(diameterCm) || 18;
    if (d <= 14) return 8;
    if (d <= 16) return 12;
    if (d <= 18) return 16;
    if (d <= 20) return 20;
    if (d <= 22) return 25;
    if (d <= 24) return 30;
    if (d <= 26) return 38;
    if (d <= 28) return 45;
    return Math.round(Math.pow(d / 18, 2) * 16);
  },

  // Escala los ingredientes, empaques, tiempos y costos de una receta en función de porciones o diámetro de molde
  scaleRecipe(recipe, options = {}) {
    if (!recipe) return null;

    const basePortions = Math.max(1, Number(recipe.yieldPortions || recipe.yieldUnits || 1));
    let scalingFactor = 1;

    if (options.scalingFactor && options.scalingFactor > 0) {
      scalingFactor = options.scalingFactor;
    } else if (options.targetPortions && options.targetPortions > 0) {
      scalingFactor = options.targetPortions / basePortions;
    } else if (options.targetDiameterCm && options.baseDiameterCm && options.baseDiameterCm > 0) {
      // Escalado por área de molde circular: (D_meta / D_base)^2
      scalingFactor = Math.pow(options.targetDiameterCm / options.baseDiameterCm, 2);
    }

    const targetPortions = options.targetPortions || Math.max(1, Math.round(basePortions * scalingFactor));
    const targetUnits = Math.max(1, Math.round((recipe.yieldUnits || 1) * (recipe.type === 'cake' ? 1 : scalingFactor)));

    // Escalar Ingredientes
    const scaledIngredients = (recipe.ingredients || []).map(item => {
      const originalQty = Number(item.quantity || 0);
      let newQty = originalQty * scalingFactor;

      // Redondeo inteligente según unidad
      if (item.unit === 'g' || item.unit === 'ml' || item.unit === 'cc') {
        newQty = newQty >= 50 ? Math.round(newQty) : Number(newQty.toFixed(1));
      } else if (item.unit === 'u' || item.unit === 'un' || item.unit === 'unidad') {
        // Redondear unidades a enteros o medios (ej. 2.5 huevos)
        newQty = Math.round(newQty * 2) / 2;
        if (newQty < 1 && originalQty >= 1) newQty = 1;
      } else {
        newQty = Number(newQty.toFixed(2));
      }

      return {
        ...item,
        originalQuantity: originalQty,
        quantity: newQty
      };
    });

    // Escalar Empaque
    const scaledPackaging = (recipe.packaging || []).map(item => {
      let newQty = Number(item.quantity || 0);
      if (recipe.type !== 'cake') {
        newQty = Math.ceil(newQty * scalingFactor);
      }
      return {
        ...item,
        originalQuantity: Number(item.quantity || 0),
        quantity: newQty
      };
    });

    // Escalar Mano de Obra: La preparación no crece 1:1 linealmente, usamos factor de esfuerzo 0.75
    const originalLabor = Number(recipe.laborHours || 0);
    const scaledLaborHours = Number((originalLabor * Math.pow(scalingFactor, 0.75)).toFixed(2));

    // Escalar Gastos Generales
    const originalOverhead = Number(recipe.overheadCost || 0);
    const scaledOverhead = Math.round(originalOverhead * Math.pow(scalingFactor, 0.8));

    const scaledRecipe = {
      ...recipe,
      name: options.newName || (recipe.type === 'cake'
        ? `${recipe.name.replace(/\s*\(\d+\s*porc[a-zA-Z.]*\)/gi, '').replace(/\s*\(\d+\s*personas\)/gi, '').trim()} (${targetPortions} Personas)`
        : `${recipe.name} (${targetUnits} un)`),
      yieldPortions: targetPortions,
      yieldUnits: targetUnits,
      laborHours: scaledLaborHours,
      overheadCost: scaledOverhead,
      ingredients: scaledIngredients,
      packaging: scaledPackaging,
      scalingFactor: Number(scalingFactor.toFixed(4)),
      isScaledCopy: true
    };

    // Calcular costos completos de la nueva receta escalada
    const costs = this.calculateRecipeFullCosts(scaledRecipe);

    return {
      recipe: scaledRecipe,
      scalingFactor,
      basePortions,
      targetPortions,
      costs
    };
  },

  // Redondeo al valor mayor más próximo (por defecto múltiplo de 100)
  roundUpTo(value, step = 100) {
    const num = Number(value) || 0;
    if (num <= 0) return 0;
    if (num < 100) return Math.ceil(num);
    if (num < 1000) return Math.ceil(num / 50) * 50;
    return Math.ceil(num / step) * step;
  },

  // Formato de moneda
  formatCurrency(value, customSymbol = null) {
    const symbol = customSymbol || (DB.getSettings ? DB.getSettings().currencySymbol : '$');
    const num = Math.round(Number(value) || 0);
    return `${symbol} ${num.toLocaleString('es-CL')}`;
  },

  // Formato decimal con unidad
  formatDecimal(value, decimals = 1) {
    const num = Number(value) || 0;
    return num.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  }
};
