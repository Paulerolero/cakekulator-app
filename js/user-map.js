// ==========================================
// Cakekulator Cliente - Módulo de Mapa Interactivo (Leaflet)
// ==========================================

const UserMapModule = {
  map: null,
  markersLayer: null,
  userMarker: null,
  activeFilter: 'all',

  init() {
    const container = document.getElementById('user-map-container');
    if (!container) return;

    // Si ya existe el mapa, solo invalidar el tamaño
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
      return;
    }

    // Coordenadas por defecto (Santiago / Providencia)
    const profile = UserDB.getProfile();
    const defaultLat = profile.lat || -33.4310;
    const defaultLng = profile.lng || -70.6080;

    // Inicializar mapa de Leaflet
    this.map = L.map('user-map-container', {
      zoomControl: false,
      attributionControl: false
    }).setView([defaultLat, defaultLng], 14);

    // Agregar capa de OpenStreetMap (estilo limpio, gratuito y sin clave requerida)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(this.map);

    // Control de zoom en esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Capa de marcadores
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Marcador de ubicación del usuario
    this.renderUserLocationMarker(defaultLat, defaultLng);

    // Renderizar pastelerías
    this.renderBakeriesOnMap();

    // Intentar geolocalización real si está permitida
    this.locateUser();
  },

  renderUserLocationMarker(lat, lng) {
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    const userIcon = L.divIcon({
      className: 'custom-map-pin-user',
      html: '📍',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="p-3 text-center">
          <p class="font-bold text-xs text-gray-800">📍 Tu Ubicación Actual</p>
          <p class="text-[10px] text-gray-500 mt-0.5">Buscando pastelerías a tu alrededor</p>
        </div>
      `);
  },

  locateUser() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (this.map) {
            this.map.setView([lat, lng], 14);
            this.renderUserLocationMarker(lat, lng);
            this.renderBakeriesOnMap();
          }
        },
        () => {
          // Mantener ubicación por defecto si el usuario declina
        },
        { timeout: 5000 }
      );
    }
  },

  setFilter(category) {
    this.activeFilter = category;
    document.querySelectorAll('.map-filter-chip').forEach(btn => {
      const isMatch = btn.getAttribute('data-filter') === category;
      btn.className = isMatch 
        ? 'map-filter-chip px-3 py-1.5 rounded-full text-xs font-bold bg-pink-600 text-white shadow-xs transition'
        : 'map-filter-chip px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-pink-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-pink-300 transition';
    });
    this.renderBakeriesOnMap();
  },

  renderBakeriesOnMap() {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();

    const bakeries = UserDB.getBakeries();
    const offers = UserDB.getOffers();
    const profile = UserDB.getProfile();
    const userLat = profile.lat || -33.4310;
    const userLng = profile.lng || -70.6080;

    bakeries.forEach(bakery => {
      if (this.activeFilter !== 'all') {
        if (this.activeFilter === 'healthy' && !bakery.category.toLowerCase().includes('saludable') && !bakery.badges.some(b => b.includes('Vegano') || b.includes('Sin Azúcar'))) {
          return;
        }
        if (this.activeFilter === 'cakes' && !bakery.category.toLowerCase().includes('torta')) {
          return;
        }
        if (this.activeFilter === 'pastries' && !bakery.category.toLowerCase().includes('bollería') && !bakery.category.toLowerCase().includes('bocaditos')) {
          return;
        }
      }

      const hasOffer = offers.some(o => o.bakeryId === bakery.id);
      const isFav = UserDB.isFavorite(bakery.id);
      const distance = this.calculateDistance(userLat, userLng, bakery.lat, bakery.lng).toFixed(1);

      const iconHtml = `
        <div class="custom-map-pin ${hasOffer ? 'ring-4 ring-amber-400' : ''}">
          <span>${bakery.logo || '🎂'}</span>
        </div>
      `;

      const bakeryIcon = L.divIcon({
        className: 'leaflet-data-marker',
        html: iconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -20]
      });

      const popupContent = `
        <div class="w-64 bg-white dark:bg-slate-900 overflow-hidden font-sans">
          <div class="relative h-24 w-full bg-cover bg-center" style="background-image: url('${bakery.image}');">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div class="absolute top-2 right-2">
              <button onclick="UserApp.toggleFavorite('${bakery.id}')" class="p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-pink-600 shadow-sm text-xs cursor-pointer">
                ${isFav ? '❤️' : '🤍'}
              </button>
            </div>
            <div class="absolute bottom-2 left-2 right-2">
              <h4 class="font-bold text-sm text-white leading-tight drop-shadow-sm">${bakery.name}</h4>
              <p class="text-[10px] text-pink-200">${bakery.chef}</p>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-amber-500 font-bold flex items-center gap-0.5">⭐ ${bakery.rating} <span class="text-[10px] text-gray-400">(${bakery.reviewsCount})</span></span>
              <span class="text-[11px] font-semibold text-gray-500 dark:text-gray-400">📍 a ${distance} km</span>
            </div>
            <p class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">${bakery.specialties.join(' • ')}</p>
            ${hasOffer ? `
              <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                <span>⚡</span>
                <span>¡Tiene ofertas flash activas hoy!</span>
              </div>
            ` : ''}
            <div class="pt-1 flex gap-2">
              <a href="https://wa.me/${bakery.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola ' + bakery.name + '! Vi su local en Cakekulator y me gustaría consultar por sus productos.')}" 
                 target="_blank" 
                 class="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center rounded-xl text-xs transition flex items-center justify-center gap-1">
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
              <button onclick="UserApp.showBakeryDetail('${bakery.id}')" 
                      class="px-2.5 py-1.5 bg-pink-50 dark:bg-slate-800 hover:bg-pink-100 text-pink-600 dark:text-pink-300 font-bold rounded-xl text-xs transition">
                Ver
              </button>
            </div>
          </div>
        </div>
      `;

      L.marker([bakery.lat, bakery.lng], { icon: bakeryIcon })
        .addTo(this.markersLayer)
        .bindPopup(popupContent);
    });
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};
