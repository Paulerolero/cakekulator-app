// ==========================================
// Cakekulator Vendedor - Módulo de Mapa de Oportunidades & Solicitudes
// ==========================================

const SellerRequestsModule = {
  mapInstance: null,
  activeView: 'map', // 'map' | 'list'

  init() {
    // Inicialización del módulo
  },

  getBuyerRequests() {
    try {
      const data = localStorage.getItem('cakekulator_buyer_requests');
      if (data) return JSON.parse(data);
      if (typeof DEFAULT_BUYER_REQUESTS !== 'undefined') return DEFAULT_BUYER_REQUESTS;
      return [];
    } catch (_) {
      return [];
    }
  },

  // Obtener rubro y configuración activa del vendedor
  getSellerActiveRubroInfo() {
    const isServices = (typeof App !== 'undefined' && App.currentMode === 'services');
    if (!isServices) {
      return {
        mode: 'products',
        rubroLabel: 'Pastelería & Repostería',
        keywords: ['torta', 'pastel', 'pie', 'tarta', 'alfajor', 'galleta', 'cupcake', 'postre', 'candy', 'reposter', 'panader'],
        icon: '🧁',
        themeGradient: 'from-pink-50/70 via-rose-50/40 to-amber-50/60',
        borderColor: 'border-pink-200/80',
        badgeBg: 'bg-pink-500',
        badgeTextColor: 'text-pink-700 dark:text-pink-300',
        badgeBgSoft: 'bg-pink-50 dark:bg-slate-800',
        buttonGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
      };
    }

    // Modo SERVICIOS (Estética, Barbería, Spa, Manicure, etc.)
    const settings = (typeof DB !== 'undefined' && DB.getSettings) ? DB.getSettings() : {};
    const myServices = (typeof DB !== 'undefined' && DB.getRecipes)
      ? DB.getRecipes().filter(r => r.itemType === 'service' || ['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type))
      : [];

    const businessNameServ = (settings.businessNameServices || settings.businessName || '').toLowerCase();
    const specialtiesServ = (settings.businessSpecialties || '').toLowerCase();

    const knownRubros = [
      { id: 'barberia', label: 'Barbería & Cortes', icon: '💈', keywords: ['barber', 'corte', 'barba', 'degrade', 'fade', 'peluquer', 'cabello'] },
      { id: 'manicure', label: 'Manicure & Uñas', icon: '💅', keywords: ['manicure', 'uñas', 'unas', 'pedicure', 'acrilic', 'esmalte', 'foil', 'permanente', 'nail', 'polygel'] },
      { id: 'masajes', label: 'Masajes & Spa', icon: '💆', keywords: ['masaje', 'spa', 'descontracturante', 'relajante', 'drenaje', 'linfatico', 'piedras', 'craneal', 'terapia', 'corporal'] },
      { id: 'facial', label: 'Estética Facial', icon: '✨', keywords: ['facial', 'limpieza', 'serum', 'hialuronico', 'antiage', 'peeling', 'cutis', 'mascarilla', 'diamante'] },
      { id: 'pestanas', label: 'Pestañas & Cejas', icon: '👁️', keywords: ['pestaña', 'pestana', 'ceja', 'lifting', 'laminado', 'henna', 'microblading', 'volumen'] },
      { id: 'depilacion', label: 'Depilación', icon: '🪒', keywords: ['depilacion', 'cera', 'laser', 'ipl', 'roll on'] }
    ];

    const matchedRubros = knownRubros.filter(rubro => {
      const matchInRecipes = myServices.some(s => {
        const text = `${s.name || ''} ${s.category || ''} ${s.description || ''} ${s.notes || ''}`.toLowerCase();
        return rubro.keywords.some(k => text.includes(k));
      });
      const matchInSettings = rubro.keywords.some(k => businessNameServ.includes(k) || specialtiesServ.includes(k));
      return matchInRecipes || matchInSettings;
    });

    if (matchedRubros.length > 0) {
      const allKeywords = matchedRubros.flatMap(r => r.keywords);
      const label = matchedRubros.map(r => r.label).join(' & ');
      const icon = matchedRubros[0].icon;
      return {
        mode: 'services',
        rubroLabel: label,
        keywords: allKeywords,
        icon: icon,
        themeGradient: 'from-teal-50/70 via-cyan-50/40 to-slate-50/60',
        borderColor: 'border-teal-200/80',
        badgeBg: 'bg-teal-600',
        badgeTextColor: 'text-teal-700 dark:text-teal-300',
        badgeBgSoft: 'bg-teal-50 dark:bg-slate-800',
        buttonGradient: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
      };
    }

    return {
      mode: 'services',
      rubroLabel: 'Estética, Belleza & Bienestar',
      keywords: ['barber', 'corte', 'barba', 'manicure', 'uñas', 'masaje', 'facial', 'pestaña', 'ceja', 'spa', 'estetica', 'depilacion', 'corporal'],
      icon: '💆',
      themeGradient: 'from-teal-50/70 via-cyan-50/40 to-slate-50/60',
      borderColor: 'border-teal-200/80',
      badgeBg: 'bg-teal-600',
      badgeTextColor: 'text-teal-700 dark:text-teal-300',
      badgeBgSoft: 'bg-teal-50 dark:bg-slate-800',
      buttonGradient: 'from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
    };
  },

  // Filtrar solicitudes pertinentes para el vendedor actual
  getFilteredRequests() {
    const rawRequests = this.getBuyerRequests();
    const rubroInfo = this.getSellerActiveRubroInfo();
    const isServices = rubroInfo.mode === 'services';

    return rawRequests.filter(req => {
      if (req.status !== 'open') return false;

      const reqType = req.businessType || (
        ['barber', 'corte', 'barba', 'manicure', 'uñas', 'masaje', 'facial', 'pestaña', 'ceja', 'spa', 'estetica', 'depilacion', 'corporal']
          .some(k => `${req.title} ${req.category} ${req.description}`.toLowerCase().includes(k)) ? 'service' : 'product'
      );

      // Separación estricta de ambiente
      if (isServices && reqType !== 'service') return false;
      if (!isServices && reqType !== 'product') return false;

      // Filtrado por rubro específico
      if (isServices) {
        const fullText = `${req.title} ${req.category} ${req.description}`.toLowerCase();
        return rubroInfo.keywords.some(k => fullText.includes(k));
      }

      return true;
    });
  },

  // Cálculo de distancia en km
  calcDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  },

  // Renderizar la tarjeta del mapa interactivo en el Dashboard principal
  renderSellerMapCard() {
    const rubroInfo = this.getSellerActiveRubroInfo();
    const activeRequests = this.getFilteredRequests();
    const isServices = rubroInfo.mode === 'services';

    return `
      <!-- ==========================================
           RADAR & MAPA DE SOLICITUDES DE CLIENTES
           ========================================== -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-xs space-y-3.5">
        
        <!-- Encabezado del Mapa con Controles -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-slate-700">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-2xl ${rubroInfo.badgeBg} text-white text-lg shadow-md shadow-pink-500/20">
              📍
            </span>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <h3 class="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-tight">
                  Radar de Oportunidades & Clientes Cercanos
                </h3>
                <span class="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                  ${activeRequests.length} Solicitudes Activas
                </span>
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                ${isServices 
                  ? `Clientes buscando ${rubroInfo.rubroLabel} con presupuesto listo para agendar`
                  : 'Clientes buscando tortas y pastelería artesanal listos para encargar'}
              </p>
            </div>
          </div>

          <!-- Selector de Vista (Mapa vs Lista) -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
            <button type="button" onclick="SellerRequestsModule.switchView('map')" id="seller-btn-view-map"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${this.activeView === 'map' ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-300 shadow-xs' : 'text-gray-500 hover:text-gray-800'}">
              <span>🗺️</span>
              <span>Mapa</span>
            </button>
            <button type="button" onclick="SellerRequestsModule.switchView('list')" id="seller-btn-view-list"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${this.activeView === 'list' ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-300 shadow-xs' : 'text-gray-500 hover:text-gray-800'}">
              <span>📋</span>
              <span>Tarjetas (${activeRequests.length})</span>
            </button>
          </div>
        </div>

        <!-- Vista 1: Contenedor del Mapa de Leaflet -->
        <div id="seller-map-view-container" class="${this.activeView === 'map' ? '' : 'hidden'} space-y-2">
          <div class="relative h-[340px] sm:h-[380px] w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-inner">
            <div id="seller-radar-leaflet-map" class="w-full h-full z-10"></div>
          </div>
          <div class="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-1">
            <span class="flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
              <span><strong>Tu Local / Taller</strong></span>
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span><strong>Clientes con presupuesto</strong> (Toca un pin para ver detalles y contactar)</span>
            </span>
          </div>
        </div>

        <!-- Vista 2: Contenedor de Tarjetas en Cuadrícula -->
        <div id="seller-list-view-container" class="${this.activeView === 'list' ? '' : 'hidden'}">
          ${activeRequests.length === 0 ? `
            <div class="p-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <span class="text-3xl block mb-1">🔍</span>
              <p class="text-xs font-bold text-gray-700 dark:text-gray-300">No hay solicitudes activas para tu rubro en este momento.</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Te notificaremos en cuanto un cliente cercano publique un pedido.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              ${activeRequests.map(req => {
                const formattedBudget = Number(req.budget || 0).toLocaleString('es-CL');
                const cleanPhone = (req.userPhone || '+56900000000').replace(/[^0-9]/g, '');
                const settings = DB.getSettings();
                const dist = this.calcDistance(settings.businessLat || -33.4265, settings.businessLng || -70.6150, req.lat, req.lng);
                const whatsappText = encodeURIComponent(
                  isServices
                    ? `¡Hola ${req.userName}! Vi tu solicitud en Cakekulator: "${req.title}" (Presupuesto $${formattedBudget}). En nuestro centro realizamos este servicio y tenemos disponibilidad para ${req.deadline}. ¿Te gustaría que agendemos?`
                    : `¡Hola ${req.userName}! Vi tu solicitud en Cakekulator: "${req.title}" (Presupuesto $${formattedBudget}). En nuestra pastelería podemos prepararlo para ${req.deadline}. ¿Te gustaría que coordinemos?`
                );

                return `
                  <div class="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-pink-100/90 dark:border-slate-700 p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between hover:border-pink-300 transition">
                    <div class="space-y-1.5">
                      <div class="flex items-start justify-between gap-1.5">
                        <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${rubroInfo.badgeBgSoft} ${rubroInfo.badgeTextColor} truncate">
                          ${req.category || (isServices ? 'Servicio Flash' : 'Pedido Flash')}
                        </span>
                        <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          $${formattedBudget}
                        </span>
                      </div>
                      
                      <h4 class="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                        ${req.title}
                      </h4>
                      
                      <p class="text-[11px] text-gray-600 dark:text-gray-300 italic line-clamp-2">
                        "${req.description}"
                      </p>
                    </div>

                    <div class="space-y-2 pt-1.5 border-t border-gray-200/70 dark:border-slate-800">
                      <div class="flex items-center justify-between text-[10px] text-gray-400">
                        <span>📍 ${req.commune} ${dist ? `(${dist} km)` : ''}</span>
                        <span>⏰ ${req.deadline}</span>
                      </div>

                      <a href="https://wa.me/${cleanPhone}?text=${whatsappText}" 
                         target="_blank"
                         class="w-full py-2 bg-gradient-to-r ${rubroInfo.buttonGradient} text-white font-extrabold text-[11px] rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95">
                        <span>💬</span>
                        <span>Contactar por WhatsApp para Cerrar Trato</span>
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // Alternar vista entre Mapa y Lista
  switchView(viewName) {
    this.activeView = viewName;
    const mapContainer = document.getElementById('seller-map-view-container');
    const listContainer = document.getElementById('seller-list-view-container');
    const btnMap = document.getElementById('seller-btn-view-map');
    const btnList = document.getElementById('seller-btn-view-list');

    if (viewName === 'map') {
      if (mapContainer) mapContainer.classList.remove('hidden');
      if (listContainer) listContainer.classList.add('hidden');
      if (btnMap) btnMap.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-300 shadow-xs';
      if (btnList) btnList.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 text-gray-500 hover:text-gray-800';
      this.initSellerMap();
    } else {
      if (mapContainer) mapContainer.classList.add('hidden');
      if (listContainer) listContainer.classList.remove('hidden');
      if (btnMap) btnMap.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 text-gray-500 hover:text-gray-800';
      if (btnList) btnList.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-300 shadow-xs';
    }
  },

  // Inicializar Leaflet Map en la vista del vendedor
  initSellerMap() {
    const mapEl = document.getElementById('seller-radar-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    const settings = DB.getSettings();
    const sellerLat = parseFloat(settings.businessLat) || -33.4265;
    const sellerLng = parseFloat(settings.businessLng) || -70.6150;
    const rubroInfo = this.getSellerActiveRubroInfo();
    const isServices = rubroInfo.mode === 'services';

    this.mapInstance = L.map('seller-radar-leaflet-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([sellerLat, sellerLng], 13);

    // Tiles limpios CartoDB Voyager
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.mapInstance);

    // 1. Marcador del Taller / Local del Vendedor
    const sellerIcon = L.divIcon({
      className: 'custom-seller-wrapper',
      html: `
        <div class="seller-my-location-pin" title="Tu Local / Taller">
          <span>${isServices ? '💈' : '🎂'}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker([sellerLat, sellerLng], { icon: sellerIcon })
      .addTo(this.mapInstance)
      .bindPopup(`
        <div class="p-2 space-y-1 text-xs">
          <div class="font-extrabold text-pink-600">${settings.businessNameProducts || settings.businessName || 'Tu Local / Taller'}</div>
          <div class="text-[11px] text-gray-500">📍 ${settings.businessAddress || 'Ubicación registrada'}</div>
          <div class="text-[10px] text-emerald-600 font-bold">✨ Centro de tu Radar de Clientes</div>
        </div>
      `);

    // Radio de cobertura visual (círculo sutil)
    L.circle([sellerLat, sellerLng], {
      radius: 3500,
      color: '#ec4899',
      fillColor: '#f472b6',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '4, 6'
    }).addTo(this.mapInstance);

    // 2. Marcadores de Solicitudes de Clientes Cercanos
    const requests = this.getFilteredRequests();

    requests.forEach(req => {
      const reqLat = req.lat || (sellerLat + (Math.random() - 0.5) * 0.03);
      const reqLng = req.lng || (sellerLng + (Math.random() - 0.5) * 0.03);
      const formattedBudget = Number(req.budget || 0).toLocaleString('es-CL');
      const dist = this.calcDistance(sellerLat, sellerLng, reqLat, reqLng);
      const cleanPhone = (req.userPhone || '+56900000000').replace(/[^0-9]/g, '');

      const whatsappText = encodeURIComponent(
        isServices
          ? `¡Hola ${req.userName}! Vi tu solicitud en Cakekulator: "${req.title}" (Presupuesto $${formattedBudget}). En nuestro centro realizamos este servicio y tenemos disponibilidad para ${req.deadline}. ¿Te gustaría que agendemos?`
          : `¡Hola ${req.userName}! Vi tu solicitud en Cakekulator: "${req.title}" (Presupuesto $${formattedBudget}). En nuestra pastelería podemos prepararlo para ${req.deadline}. ¿Te gustaría que coordinemos?`
      );

      const requestIcon = L.divIcon({
        className: 'custom-req-pin',
        html: `
          <div class="seller-opportunity-pin">
            <span>${rubroInfo.icon}</span>
            <span class="badge-price">$${formattedBudget}</span>
          </div>
        `,
        iconSize: [80, 28],
        iconAnchor: [40, 14]
      });

      const popupHtml = `
        <div class="p-2.5 max-w-[260px] space-y-2 text-xs font-sans">
          <div class="flex items-start justify-between gap-1 border-b border-gray-100 pb-1.5">
            <div>
              <span class="text-[9px] font-black uppercase text-pink-600">${req.category || 'Oportunidad'}</span>
              <h4 class="font-extrabold text-gray-900 text-xs leading-tight">${req.title}</h4>
            </div>
            <span class="text-xs font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
              $${formattedBudget}
            </span>
          </div>

          <p class="text-[11px] text-gray-600 italic">"${req.description}"</p>

          <div class="text-[10px] text-gray-500 space-y-0.5">
            <div>📍 <strong>Ubicación:</strong> ${req.commune} ${dist ? `(${dist} km de distancia)` : ''}</div>
            <div>⏰ <strong>Fecha límite:</strong> ${req.deadline}</div>
            ${req.dietaryNotes ? `<div>⚠️ <strong>Nota:</strong> ${req.dietaryNotes}</div>` : ''}
          </div>

          <a href="https://wa.me/${cleanPhone}?text=${whatsappText}" 
             target="_blank"
             class="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-[11px] rounded-xl text-center flex items-center justify-center gap-1 shadow-sm mt-1"
             style="display: flex; text-decoration: none; color: white;">
            <span>💬</span>
            <span>Contactar para Cerrar Trato</span>
          </a>
        </div>
      `;

      L.marker([reqLat, reqLng], { icon: requestIcon })
        .addTo(this.mapInstance)
        .bindPopup(popupHtml);
    });

    // Invalida el tamaño para renderizado nítido
    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 200);
  }
};
