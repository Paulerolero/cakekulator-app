// ==========================================
// Cakekulator Cliente - Controlador Principal (UserApp)
// ==========================================

const UserApp = {
  currentTab: 'explore',
  deferredPrompt: null,

  init() {
    // Inicializar base de datos del cliente
    UserDB.init();

    // Inicializar sub-módulos
    UserOffersModule.init();
    UserRequestsModule.init();
    UserProfileModule.init();

    // Manejador de instalación PWA
    this.initPWAInstall();

    // Renderizar pestaña inicial
    this.renderExploreTab();
    this.updateBadges();

    // Escuchar búsqueda global en clientes
    const searchInput = document.getElementById('user-global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }
  },

  initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('user-pwa-install-btn');
      if (installBtn) installBtn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      const installBtn = document.getElementById('user-pwa-install-btn');
      if (installBtn) installBtn.classList.add('hidden');
      this.showToast('🎉 ¡App de Clientes instalada con éxito!');
    });
  },

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          const installBtn = document.getElementById('user-pwa-install-btn');
          if (installBtn) installBtn.classList.add('hidden');
        }
        this.deferredPrompt = null;
      });
    } else {
      alert('Para instalar en iPhone/iPad: Toca el botón Compartir 📤 en Safari y selecciona "Agregar a pantalla de inicio".\n\nEn Android/PC: Toca el menú de 3 puntos ⋮ en tu navegador y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // Ocultar todas las vistas
    const views = ['explore-view', 'map-view', 'requests-view', 'offers-view', 'profile-view'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    // Mostrar vista seleccionada
    const target = document.getElementById(`${tabName}-view`);
    if (target) {
      target.classList.remove('hidden');
    }

    // Actualizar botones de navegación inferior
    document.querySelectorAll('.user-nav-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isMatch);
    });

    // Acciones específicas por pestaña
    if (tabName === 'explore') {
      this.renderExploreTab();
    } else if (tabName === 'map') {
      setTimeout(() => UserMapModule.init(), 100);
    } else if (tabName === 'requests') {
      UserRequestsModule.renderRequests();
    } else if (tabName === 'offers') {
      UserOffersModule.renderOffers();
    } else if (tabName === 'profile') {
      UserProfileModule.renderProfileView();
    }

    // Scroll al tope
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderExploreTab() {
    const bakeriesContainer = document.getElementById('explore-bakeries-grid');
    if (!bakeriesContainer) return;

    const bakeries = UserDB.getBakeries();
    const offers = UserDB.getOffers();
    const favorites = UserDB.getFavorites();

    bakeriesContainer.innerHTML = bakeries.map(b => {
      const isFav = favorites.includes(b.id);
      const hasOffer = offers.some(o => o.bakeryId === b.id);

      return `
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition touch-card">
          <!-- Imagen de Portada -->
          <div class="relative h-36 w-full bg-cover bg-center cursor-pointer" style="background-image: url('${b.image}');" onclick="UserApp.showBakeryDetail('${b.id}')">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <!-- Botón Favorito -->
            <button onclick="event.stopPropagation(); UserApp.toggleFavorite('${b.id}');" class="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-rose-500 shadow-md text-xs cursor-pointer hover:scale-110 transition">
              ${isFav ? '❤️' : '🤍'}
            </button>

            <!-- Categoría Tag -->
            <div class="absolute top-3 left-3 bg-black/50 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
              ${b.category}
            </div>

            <!-- Título & Chef -->
            <div class="absolute bottom-2.5 left-3 right-3">
              <h3 class="font-black text-base text-white leading-tight drop-shadow-sm">${b.name}</h3>
              <p class="text-[10px] text-pink-200">${b.chef} • 📍 ${b.commune}</p>
            </div>
          </div>

          <!-- Contenido -->
          <div class="p-3.5 space-y-2.5">
            <!-- Calificación & Tiempo -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-amber-500 font-bold flex items-center gap-1">
                ⭐ ${b.rating} <span class="text-[10px] text-gray-400 font-normal">(${b.reviewsCount} reseñas)</span>
              </span>
              <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                🛵 Delivery disponible
              </span>
            </div>

            <!-- Especialidades -->
            <p class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
              🎂 ${b.specialties.join(' • ')}
            </p>

            ${hasOffer ? `
              <div class="p-2 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 dark:from-slate-800 dark:to-slate-800 border border-amber-200/80 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span class="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <span>⚡</span> Oferta Flash activa hoy
                </span>
                <button onclick="UserApp.switchTab('offers')" class="text-pink-600 dark:text-pink-400 font-bold text-[10px] underline">
                  Ver promo
                </button>
              </div>
            ` : ''}

            <!-- Botón WhatsApp Directo -->
            <div class="pt-1 flex gap-2">
              <a href="https://wa.me/${b.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola ' + b.name + '! Vi su perfil en Cakekulator y me gustaría hacer una consulta.')}" 
                 target="_blank"
                 class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm transition">
                <span>💬</span>
                <span>Pedir por WhatsApp</span>
              </a>
              <button onclick="UserApp.showBakeryDetail('${b.id}')" class="px-3 py-2 bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-300 font-bold text-xs rounded-xl hover:bg-pink-100 transition">
                Ver Menú
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  handleSearch(query) {
    const clean = (query || '').toLowerCase().trim();
    const bakeries = UserDB.getBakeries();
    const container = document.getElementById('explore-bakeries-grid');
    if (!container) return;

    if (!clean) {
      this.renderExploreTab();
      return;
    }

    const matched = bakeries.filter(b => 
      b.name.toLowerCase().includes(clean) ||
      b.commune.toLowerCase().includes(clean) ||
      b.category.toLowerCase().includes(clean) ||
      b.specialties.some(s => s.toLowerCase().includes(clean))
    );

    if (matched.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800">
          <p class="text-xs text-gray-500">No encontramos pastelerías que coincidan con "${query}".</p>
        </div>
      `;
      return;
    }

    // Renderizar filtrados
    const offers = UserDB.getOffers();
    const favorites = UserDB.getFavorites();

    container.innerHTML = matched.map(b => `
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100/80 dark:border-slate-800 overflow-hidden shadow-sm p-4 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${b.logo}</span>
            <div>
              <h4 class="font-bold text-sm text-gray-900 dark:text-white">${b.name}</h4>
              <p class="text-[10px] text-gray-400">📍 ${b.commune} • ⭐ ${b.rating}</p>
            </div>
          </div>
          <button onclick="UserApp.toggleFavorite('${b.id}')" class="p-1.5 text-rose-500 text-sm">
            ${favorites.includes(b.id) ? '❤️' : '🤍'}
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-300">${b.specialties.join(' • ')}</p>
        <a href="https://wa.me/${b.phone.replace(/[^0-9]/g, '')}" target="_blank" class="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1">
          💬 Contactar por WhatsApp
        </a>
      </div>
    `).join('');
  },

  toggleFavorite(bakeryId) {
    const isFav = UserDB.toggleFavorite(bakeryId);
    this.showToast(isFav ? '❤️ Guardado en tus pastelerías favoritas' : 'Eliminado de tus favoritos');
    
    // Re-renderizar pestañas
    if (this.currentTab === 'explore') this.renderExploreTab();
    if (this.currentTab === 'offers') UserOffersModule.renderOffers();
    if (this.currentTab === 'profile') UserProfileModule.renderProfileView();
    if (this.currentTab === 'map') UserMapModule.renderBakeriesOnMap();
  },

  showBakeryDetail(bakeryId) {
    const bakery = UserDB.getBakeryById(bakeryId);
    if (!bakery) return;

    const modal = document.getElementById('bakery-detail-modal');
    const content = document.getElementById('bakery-detail-content');
    if (!modal || !content) return;

    const isFav = UserDB.isFavorite(bakery.id);
    const catalog = UserDB.getBakeryCatalog(bakery.id) || [];

    content.innerHTML = `
      <div class="relative h-48 w-full bg-cover bg-center rounded-3xl overflow-hidden" style="background-image: url('${bakery.image}');">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <button onclick="UserApp.closeBakeryDetail()" class="absolute top-3 left-3 p-2 bg-black/40 backdrop-blur-md rounded-full text-white text-xs cursor-pointer hover:bg-black/60">
          ← Volver
        </button>
        <button onclick="UserApp.toggleFavorite('${bakery.id}'); UserApp.showBakeryDetail('${bakery.id}');" class="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-500 text-xs shadow-md cursor-pointer hover:scale-110 transition">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="absolute bottom-3 left-3 right-3">
          <span class="bg-pink-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wider">${bakery.category}</span>
          <h2 class="text-xl font-black text-white leading-tight mt-1 drop-shadow-sm">${bakery.name}</h2>
          <p class="text-xs text-pink-200">${bakery.chef} • 📍 ${bakery.address}</p>
        </div>
      </div>

      <div class="p-4 space-y-4">
        <!-- Calificaciones y Badges -->
        <div class="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/60 dark:bg-slate-800 rounded-2xl">
          <div class="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
            ⭐ ${bakery.rating} <span class="text-xs text-gray-500 font-normal">(${bakery.reviewsCount} opiniones verificadas)</span>
          </div>
          <div class="flex gap-1.5 flex-wrap">
            ${bakery.badges.map(b => `<span class="text-[10px] font-bold bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-lg border border-pink-200 dark:border-slate-600">${b}</span>`).join('')}
          </div>
        </div>

        <!-- Tiempos de Entrega -->
        <div class="p-3 bg-emerald-50 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-1">
          <span class="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">⏱️ Tiempos de preparación / entrega</span>
          <p class="text-xs text-gray-700 dark:text-gray-300">${bakery.minLeadTime}</p>
        </div>

        <!-- ==========================================
             CATÁLOGO PÚBLICO DE PRODUCTOS
             ========================================== -->
        <div class="space-y-3 pt-1">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🛍️</span> Catálogo de Productos (${catalog.length})
            </h4>
            <span class="text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Disponibles
            </span>
          </div>

          ${catalog.length === 0 ? `
            <div class="p-6 text-center bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <span class="text-2xl block mb-1">👨‍🍳</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">Esta pastelería está actualizando su catálogo.</p>
              <p class="text-[11px] text-pink-600 font-bold mt-1">Puedes consultar directamente por WhatsApp.</p>
            </div>
          ` : `
            <div class="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              ${catalog.map(item => `
                <div class="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-pink-100/90 dark:border-slate-700 shadow-xs flex flex-col gap-2 hover:border-pink-300 transition">
                  <div class="flex gap-3">
                    <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-xl object-cover shrink-0 shadow-2xs border border-gray-100 dark:border-slate-700">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-1">
                        <h5 class="font-bold text-xs text-gray-900 dark:text-white truncate">${item.name}</h5>
                        <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700 dark:bg-slate-700 dark:text-pink-300 shrink-0">
                          ${item.badge || 'Disponible'}
                        </span>
                      </div>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">${item.description}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] text-gray-400">📏 ${item.yieldInfo}</span>
                        <span class="text-[10px] text-pink-500 font-semibold">• ${item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700/60">
                    <div class="flex flex-col">
                      <span class="text-[9px] text-gray-400 font-medium">Precio</span>
                      <span class="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">$ ${item.price.toLocaleString('es-CL')}</span>
                    </div>

                    <a href="https://wa.me/${bakery.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola ' + bakery.name + '! Vi su pastelería en Cakekulator y me gustaría pedir "' + item.name + '" (' + item.yieldInfo + ') por $' + item.price.toLocaleString('es-CL') + '. ¿Tienen disponibilidad?')}" 
                       target="_blank"
                       class="px-2.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-extrabold text-[10px] rounded-xl shadow-xs hover:from-pink-700 flex items-center gap-1 active:scale-95 transition">
                      <span>🛒</span>
                      <span>Pedir por WhatsApp</span>
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Botón Contacto General WhatsApp -->
        <a href="https://wa.me/${bakery.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola ' + bakery.name + '! Vi su pastelería en Cakekulator y quiero consultar por sus productos.')}" 
           target="_blank"
           class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-2xl text-center shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
          <span>💬</span>
          <span>Conversación General por WhatsApp</span>
        </a>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeBakeryDetail() {
    const modal = document.getElementById('bakery-detail-modal');
    if (modal) modal.classList.add('hidden');
  },

  updateBadges() {
    const offers = UserDB.getOffers();
    const offerBadge = document.getElementById('nav-offers-badge');
    if (offerBadge) {
      offerBadge.textContent = offers.length;
      offerBadge.classList.toggle('hidden', offers.length === 0);
    }
  },

  showToast(message) {
    let toast = document.getElementById('user-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'user-toast';
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-70 bg-gray-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 pointer-events-none opacity-0 translate-y-[-10px] flex items-center gap-2';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>🧁</span><span>${message}</span>`;
    toast.classList.remove('opacity-0', 'translate-y-[-10px]');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
    }, 2800);
  }
};
