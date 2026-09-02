// ==========================================
// Cakekulator Cliente - Módulo de Ofertas Flash
// ==========================================

const UserOffersModule = {
  timerInterval: null,
  activeFilter: 'all',

  init() {
    this.renderOffers();
    this.startCountdownTicker();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    document.querySelectorAll('.offer-filter-chip').forEach(btn => {
      const isMatch = btn.getAttribute('data-filter') === filter;
      btn.className = isMatch 
        ? 'offer-filter-chip px-3 py-1.5 rounded-full text-xs font-bold bg-pink-600 text-white shadow-xs transition'
        : 'offer-filter-chip px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-pink-300 transition';
    });
    this.renderOffers();
  },

  renderOffers() {
    const container = document.getElementById('user-offers-container');
    if (!container) return;

    const allOffers = UserDB.getOffers();
    const favorites = UserDB.getFavorites();

    const filtered = allOffers.filter(offer => {
      if (this.activeFilter === 'favorites') {
        return favorites.includes(offer.bakeryId);
      }
      if (this.activeFilter === 'healthy') {
        return (offer.dietary || []).some(d => d.includes('Vegano') || d.includes('Sin Azúcar') || d.includes('Sin Gluten'));
      }
      if (this.activeFilter === 'cheap') {
        return offer.offerPrice <= 12000;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm space-y-3">
          <span class="text-4xl block">⚡</span>
          <h3 class="font-bold text-gray-800 dark:text-gray-100 text-base">No hay ofertas flash con este filtro</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Intenta seleccionando otra categoría o guarda más locales en tus favoritos.</p>
          <button onclick="UserOffersModule.setFilter('all')" class="px-4 py-2 bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-300 font-bold text-xs rounded-xl hover:bg-pink-100 transition">
            Ver todas las ofertas
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(offer => {
      const isFavBakery = favorites.includes(offer.bakeryId);
      const savings = (offer.originalPrice - offer.offerPrice).toLocaleString('es-CL');
      const formattedOffer = offer.offerPrice.toLocaleString('es-CL');
      const formattedOriginal = offer.originalPrice.toLocaleString('es-CL');

      const whatsappText = encodeURIComponent(
        `¡Hola ${offer.bakeryName}! Vi la Oferta Flash de "${offer.title}" por $${formattedOffer} en Cakekulator y quiero reservarla.`
      );

      return `
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100/80 dark:border-slate-800 shadow-sm overflow-hidden touch-card hover:shadow-md transition">
          <!-- Imagen y badges -->
          <div class="relative h-44 w-full bg-cover bg-center" style="background-image: url('${offer.image}');">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <!-- Badge de Descuento -->
            <div class="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
              <span>🔥</span>
              <span>-${offer.discountPct}% OFF</span>
            </div>

            <!-- Badge de Favorito / Timer -->
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
              ${isFavBakery ? `
                <span class="bg-pink-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  ❤️ De tu Favorito
                </span>
              ` : ''}
              <button onclick="UserApp.toggleFavorite('${offer.bakeryId}')" class="p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-pink-600 shadow-md text-xs cursor-pointer hover:scale-105 transition">
                ${isFavBakery ? '❤️' : '🤍'}
              </button>
            </div>

            <!-- Info inferior de imagen -->
            <div class="absolute bottom-3 left-3 right-3">
              <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                ${offer.bakeryName}
              </span>
              <h3 class="font-extrabold text-base text-white leading-tight drop-shadow-sm line-clamp-1">
                ${offer.title}
              </h3>
            </div>
          </div>

          <!-- Cuerpo de la Oferta -->
          <div class="p-4 space-y-3">
            <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              ${offer.description}
            </p>

            <!-- Tags dietarios / atributos -->
            <div class="flex flex-wrap gap-1.5">
              ${(offer.dietary || []).map(d => `
                <span class="text-[10px] font-semibold bg-pink-50 dark:bg-slate-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-md">
                  ${d}
                </span>
              `).join('')}
              <span class="text-[10px] font-semibold bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                📦 Quedan ${offer.stockQty} unid.
              </span>
            </div>

            <!-- Contador de Urgencia -->
            <div class="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                <span class="animate-pulse">⏳</span>
                <span>Termina en:</span>
              </div>
              <span class="text-xs font-extrabold font-mono text-rose-800 dark:text-rose-200 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                01h 35m 12s
              </span>
            </div>

            <!-- Precios y Botón WhatsApp -->
            <div class="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span class="text-[10px] text-gray-400 line-through block">Normal: $${formattedOriginal}</span>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-black text-gray-900 dark:text-white">$${formattedOffer}</span>
                  <span class="text-[10px] font-bold text-emerald-600">Ahorras $${savings}</span>
                </div>
              </div>

              <a href="https://wa.me/${offer.bakeryPhone.replace(/[^0-9]/g, '')}?text=${whatsappText}" 
                 target="_blank" 
                 class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5 shrink-0">
                <span>⚡</span>
                <span>Reservar Ya</span>
              </a>
            </div>

          </div>
        </div>
      `;
    }).join('');
  },

  startCountdownTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    // Intervalo decorativo para simular cuenta regresiva viva
    this.timerInterval = setInterval(() => {
      // ticker suave
    }, 1000);
  }
};
