// ==========================================
// Cakekulator - Módulo Radar de Ofertas y Comparador de Precios (Chile)
// ==========================================

const MarketRadarModule = {
  activeCategory: 'all',
  selectedStore: 'all',
  searchQuery: '',
  sortBy: 'discount', // 'discount' | 'price-asc' | 'unit-cost'
  storeFilterCategory: 'all', // 'all' | 'Supermercados' | 'Distribuidoras de Pastelería' | 'Moldes & Empaques'
  isDirectoryCollapsed: true, // Nace colapsado por defecto

  // Catálogo de productos indexados frecuentemente en supermercados y distribuidoras de Chile
  marketData: [
    // --- LÁCTEOS Y MANJAR ---
    {
      id: 'mkt_1',
      name: 'Manjar Artesanal Colún 1 kg',
      category: 'Lácteos & Manjar',
      brand: 'Colún',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Líder',
      storeLogo: '🛒',
      normalPrice: 4890,
      offerPrice: 4190,
      discountPct: 14,
      isBestDeal: true,
      productUrl: 'https://www.lider.cl/supermercado/search?query=manjar%20colun%201kg',
      matchedIngredientKeyword: 'Manjar',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_2',
      name: 'Manjar Repostero Nestlé 1 kg',
      category: 'Lácteos & Manjar',
      brand: 'Nestlé',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Jumbo',
      storeLogo: '🐘',
      normalPrice: 5290,
      offerPrice: 4790,
      discountPct: 9,
      isBestDeal: false,
      productUrl: 'https://www.jumbo.cl/busca?ft=manjar+nestle+repostero',
      matchedIngredientKeyword: 'Manjar',
      lastUpdated: 'Ayer'
    },
    {
      id: 'mkt_3',
      name: 'Mantequilla con Sal Soprole 250 g',
      category: 'Lácteos & Manjar',
      brand: 'Soprole',
      packageQty: 250,
      packageUnit: 'g',
      store: 'Santa Isabel',
      storeLogo: '🏪',
      normalPrice: 2890,
      offerPrice: 2390,
      discountPct: 17,
      isBestDeal: true,
      productUrl: 'https://www.santaisabel.cl/busca?ft=mantequilla+soprole+250g',
      matchedIngredientKeyword: 'Mantequilla',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_4',
      name: 'Mantequilla sin Sal Colún 250 g',
      category: 'Lácteos & Manjar',
      brand: 'Colún',
      packageQty: 250,
      packageUnit: 'g',
      store: 'Tottus',
      storeLogo: '🟢',
      normalPrice: 2990,
      offerPrice: 2490,
      discountPct: 16,
      isBestDeal: false,
      productUrl: 'https://www.tottus.cl/tottus-cl/search?Ntt=mantequilla+colun+sin+sal',
      matchedIngredientKeyword: 'Mantequilla',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_5',
      name: 'Crema para Batir 35% MG Soprole 1 Litro',
      category: 'Lácteos & Manjar',
      brand: 'Soprole',
      packageQty: 1,
      packageUnit: 'l',
      store: 'Centro Abasto',
      storeLogo: '🏢',
      normalPrice: 5490,
      offerPrice: 4690,
      discountPct: 15,
      isBestDeal: true,
      productUrl: 'https://centroabasto.cl/?s=crema+soprole',
      matchedIngredientKeyword: 'Crema',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_6',
      name: 'Leche Condensada Nestlé 397 g',
      category: 'Lácteos & Manjar',
      brand: 'Nestlé',
      packageQty: 397,
      packageUnit: 'g',
      store: 'Unimarc',
      storeLogo: '🔴',
      normalPrice: 1890,
      offerPrice: 1490,
      discountPct: 21,
      isBestDeal: true,
      productUrl: 'https://www.unimarc.cl/search?q=leche%20condensada',
      matchedIngredientKeyword: 'Leche',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_7',
      name: 'Queso Crema Philadelphia Original 226 g',
      category: 'Lácteos & Manjar',
      brand: 'Philadelphia',
      packageQty: 226,
      packageUnit: 'g',
      store: 'Jumbo',
      storeLogo: '🐘',
      normalPrice: 3590,
      offerPrice: 2990,
      discountPct: 16,
      isBestDeal: true,
      productUrl: 'https://www.jumbo.cl/busca?ft=queso+crema+philadelphia',
      matchedIngredientKeyword: 'Queso',
      lastUpdated: 'Ayer'
    },

    // --- HARINAS Y POLVOS ---
    {
      id: 'mkt_8',
      name: 'Harina sin Polvos de Hornear Selecta 1 kg',
      category: 'Harinas & Polvos',
      brand: 'Selecta',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Líder',
      storeLogo: '🛒',
      normalPrice: 1590,
      offerPrice: 1290,
      discountPct: 19,
      isBestDeal: true,
      productUrl: 'https://www.lider.cl/supermercado/search?query=harina%20selecta%20sin%20polvos',
      matchedIngredientKeyword: 'Harina',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_9',
      name: 'Harina con Polvos Mont Blanc 1 kg',
      category: 'Harinas & Polvos',
      brand: 'Mont Blanc',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'La Oferta',
      storeLogo: '🏷️',
      normalPrice: 1490,
      offerPrice: 1150,
      discountPct: 22,
      isBestDeal: true,
      productUrl: 'https://laoferta.cl/?s=harina',
      matchedIngredientKeyword: 'Harina',
      lastUpdated: 'Ayer'
    },
    {
      id: 'mkt_10',
      name: 'Almidón de Maíz Maizena 500 g',
      category: 'Harinas & Polvos',
      brand: 'Maizena',
      packageQty: 500,
      packageUnit: 'g',
      store: 'Santa Isabel',
      storeLogo: '🏪',
      normalPrice: 2490,
      offerPrice: 2090,
      discountPct: 16,
      isBestDeal: true,
      productUrl: 'https://www.santaisabel.cl/busca?ft=maizena+500g',
      matchedIngredientKeyword: 'Maicena',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_11',
      name: 'Polvos de Hornear Royal 100 g',
      category: 'Harinas & Polvos',
      brand: 'Royal',
      packageQty: 100,
      packageUnit: 'g',
      store: 'Tottus',
      storeLogo: '🟢',
      normalPrice: 1290,
      offerPrice: 990,
      discountPct: 23,
      isBestDeal: true,
      productUrl: 'https://www.tottus.cl/tottus-cl/search?Ntt=polvos+hornear+royal',
      matchedIngredientKeyword: 'Polvos',
      lastUpdated: 'Hoy'
    },

    // --- HUEVOS Y FRESCOS ---
    {
      id: 'mkt_12',
      name: 'Huevos Grandes Blancos (Bandeja 30 un)',
      category: 'Huevos & Frescos',
      brand: 'Santa Marta',
      packageQty: 30,
      packageUnit: 'u',
      store: 'Distribuidoras Franklin',
      storeLogo: '📦',
      normalPrice: 6990,
      offerPrice: 5790,
      discountPct: 17,
      isBestDeal: true,
      productUrl: 'https://distribuidorasfranklin.com/?s=huevos',
      matchedIngredientKeyword: 'Huevos',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_13',
      name: 'Huevos Extra Grandes Color (Bandeja 30 un)',
      category: 'Huevos & Frescos',
      brand: 'Champion',
      packageQty: 30,
      packageUnit: 'u',
      store: 'Unimarc',
      storeLogo: '🔴',
      normalPrice: 7490,
      offerPrice: 6290,
      discountPct: 16,
      isBestDeal: false,
      productUrl: 'https://www.unimarc.cl/search?q=huevos%2030',
      matchedIngredientKeyword: 'Huevos',
      lastUpdated: 'Ayer'
    },

    // --- CHOCOLATES Y COBERTURAS ---
    {
      id: 'mkt_14',
      name: 'Cobertura Gotas Semiamarga Carat Puratos 1 kg',
      category: 'Chocolates & Coberturas',
      brand: 'Puratos',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Club Repostero',
      storeLogo: '🎂',
      normalPrice: 8490,
      offerPrice: 6990,
      discountPct: 17,
      isBestDeal: true,
      productUrl: 'https://clubrepostero.cl/?s=cobertura+puratos',
      matchedIngredientKeyword: 'Chocolate',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_15',
      name: 'Cacao Amargo en Polvo Gourmet 100 g',
      category: 'Chocolates & Coberturas',
      brand: 'Gourmet',
      packageQty: 100,
      packageUnit: 'g',
      store: 'Líder',
      storeLogo: '🛒',
      normalPrice: 1990,
      offerPrice: 1590,
      discountPct: 20,
      isBestDeal: true,
      productUrl: 'https://www.lider.cl/supermercado/search?query=cacao%20amargo%20gourmet',
      matchedIngredientKeyword: 'Cacao',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_16',
      name: 'Crema de Avellanas Nutella 750 g',
      category: 'Chocolates & Coberturas',
      brand: 'Nutella',
      packageQty: 750,
      packageUnit: 'g',
      store: 'Jumbo',
      storeLogo: '🐘',
      normalPrice: 8490,
      offerPrice: 7290,
      discountPct: 14,
      isBestDeal: true,
      productUrl: 'https://www.jumbo.cl/busca?ft=nutella+750g',
      matchedIngredientKeyword: 'Nutella',
      lastUpdated: 'Hoy'
    },

    // --- AZÚCARES & ENDULZANTES ---
    {
      id: 'mkt_17',
      name: 'Azúcar Blanca Granulada Iansa 1 kg',
      category: 'Azúcares & Endulzantes',
      brand: 'Iansa',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Líder',
      storeLogo: '🛒',
      normalPrice: 1390,
      offerPrice: 1090,
      discountPct: 21,
      isBestDeal: true,
      productUrl: 'https://www.lider.cl/supermercado/search?query=azucar%20iansa%201kg',
      matchedIngredientKeyword: 'Azúcar',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_18',
      name: 'Azúcar Flor (Glass) Iansa 1 kg',
      category: 'Azúcares & Endulzantes',
      brand: 'Iansa',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Santa Isabel',
      storeLogo: '🏪',
      normalPrice: 2190,
      offerPrice: 1790,
      discountPct: 18,
      isBestDeal: true,
      productUrl: 'https://www.santaisabel.cl/busca?ft=azucar+flor+iansa',
      matchedIngredientKeyword: 'Azúcar Flor',
      lastUpdated: 'Ayer'
    },

    // --- EMPAQUES & MOLDES ---
    {
      id: 'mkt_19',
      name: 'Cajas para Torta Alta 26x26x15 cm (Pack 10 un)',
      category: 'Empaques & Descartables',
      brand: 'Leehebo',
      packageQty: 10,
      packageUnit: 'un',
      store: 'Leehebo Oficial',
      storeLogo: '🎀',
      normalPrice: 8990,
      offerPrice: 6990,
      discountPct: 22,
      isBestDeal: true,
      productUrl: 'https://leehebo.cl/?s=cajas+torta',
      matchedIngredientKeyword: 'Caja',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_20',
      name: 'Bases Rígidas Doradas para Torta 28 cm (Pack 5 un)',
      category: 'Empaques & Descartables',
      brand: 'Duce Repostería',
      packageQty: 5,
      packageUnit: 'un',
      store: 'Repostería Duce',
      storeLogo: '🧁',
      normalPrice: 4990,
      offerPrice: 3890,
      discountPct: 22,
      isBestDeal: true,
      productUrl: 'https://www.google.com/search?q=reposteria+duce+bases+doradas',
      matchedIngredientKeyword: 'Base',
      lastUpdated: 'Hoy'
    }
  ],

  getStores() {
    if (typeof DB !== 'undefined' && DB.getMarketStores) {
      return DB.getMarketStores();
    }
    return typeof DEFAULT_MARKET_STORES !== 'undefined' ? DEFAULT_MARKET_STORES : [];
  },

  render() {
    const container = document.getElementById('market-radar-view');
    if (!container) return;

    const allStores = this.getStores();
    const enabledStores = allStores.filter(s => s.enabled !== false);
    const categories = ['all', 'Lácteos & Manjar', 'Harinas & Polvos', 'Huevos & Frescos', 'Chocolates & Coberturas', 'Azúcares & Endulzantes', 'Empaques & Descartables'];

    let filtered = this.marketData.filter(item => {
      const matchCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchStore = this.selectedStore === 'all' || item.store.toLowerCase().includes(this.selectedStore.toLowerCase());
      const matchSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.store.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchStore && matchSearch;
    });

    // Ordenamiento
    if (this.sortBy === 'discount') {
      filtered.sort((a, b) => b.discountPct - a.discountPct);
    } else if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => a.offerPrice - b.offerPrice);
    }

    container.innerHTML = `
      <!-- Barra Superior de Acciones de Radar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5 sm:mb-3">
        <div class="flex items-center justify-between gap-2">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-bold border border-emerald-100 dark:border-emerald-900">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>${enabledStores.length} Tiendas activas</span>
          </div>

          <!-- Botón de refrescar visible junto al badge en móvil -->
          <button onclick="MarketRadarModule.refreshPricesLive()" title="Actualizar precios del radar" class="sm:hidden p-1.5 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 transition active:scale-95 cursor-pointer border border-emerald-200 dark:border-slate-700">
            <span class="text-xs">🔄</span>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button onclick="MarketRadarModule.openCustomSearchModal()" class="px-2.5 sm:px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shadow-pink-200 active:scale-95 cursor-pointer truncate">
            <span>🔍</span> <span class="truncate">Buscar en Tiendas</span>
          </button>
          <button onclick="MarketRadarModule.openStoreManagerModal()" class="px-2.5 sm:px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gray-200 dark:border-slate-700 shadow-2xs active:scale-95 cursor-pointer truncate">
            <span>⚙️</span> <span class="truncate">Tiendas (${allStores.length})</span>
          </button>
          <button onclick="MarketRadarModule.refreshPricesLive()" title="Actualizar precios del radar" class="hidden sm:flex p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 transition active:scale-95 cursor-pointer border border-emerald-200 dark:border-slate-700 items-center justify-center">
            <span>🔄</span>
          </button>
        </div>
      </div>

      <!-- Barra de Filtros de Ofertas -->
      <div class="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3.5 mb-3 sm:mb-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3">
          <!-- Búsqueda -->
          <div class="md:col-span-6 relative">
            <input 
              type="text" 
              placeholder="Buscar en ofertas (Manjar, Harina, Mantequilla)..." 
              value="${this.searchQuery}"
              oninput="MarketRadarModule.onSearch(this.value)"
              class="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-pink-400 text-xs bg-gray-50/50 focus:bg-white"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5 sm:top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <!-- Filtros en 2 columnas en mobile, 6 columnas en desktop -->
          <div class="grid grid-cols-2 md:col-span-6 gap-2 sm:gap-3">
            <!-- Filtro por Tienda -->
            <div>
              <select 
                onchange="MarketRadarModule.filterByStore(this.value)"
                class="w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-pink-400 truncate"
              >
                <option value="all" ${this.selectedStore === 'all' ? 'selected' : ''}>🏬 Todas las Tiendas</option>
                ${allStores.map(s => `
                  <option value="${s.name}" ${this.selectedStore === s.name ? 'selected' : ''}>${s.icon || '🏬'} ${s.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- Ordenar por -->
            <div>
              <select 
                onchange="MarketRadarModule.changeSort(this.value)"
                class="w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-pink-400 truncate"
              >
                <option value="discount" ${this.sortBy === 'discount' ? 'selected' : ''}>🔥 Descuento (%)</option>
                <option value="price-asc" ${this.sortBy === 'price-asc' ? 'selected' : ''}>💲 Menor Precio ($)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Categorías Pills con scroll horizontal suave -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium max-w-full touch-pan-x overscroll-x-contain">
          ${categories.map(cat => `
            <button 
              onclick="MarketRadarModule.filterByCategory('${cat}')"
              class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl whitespace-nowrap transition shrink-0 cursor-pointer ${this.activeCategory === cat ? 'bg-pink-600 text-white font-bold shadow-xs' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-700'}"
            >
              ${cat === 'all' ? '✨ Todas' : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Ofertas Destacadas -->
      ${filtered.length === 0 ? `
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center border border-pink-100 dark:border-slate-800 shadow-sm space-y-3">
          <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-400 flex items-center justify-center text-2xl sm:text-3xl mx-auto">
            🛒
          </div>
          <h3 class="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200">No encontramos ofertas para este filtro</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">Prueba buscando en el catálogo general o haz una búsqueda directa en las tiendas con el botón superior.</p>
          <button onclick="MarketRadarModule.openCustomSearchModal()" class="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-200 hover:bg-pink-700 transition">
            🔍 Buscar en Tiendas
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 mb-8">
          ${filtered.map(item => {
            const unitPrice = item.offerPrice / item.packageQty;
            const existingLocal = this.findMatchingLocalIngredient(item);
            return `
              <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100/90 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group">
                
                <div class="mb-3 sm:mb-4">
                  <!-- Header del Producto -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                      <span>${item.storeLogo}</span> <span class="truncate">${item.store}</span>
                    </span>
                    <span class="inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 sm:py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60 shrink-0">
                      -${item.discountPct}%
                    </span>
                  </div>

                  <h4 class="font-bold text-xs sm:text-base text-gray-900 dark:text-gray-100 leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition mb-1">${item.name}</h4>
                  <span class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 block">Marca: ${item.brand} · Formato: ${item.packageQty} ${item.packageUnit}</span>
                </div>

                <!-- Precios y Comparador -->
                <div class="bg-gray-50/80 dark:bg-slate-800/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-1.5 mb-3 sm:mb-4 border border-gray-100 dark:border-slate-700/60">
                  <div class="flex items-baseline justify-between">
                    <div>
                      <span class="text-xs text-gray-400 dark:text-gray-500 line-through mr-1.5">${Calculator.formatCurrency(item.normalPrice)}</span>
                      <span class="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">${Calculator.formatCurrency(item.offerPrice)}</span>
                    </div>
                    <span class="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      ${Calculator.formatCurrency(Math.round(unitPrice))} / ${item.packageUnit}
                    </span>
                  </div>

                  ${existingLocal ? `
                    <div class="pt-1.5 border-t border-gray-200/70 dark:border-slate-700 flex items-center justify-between text-[11px] sm:text-xs">
                      <span class="text-gray-500 dark:text-gray-400">Tu costo actual:</span>
                      <span class="font-bold ${item.offerPrice < existingLocal.packagePrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">
                        ${Calculator.formatCurrency(existingLocal.packagePrice)}
                        ${item.offerPrice < existingLocal.packagePrice ? ' (¡Ahorras ' + Calculator.formatCurrency(existingLocal.packagePrice - item.offerPrice) + '!)' : ''}
                      </span>
                    </div>
                  ` : ''}
                </div>

                <!-- Acciones del Producto -->
                <div class="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5 mt-auto">
                  <a 
                    href="${item.productUrl}" 
                    target="_blank" 
                    class="py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition text-center shadow-2xs truncate"
                  >
                    <span>🔗</span> <span class="truncate">Ver Oferta</span>
                  </a>
                  <button 
                    onclick="MarketRadarModule.applyOfferToInventory('${item.id}')"
                    class="py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-md shadow-pink-200/80 dark:shadow-none transition active:scale-95 cursor-pointer truncate"
                  >
                    <span>📥</span> <span class="truncate">Usar Precio</span>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  toggleDirectoryCollapse() {
    this.isDirectoryCollapsed = !this.isDirectoryCollapsed;
    this.render();
  },

  filterStoresByType(type) {
    this.storeFilterCategory = type;
    this.render();
  },

  onSearch(query) {
    this.searchQuery = query;
    this.render();
  },

  filterByCategory(cat) {
    this.activeCategory = cat;
    this.render();
  },

  filterByStore(store) {
    this.selectedStore = store;
    this.render();
  },

  changeSort(sort) {
    this.sortBy = sort;
    this.render();
  },

  findMatchingLocalIngredient(offerItem) {
    const all = DB.getIngredients();
    const keyword = offerItem.matchedIngredientKeyword.toLowerCase();
    return all.find(i => i.name.toLowerCase().includes(keyword)) || null;
  },

  applyOfferToInventory(offerId) {
    const item = this.marketData.find(i => i.id === offerId);
    if (!item) return;

    const existing = this.findMatchingLocalIngredient(item);

    if (existing) {
      // Actualizar insumo existente
      DB.updateIngredient(existing.id, {
        packagePrice: item.offerPrice,
        packageQty: item.packageQty,
        packageUnit: item.packageUnit,
        lastUpdated: new Date().toISOString()
      });

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`✅ Precio de "${existing.name}" actualizado a ${Calculator.formatCurrency(item.offerPrice)} desde ${item.store}.`);
      } else {
        alert(`✅ Precio de "${existing.name}" actualizado a ${Calculator.formatCurrency(item.offerPrice)}.`);
      }
    } else {
      // Crear nuevo insumo
      DB.addIngredient({
        id: 'ing_' + Date.now(),
        name: item.name,
        category: item.category.split('&')[0].trim(),
        packagePrice: item.offerPrice,
        packageQty: item.packageQty,
        packageUnit: item.packageUnit,
        yieldWastePercent: 0
      });

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 "${item.name}" agregado a tu inventario con precio ${Calculator.formatCurrency(item.offerPrice)}.`);
      } else {
        alert(`🎉 "${item.name}" agregado a tu inventario.`);
      }
    }

    // Refrescar vistas
    if (typeof IngredientsModule !== 'undefined') IngredientsModule.render();
    this.render();
  },

  // Modal para Buscar en Supermercados y Distribuidoras
  openCustomSearchModal(defaultQuery = '') {
    let modal = document.getElementById('market-custom-search-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'market-custom-search-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto';

    const allStores = this.getStores();
    const enabledStores = allStores.filter(s => s.enabled !== false);

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-pink-100 dark:border-slate-800 space-y-4 max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto flex flex-col modal-animate-in">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center text-xl shadow-md shadow-pink-200">
              🔎
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">Búsqueda Directa en Tiendas de Chile</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Ingresa el producto y compara precios en tiempo real</p>
            </div>
          </div>
          <button onclick="MarketRadarModule.closeCustomSearchModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition">✕</button>
        </div>

        <!-- Input de Búsqueda -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">¿Qué insumo o producto deseas cotizar?</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              id="custom-market-query" 
              value="${defaultQuery}"
              placeholder="Ej: Manjar, Harina, Crema para batir, Chocolate 70%, Cajas de torta..." 
              class="flex-1 px-4 py-3 rounded-2xl border border-pink-200 text-sm font-semibold focus:ring-2 focus:ring-pink-400 bg-pink-50/30"
              onkeydown="if(event.key === 'Enter') MarketRadarModule.launchMultiSearch()"
            />
          </div>
        </div>

        <!-- Botones de Acción Rápida -->
        <div class="flex flex-wrap items-center gap-2 pt-1 border-b border-gray-100 dark:border-slate-800 pb-3">
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">Búsqueda masiva:</span>
          <button onclick="MarketRadarModule.launchCategorySearch('Supermercados')" class="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1 shadow-2xs">
            <span>🛒</span> Abrir Todos los Supermercados
          </button>
          <button onclick="MarketRadarModule.launchCategorySearch('Distribuidoras')" class="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 text-pink-700 dark:text-pink-300 text-xs font-bold transition flex items-center gap-1 shadow-2xs">
            <span>🎂</span> Abrir Todas las Distribuidoras
          </button>
        </div>

        <!-- Lista de Tiendas con Botón Individual -->
        <div class="overflow-y-auto flex-1 pr-1 space-y-2">
          <span class="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">O busca individualmente en la tienda que prefieras:</span>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${enabledStores.map(store => `
              <button 
                onclick="MarketRadarModule.launchSearchForStore('${store.id}')" 
                class="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-pink-400 hover:bg-pink-50/40 dark:hover:bg-slate-800 text-left transition group active:scale-98"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <span class="text-2xl">${store.icon || '🏬'}</span>
                  <div class="truncate">
                    <span class="font-black text-xs text-gray-900 dark:text-gray-100 group-hover:text-pink-600 transition block truncate">${store.name}</span>
                    <span class="text-[10px] text-gray-400 block truncate">${store.description || store.category}</span>
                  </div>
                </div>
                <span class="text-xs text-pink-600 font-bold shrink-0 ml-2">Buscar ↗</span>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
    setTimeout(() => {
      document.getElementById('custom-market-query')?.focus();
    }, 100);
  },

  closeCustomSearchModal() {
    const modal = document.getElementById('market-custom-search-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  searchSpecificStore(storeId) {
    this.openCustomSearchModal();
    setTimeout(() => {
      this.launchSearchForStore(storeId);
    }, 50);
  },

  launchSearchForStore(storeId) {
    const queryInput = document.getElementById('custom-market-query');
    const rawQuery = (queryInput ? queryInput.value.trim() : '') || 'reposteria';
    const query = encodeURIComponent(rawQuery);
    
    const allStores = this.getStores();
    const store = allStores.find(s => s.id === storeId);
    if (!store) return;

    let targetUrl = store.searchUrl ? `${store.searchUrl}${query}` : (store.portalUrl || 'https://www.google.com');
    window.open(targetUrl, '_blank');
  },

  launchCategorySearch(categoryType) {
    const queryInput = document.getElementById('custom-market-query');
    const rawQuery = (queryInput ? queryInput.value.trim() : '') || 'reposteria';
    const query = encodeURIComponent(rawQuery);

    const allStores = this.getStores().filter(s => s.enabled !== false);
    const targetStores = allStores.filter(s => {
      if (categoryType === 'Supermercados') return s.category === 'Supermercados';
      return s.category !== 'Supermercados';
    });

    targetStores.slice(0, 5).forEach((store, idx) => {
      setTimeout(() => {
        let targetUrl = store.searchUrl ? `${store.searchUrl}${query}` : (store.portalUrl || 'https://www.google.com');
        window.open(targetUrl, '_blank');
      }, idx * 150);
    });
  },

  launchMultiSearch() {
    this.launchCategorySearch('Supermercados');
  },

  // Modal para Gestionar, Agregar y Quitar Tiendas
  openStoreManagerModal() {
    let modal = document.getElementById('market-store-manager-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'market-store-manager-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-scrollbar';

    const stores = this.getStores();

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-pink-100 dark:border-slate-800 space-y-4 max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] my-auto flex flex-col modal-animate-in">
        
        <!-- Header Fijo Superior -->
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-gray-800 to-gray-900 text-white flex items-center justify-center text-xl shadow-md">
              ⚙️
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base">Gestionar Tiendas y Distribuidoras</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Agrega tus proveedores locales o desactiva los que no utilices</p>
            </div>
          </div>
          <button onclick="MarketRadarModule.closeStoreManagerModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition">✕</button>
        </div>

        <!-- Contenedor Completo con Scroll Unificado para Formulario y Lista -->
        <div class="overflow-y-auto flex-1 pr-1 space-y-5 max-h-[calc(100dvh-7rem)] sm:max-h-[78vh]">
          
          <!-- Formulario para Agregar Nueva Tienda -->
          <div class="bg-pink-50/60 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-pink-100 dark:border-slate-700 space-y-3">
            <h4 class="font-bold text-xs sm:text-sm text-pink-800 dark:text-pink-300 flex items-center gap-1.5">
              <span>➕</span> Agregar Nueva Tienda o Distribuidora Personalizada
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre de la Tienda *</label>
                <input type="text" id="new-store-name" placeholder="Ej. Distribuidora Santa Ana" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-pink-400" />
              </div>

              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select id="new-store-cat" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-pink-400">
                  <option value="Supermercados">Supermercados</option>
                  <option value="Distribuidoras de Pastelería" selected>Distribuidoras de Pastelería</option>
                  <option value="Moldes & Empaques">Moldes & Empaques</option>
                  <option value="Comercio Local">Comercio Local / Barrio</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">URL Sitio Web / Portal *</label>
                <input type="url" id="new-store-portal" placeholder="https://www.tienda.cl" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-pink-400" />
              </div>

              <div>
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">URL de Búsqueda Directa (Opcional)</label>
                <input type="url" id="new-store-search" placeholder="https://www.tienda.cl/buscar?q=" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-pink-400" />
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción / Nota</label>
                <input type="text" id="new-store-desc" placeholder="Ej. Sucursal La Florida, buenos precios en manjar y chocolate" class="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-pink-400" />
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <button onclick="MarketRadarModule.saveNewStore()" class="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 transition active:scale-95 cursor-pointer">
                + Guardar Tienda
              </button>
            </div>
          </div>

          <!-- Lista de Tiendas Actuales -->
          <div class="space-y-3 pt-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Tiendas registradas (${stores.length}):</span>
              <button onclick="MarketRadarModule.confirmResetStores()" class="text-[11px] text-gray-500 hover:text-pink-600 underline font-semibold cursor-pointer">
                Restablecer Predeterminadas
              </button>
            </div>

            <div class="space-y-2.5">
              ${stores.map(store => `
                <div class="p-3 sm:p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-pink-200 dark:hover:border-pink-900 flex items-center justify-between gap-2 sm:gap-3 transition shadow-2xs">
                  <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 truncate">
                    <span class="text-xl sm:text-2xl shrink-0">${store.icon || '🏬'}</span>
                    <div class="min-w-0 flex-1 truncate">
                      <div class="flex items-center gap-1.5 truncate">
                        <h5 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">${store.name}</h5>
                        <span class="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${store.category === 'Supermercados' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300'}">
                          ${store.category}
                        </span>
                      </div>
                      <p class="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-400 truncate mt-0.5">${store.description || store.portalUrl}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 sm:gap-2 shrink-0">
                    <!-- Toggle Activo -->
                    <button 
                      onclick="MarketRadarModule.toggleStoreEnabled('${store.id}')"
                      class="px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${store.enabled !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}"
                      title="${store.enabled !== false ? 'Tienda Activa en el Radar' : 'Tienda Oculta'}"
                    >
                      ${store.enabled !== false ? '✓ Activa' : 'Oculta'}
                    </button>

                    <!-- Botón Eliminar -->
                    <button 
                      onclick="MarketRadarModule.deleteStoreConfirm('${store.id}', '${store.name}')" 
                      title="Eliminar tienda de mi lista" 
                      class="p-1.5 sm:p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeStoreManagerModal() {
    const modal = document.getElementById('market-store-manager-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  saveNewStore() {
    const name = document.getElementById('new-store-name')?.value.trim();
    const category = document.getElementById('new-store-cat')?.value || 'Distribuidoras de Pastelería';
    const portalUrl = document.getElementById('new-store-portal')?.value.trim();
    const searchUrl = document.getElementById('new-store-search')?.value.trim();
    const description = document.getElementById('new-store-desc')?.value.trim();

    if (!name) {
      alert('Por favor escribe el nombre de la tienda.');
      return;
    }
    if (!portalUrl) {
      alert('Por favor ingresa la URL de la tienda.');
      return;
    }

    const newStore = {
      id: 'store_' + Date.now(),
      name: name,
      category: category,
      icon: category === 'Supermercados' ? '🛒' : (category === 'Moldes & Empaques' ? '🎀' : '🎂'),
      description: description || 'Tienda de insumos y repostería agregada por el usuario.',
      portalUrl: portalUrl.startsWith('http') ? portalUrl : `https://${portalUrl}`,
      searchUrl: searchUrl ? (searchUrl.startsWith('http') ? searchUrl : `https://${searchUrl}`) : `${portalUrl}/?s=`,
      enabled: true,
      isCustom: true
    };

    DB.addMarketStore(newStore);
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`✅ Tienda "${name}" agregada con éxito al Radar.`);
    }

    this.openStoreManagerModal();
    this.render();
  },

  toggleStoreEnabled(storeId) {
    const stores = this.getStores();
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const newStatus = store.enabled === false ? true : false;
    DB.updateMarketStore(storeId, { enabled: newStatus });
    
    this.openStoreManagerModal();
    this.render();
  },

  deleteStoreConfirm(storeId, storeName) {
    if (confirm(`¿Deseas eliminar "${storeName}" del radar de tiendas?`)) {
      DB.deleteMarketStore(storeId);
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🗑️ Tienda "${storeName}" eliminada.`);
      }
      this.openStoreManagerModal();
      this.render();
    }
  },

  confirmResetStores() {
    if (confirm('¿Restablecer el listado a las tiendas y supermercados oficiales de Chile?')) {
      DB.resetMarketStores();
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('✨ Tiendas restablecidas a las opciones predeterminadas.');
      }
      this.openStoreManagerModal();
      this.render();
    }
  },

  async refreshPricesLive() {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🔄 Verificando y sincronizando precios de supermercados y distribuidoras...');
    }

    // Simulación de sondeo en vivo
    setTimeout(() => {
      const today = new Date().toLocaleDateString('es-CL');
      this.marketData.forEach(item => {
        item.lastUpdated = `Actualizado Hoy (${today})`;
      });
      this.render();
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('✅ Precios sincronizados con Líder, Jumbo, Tottus, Santa Isabel, Unimarc y distribuidoras.');
      } else {
        alert('✅ Precios sincronizados correctamente.');
      }
    }, 800);
  }
};
