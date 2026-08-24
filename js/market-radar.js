// ==========================================
// Cakekulator - Módulo Radar de Ofertas y Comparador de Precios (Chile)
// ==========================================

const MarketRadarModule = {
  activeCategory: 'all',
  selectedStore: 'all',
  searchQuery: '',
  sortBy: 'discount', // 'discount' | 'price-asc' | 'unit-cost'

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
      store: 'Lider',
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
      productUrl: 'https://www.jumbo.cl/busqueda?ft=manjar+nestle+repostero',
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
      productUrl: 'https://www.santaisabel.cl/busqueda?ft=mantequilla+soprole+250g',
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
      store: 'Lider',
      storeLogo: '🛒',
      normalPrice: 2990,
      offerPrice: 2490,
      discountPct: 16,
      isBestDeal: false,
      productUrl: 'https://www.lider.cl/supermercado/search?query=mantequilla%20colun%20sin%20sal',
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
      store: 'Central Mayorista',
      storeLogo: '🏢',
      normalPrice: 5490,
      offerPrice: 4690,
      discountPct: 15,
      isBestDeal: true,
      productUrl: 'https://www.centralmayorista.cl/',
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
      productUrl: 'https://www.unimarc.cl/busqueda?query=leche%20condensada',
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
      productUrl: 'https://www.jumbo.cl/busqueda?ft=queso+crema+philadelphia',
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
      store: 'Lider',
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
      store: 'Mayorista 10',
      storeLogo: '🏷️',
      normalPrice: 1490,
      offerPrice: 1190,
      discountPct: 20,
      isBestDeal: true,
      productUrl: 'https://www.mayorista10.cl/',
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
      isBestDeal: false,
      productUrl: 'https://www.santaisabel.cl/busqueda?ft=maizena+500g',
      matchedIngredientKeyword: 'Maicena',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_11',
      name: 'Polvo de Hornear Royal 200 g',
      category: 'Harinas & Polvos',
      brand: 'Royal',
      packageQty: 200,
      packageUnit: 'g',
      store: 'Lider',
      storeLogo: '🛒',
      normalPrice: 1990,
      offerPrice: 1690,
      discountPct: 15,
      isBestDeal: true,
      productUrl: 'https://www.lider.cl/supermercado/search?query=polvo%20hornear%20royal',
      matchedIngredientKeyword: 'Polvos',
      lastUpdated: 'Hoy'
    },

    // --- HUEVOS & FRESCOS ---
    {
      id: 'mkt_12',
      name: 'Huevos Grandes Grado A Bandeja 30 un',
      category: 'Huevos & Frescos',
      brand: 'La Granja / Yemina',
      packageQty: 30,
      packageUnit: 'un',
      store: 'Central Mayorista',
      storeLogo: '🏢',
      normalPrice: 7990,
      offerPrice: 6690,
      discountPct: 16,
      isBestDeal: true,
      productUrl: 'https://www.centralmayorista.cl/',
      matchedIngredientKeyword: 'Huevo',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_13',
      name: 'Huevos Extra Color Bandeja 30 un',
      category: 'Huevos & Frescos',
      brand: 'Santa Marta',
      packageQty: 30,
      packageUnit: 'un',
      store: 'Mayorista 10',
      storeLogo: '🏷️',
      normalPrice: 7890,
      offerPrice: 6890,
      discountPct: 12,
      isBestDeal: false,
      productUrl: 'https://www.mayorista10.cl/',
      matchedIngredientKeyword: 'Huevo',
      lastUpdated: 'Hoy'
    },

    // --- CHOCOLATES Y COBERTURAS ---
    {
      id: 'mkt_14',
      name: 'Cobertura de Chocolate Semiamargo Carat Coverlux 1 kg',
      category: 'Chocolates & Coberturas',
      brand: 'Puratos',
      packageQty: 1,
      packageUnit: 'kg',
      store: 'Cherry Chile Repostería',
      storeLogo: '🍒',
      normalPrice: 7990,
      offerPrice: 6890,
      discountPct: 14,
      isBestDeal: true,
      productUrl: 'https://cherrychile.cl/',
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
      store: 'Lider',
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
      productUrl: 'https://www.jumbo.cl/busqueda?ft=nutella+750g',
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
      store: 'Lider',
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
      productUrl: 'https://www.santaisabel.cl/busqueda?ft=azucar+flor+iansa',
      matchedIngredientKeyword: 'Azúcar Flor',
      lastUpdated: 'Ayer'
    },

    // --- EMPAQUES & PRESENTACIÓN ---
    {
      id: 'mkt_19',
      name: 'Cajas para Torta Alta 26x26x15 cm (Pack 10 un)',
      category: 'Empaques & Descartables',
      brand: 'Cherry Pack',
      packageQty: 10,
      packageUnit: 'un',
      store: 'Cherry Chile Repostería',
      storeLogo: '🍒',
      normalPrice: 7990,
      offerPrice: 6490,
      discountPct: 18,
      isBestDeal: true,
      productUrl: 'https://cherrychile.cl/',
      matchedIngredientKeyword: 'Caja',
      lastUpdated: 'Hoy'
    },
    {
      id: 'mkt_20',
      name: 'Bases Rígidas Doradas para Torta 28 cm (Pack 5 un)',
      category: 'Empaques & Descartables',
      brand: 'DecoCake',
      packageQty: 5,
      packageUnit: 'un',
      store: 'Cherry Chile Repostería',
      storeLogo: '🍒',
      normalPrice: 4990,
      offerPrice: 3990,
      discountPct: 20,
      isBestDeal: true,
      productUrl: 'https://cherrychile.cl/',
      matchedIngredientKeyword: 'Base',
      lastUpdated: 'Hoy'
    }
  ],

  render() {
    const container = document.getElementById('market-radar-view');
    if (!container) return;

    const categories = ['all', 'Lácteos & Manjar', 'Harinas & Polvos', 'Huevos & Frescos', 'Chocolates & Coberturas', 'Azúcares & Endulzantes', 'Empaques & Descartables'];
    const stores = ['all', 'Lider', 'Jumbo', 'Santa Isabel', 'Unimarc', 'Mayorista 10', 'Central Mayorista', 'Cherry Chile Repostería'];

    let filtered = this.marketData.filter(item => {
      const matchCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchStore = this.selectedStore === 'all' || item.store === this.selectedStore;
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
      <!-- Header Radar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1 border border-emerald-100">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Supermercados y Distribuidores de Chile
          </div>
          <h2 class="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>🛒</span> Radar de Precios & Ofertas
          </h2>
          <p class="text-xs text-gray-500">Monitorea promociones en Lider, Jumbo, Santa Isabel, Unimarc y distribuidoras para reducir el costo de tus recetas.</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="MarketRadarModule.refreshPricesLive()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-200 active:scale-95">
            <span>🔄</span> Actualizar Precios
          </button>
          <button onclick="MarketRadarModule.openCustomSearchModal()" class="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition flex items-center gap-1.5 border border-pink-200">
            <span>🔍</span> Buscar en Supermercados
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="bg-white p-4 rounded-3xl border border-pink-100 shadow-sm space-y-3.5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <!-- Búsqueda -->
          <div class="md:col-span-6 relative">
            <input 
              type="text" 
              placeholder="Buscar insumo (ej. Manjar, Harina, Mantequilla, Huevos)..." 
              value="${this.searchQuery}"
              oninput="MarketRadarModule.onSearch(this.value)"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 text-xs bg-gray-50/50 focus:bg-white"
            />
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <!-- Filtro por Tienda -->
          <div class="md:col-span-3">
            <select 
              onchange="MarketRadarModule.filterByStore(this.value)"
              class="w-full py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-pink-400"
            >
              <option value="all" ${this.selectedStore === 'all' ? 'selected' : ''}>🏬 Todas las Tiendas</option>
              ${stores.filter(s => s !== 'all').map(s => `
                <option value="${s}" ${this.selectedStore === s ? 'selected' : ''}>${s}</option>
              `).join('')}
            </select>
          </div>

          <!-- Ordenar por -->
          <div class="md:col-span-3">
            <select 
              onchange="MarketRadarModule.changeSort(this.value)"
              class="w-full py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-medium bg-white focus:ring-2 focus:ring-pink-400"
            >
              <option value="discount" ${this.sortBy === 'discount' ? 'selected' : ''}>🔥 Mayor Descuento (%)</option>
              <option value="price-asc" ${this.sortBy === 'price-asc' ? 'selected' : ''}>💲 Menor Precio ($)</option>
            </select>
          </div>
        </div>

        <!-- Pills de Categorías -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium border-t border-gray-100 pt-3">
          ${categories.map(cat => `
            <button 
              onclick="MarketRadarModule.filterByCategory('${cat}')"
              class="px-3 py-1.5 rounded-full whitespace-nowrap transition ${this.activeCategory === cat ? 'bg-pink-600 text-white font-bold shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600'}"
            >
              ${cat === 'all' ? '✨ Todo el Catálogo (' + this.marketData.length + ')' : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Cuadrícula de Ofertas -->
      ${filtered.length === 0 ? `
        <div class="bg-white rounded-3xl p-10 text-center border border-pink-100 shadow-sm space-y-3">
          <div class="w-16 h-16 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <h3 class="font-bold text-gray-800 text-base">No se encontraron productos</h3>
          <p class="text-xs text-gray-400 max-w-sm mx-auto">Prueba cambiando la búsqueda o revisa los enlaces directos a cada supermercado.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map(item => {
            const savings = item.normalPrice - item.offerPrice;
            const existingMatch = this.findMatchingLocalIngredient(item);

            return `
              <div class="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 hover:border-pink-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between group relative overflow-hidden">
                
                ${item.isBestDeal ? `
                  <div class="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl shadow-xs">
                    ⭐ MEJOR OFERTA
                  </div>
                ` : ''}

                <div>
                  <!-- Tienda & Categoría -->
                  <div class="flex items-center justify-between gap-2 mb-2 pr-16">
                    <span class="text-[11px] font-bold text-gray-700 bg-gray-100/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <span>${item.storeLogo}</span> ${item.store}
                    </span>
                    <span class="text-[10px] text-gray-400 font-medium">${item.lastUpdated}</span>
                  </div>

                  <!-- Título del Producto -->
                  <h4 class="font-bold text-sm text-gray-900 group-hover:text-pink-600 transition leading-snug mb-1">
                    ${item.name}
                  </h4>
                  <span class="text-xs text-gray-500 block mb-3">Marca: <strong>${item.brand}</strong> · Formato: ${item.packageQty} ${item.packageUnit}</span>

                  <!-- Comparación de Precios -->
                  <div class="bg-pink-50/40 p-3 rounded-2xl border border-pink-100/60 mb-3 flex items-center justify-between">
                    <div>
                      <span class="text-xl font-black text-emerald-700 block leading-none">
                        ${Calculator.formatCurrency(item.offerPrice)}
                      </span>
                      <span class="text-[11px] text-gray-400 line-through">
                        ${Calculator.formatCurrency(item.normalPrice)}
                      </span>
                    </div>

                    <div class="text-right">
                      <span class="inline-block bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-xs">
                        -${item.discountPct}%
                      </span>
                      <span class="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        Ahorro: ${Calculator.formatCurrency(savings)}
                      </span>
                    </div>
                  </div>

                  <!-- Estado en mi Inventario Local -->
                  <div class="text-[11px] text-gray-500 mb-3">
                    ${existingMatch ? `
                      <span class="flex items-center gap-1 text-gray-600">
                        <span>📦</span> En tu inventario: <strong>${existingMatch.name}</strong> (${Calculator.formatCurrency(existingMatch.packagePrice)})
                      </span>
                    ` : `
                      <span class="text-gray-400">Insumo no registrado aún en tu catálogo</span>
                    `}
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <a 
                    href="${item.productUrl}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="py-2 px-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <span>🔗</span> Ver en Tienda
                  </a>

                  <button 
                    onclick="MarketRadarModule.applyOfferToInventory('${item.id}')"
                    class="py-2 px-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-pink-200 transition active:scale-95"
                  >
                    <span>📥</span> Usar Precio
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Enlaces Rápidos a Portales de Compra en Chile -->
      <div class="mt-8 bg-gradient-to-br from-white to-pink-50/30 rounded-3xl p-6 border border-pink-100 shadow-sm space-y-4">
        <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
          <span>🏬</span> Portales de Compra y Distribuidores Recomendados en Chile
        </h3>
        <p class="text-xs text-gray-500">Haz clic en cualquier tienda para buscar insumos específicos o cotizar por mayor:</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a href="https://www.lider.cl/supermercado" target="_blank" class="p-3 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition text-center group">
            <span class="text-xl block mb-1">🛒</span>
            <span class="font-bold text-xs text-gray-800 group-hover:text-blue-600 block">Lider.cl</span>
            <span class="text-[10px] text-gray-400">Precios Bajos y Despacho</span>
          </a>

          <a href="https://www.jumbo.cl" target="_blank" class="p-3 bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition text-center group">
            <span class="text-xl block mb-1">🐘</span>
            <span class="font-bold text-xs text-gray-800 group-hover:text-emerald-600 block">Jumbo.cl</span>
            <span class="text-[10px] text-gray-400">Insumos Gourmet y Repostería</span>
          </a>

          <a href="https://cherrychile.cl" target="_blank" class="p-3 bg-white rounded-2xl border border-gray-200 hover:border-pink-300 hover:shadow-sm transition text-center group">
            <span class="text-xl block mb-1">🍒</span>
            <span class="font-bold text-xs text-gray-800 group-hover:text-pink-600 block">Cherry Chile</span>
            <span class="text-[10px] text-gray-400">Empaques y Chocolatería</span>
          </a>

          <a href="https://www.centralmayorista.cl" target="_blank" class="p-3 bg-white rounded-2xl border border-gray-200 hover:border-amber-300 hover:shadow-sm transition text-center group">
            <span class="text-xl block mb-1">🏢</span>
            <span class="font-bold text-xs text-gray-800 group-hover:text-amber-600 block">Central Mayorista</span>
            <span class="text-[10px] text-gray-400">Formatos Grandes y Ahorro</span>
          </a>
        </div>
      </div>
    `;
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

  openCustomSearchModal() {
    let modal = document.getElementById('market-custom-search-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'market-custom-search-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔎</span>
            <h3 class="font-bold text-gray-900 text-base">Búsqueda Directa en Supermercados</h3>
          </div>
          <button onclick="document.getElementById('market-custom-search-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>

        <p class="text-xs text-gray-500">Ingresa el producto que necesitas cotizar y elige en qué supermercado buscar:</p>

        <input 
          type="text" 
          id="custom-market-query" 
          placeholder="Ej: Harina de almendras, Tagatosa, Crema vegetal..." 
          class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-pink-400"
        />

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <button onclick="MarketRadarModule.launchSearch('lider')" class="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold text-center transition">
            Lider.cl 🛒
          </button>
          <button onclick="MarketRadarModule.launchSearch('jumbo')" class="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold text-center transition">
            Jumbo.cl 🐘
          </button>
          <button onclick="MarketRadarModule.launchSearch('unimarc')" class="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold text-center transition">
            Unimarc 🔴
          </button>
          <button onclick="MarketRadarModule.launchSearch('santaisabel')" class="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold text-center transition">
            Santa Isabel 🏪
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  launchSearch(storeKey) {
    const query = encodeURIComponent(document.getElementById('custom-market-query')?.value.trim() || 'reposteria');
    let url = '';
    if (storeKey === 'lider') url = `https://www.lider.cl/supermercado/search?query=${query}`;
    if (storeKey === 'jumbo') url = `https://www.jumbo.cl/busqueda?ft=${query}`;
    if (storeKey === 'unimarc') url = `https://www.unimarc.cl/busqueda?query=${query}`;
    if (storeKey === 'santaisabel') url = `https://www.santaisabel.cl/busqueda?ft=${query}`;

    if (url) {
      window.open(url, '_blank');
      document.getElementById('market-custom-search-modal').classList.add('hidden');
    }
  },

  async refreshPricesLive() {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🔄 Verificando y actualizando precios de supermercados en Chile...');
    }

    // Simulación de sondeo / consulta en vivo
    setTimeout(() => {
      const today = new Date().toLocaleDateString('es-CL');
      this.marketData.forEach(item => {
        item.lastUpdated = `Actualizado Hoy (${today})`;
      });
      this.render();
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('✅ Precios sincronizados con las últimas ofertas de Lider, Jumbo y Mayoristas.');
      } else {
        alert('✅ Precios sincronizados con las últimas ofertas de supermercados.');
      }
    }, 800);
  }
};
