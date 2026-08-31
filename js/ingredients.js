// ==========================================
// Cakekulator - Módulo de Gestión de Insumos
// ==========================================

const IngredientsModule = {
  activeCategory: 'all',
  searchQuery: '',
  editingId: null,

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('ingredients-view');
    if (!container) return;

    const isServicesMode = (typeof App !== 'undefined' && App.currentMode === 'services');
    let allIngredients = DB.getIngredients();

    // Filtrar insumos según ambiente activo
    if (isServicesMode) {
      allIngredients = allIngredients.filter(i => i.itemType === 'service' || i.yieldApplications > 0 || ['facial', 'corporal', 'massage', 'nails', 'hair', 'service', 'spa', 'crema', 'aceite', 'guantes', 'desechable'].some(c => (i.category || '').toLowerCase().includes(c)));
    } else {
      allIngredients = allIngredients.filter(i => (i.itemType || 'product') === 'product' && !['facial', 'corporal', 'massage', 'nails', 'hair', 'service', 'spa'].some(c => (i.category || '').toLowerCase().includes(c)));
    }

    const categories = ['all', ...new Set(allIngredients.map(i => i.category).filter(Boolean))];

    // Filtrado
    let filtered = allIngredients.filter(item => {
      const matchesCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchesSearch = !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    const settings = DB.getSettings();

    container.innerHTML = `
      <!-- Barra Superior de Acciones y Búsqueda -->
      <div class="space-y-2.5 sm:space-y-3 mb-3 sm:mb-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="ingredient-search" 
              placeholder="${isServicesMode ? 'Buscar insumo de cabina (ej. Aceite Almendras, Ácido Hialurónico, Guantes)...' : 'Buscar ingrediente (ej. Harina, Manjar, Cajas)...'}" 
              value="${this.searchQuery}"
              oninput="IngredientsModule.onSearch(this.value)"
              class="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border ${isServicesMode ? 'border-teal-200 focus:ring-teal-400' : 'border-pink-200 focus:ring-pink-400'} focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-xs text-xs sm:text-sm"
            />
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-2.5 sm:top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            ${this.searchQuery ? `
              <button onclick="IngredientsModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            ` : ''}
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button onclick="ReceiptScannerModule.openModal()" class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl ${isServicesMode ? 'bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' : 'bg-pink-100 hover:bg-pink-200 text-pink-700'} font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap">
              <span>🧾</span> Agregar Boleta
            </button>
            <button onclick="IngredientsModule.openModal()" class="flex-1 sm:flex-none ${isServicesMode ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'btn-primary'} flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-95 whitespace-nowrap">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              ${isServicesMode ? 'Insumo de Cabina' : 'Nuevo Insumo'}
            </button>
          </div>
        </div>

        <!-- Pills de Categorías con scroll horizontal para móvil -->
        <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${categories.map(cat => `
            <button 
              onclick="IngredientsModule.filterByCategory('${cat}')"
              class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap transition-colors ${this.activeCategory === cat ? (isServicesMode ? 'bg-teal-600 text-white shadow-xs font-bold' : 'bg-pink-500 text-white shadow-xs font-bold') : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 border border-gray-100 dark:border-slate-700'}">
              ${cat === 'all' ? (isServicesMode ? '✨ Todos los Insumos (' + allIngredients.length + ')' : '✨ Todos (' + allIngredients.length + ')') : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Insumos -->
      ${filtered.length === 0 ? `
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border ${isServicesMode ? 'border-teal-100' : 'border-pink-100'} dark:border-slate-800 shadow-sm">
          <div class="w-16 h-16 ${isServicesMode ? 'bg-teal-50 dark:bg-teal-950/60' : 'bg-pink-50 dark:bg-pink-950/60'} rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            ${isServicesMode ? '🧴' : '🥣'}
          </div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
            ${isServicesMode ? 'No se encontraron insumos de cabina' : 'No se encontraron insumos'}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
            ${isServicesMode ? 'Agrega cremas, aceites, sueros o desechables con cálculo de dosis por sesión.' : 'Intenta cambiar la búsqueda o agrega un nuevo ingrediente.'}
          </p>
          <button onclick="IngredientsModule.openModal()" class="px-4 py-2 rounded-xl text-xs font-bold ${isServicesMode ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100' : 'btn-secondary text-pink-600 border border-pink-200 hover:bg-pink-50'}">
            ${isServicesMode ? '+ Agregar Insumo de Cabina' : '+ Agregar Insumo'}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-16 sm:pb-0">
          ${filtered.map(ing => {
            const baseInfo = Calculator.getIngredientBaseUnitCost(ing);
            const unitLabel = baseInfo.baseUnit === 'g' ? 'gramo' : (baseInfo.baseUnit === 'ml' ? 'ml' : 'unidad');
            return `
              <div onclick="IngredientsModule.openModal('${ing.id}')" class="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md ${isServicesMode ? 'hover:border-teal-300 dark:hover:border-teal-500' : 'hover:border-pink-300 dark:hover:border-pink-500'} transition relative flex flex-col justify-between group cursor-pointer active:scale-[0.99]">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md ${this.getCategoryBadgeClass(ing.category)} mb-1">
                        ${ing.category || 'General'}
                      </span>
                      <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">${ing.name}</h4>
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="event.stopPropagation(); IngredientsModule.deleteConfirm('${ing.id}', '${ing.name}')" title="Eliminar insumo" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Formato de Compra -->
                  <div class="mt-3 bg-pink-50/50 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500 dark:text-gray-400">Formato compra:</span>
                      <span class="font-medium text-gray-800 dark:text-gray-200">${ing.packageQty} ${ing.packageUnit}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500 dark:text-gray-400">Precio compra:</span>
                      <span class="font-semibold text-gray-900 dark:text-gray-100">${Calculator.formatCurrency(ing.packagePrice)}</span>
                    </div>
                    ${ing.yieldWastePercent > 0 ? `
                      <div class="flex justify-between items-center text-amber-600 dark:text-amber-400">
                        <span>Merma / Desperdicio:</span>
                        <span class="font-medium">${ing.yieldWastePercent}%</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Costo Base Calculado -->
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span class="text-xs text-gray-500 dark:text-gray-400">Costo por ${unitLabel}:</span>
                  <span class="text-sm font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-md">
                    ${settings.currencySymbol} ${baseInfo.costPerBase < 10 ? baseInfo.costPerBase.toFixed(2) : Math.round(baseInfo.costPerBase)} / ${baseInfo.baseUnit}
                  </span>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      `}
    `;
  },

  ensureModal() {
    let modal = document.getElementById('ingredient-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ingredient-modal';
      modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs hidden flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
          <div class="bg-pink-600 dark:bg-slate-800 p-4 text-white flex items-center justify-between shrink-0">
            <h3 id="ingredient-modal-title" class="font-bold text-lg flex items-center gap-2">
              <span>🍓</span> Nuevo Insumo
            </h3>
            <button onclick="IngredientsModule.closeModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form id="ingredient-form" onsubmit="IngredientsModule.saveForm(event)" class="p-4 sm:p-5 space-y-4 text-sm overflow-y-auto flex-1">
            <input type="hidden" id="ing-id" value="">

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Insumo / Empaque *</label>
              <input 
                type="text" 
                id="ing-name" 
                required 
                placeholder="Ej. Harina sin polvos, Mantequilla sin sal, Caja torta"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select id="ing-category" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                <option value="Secos">Secos (Harina, Azúcar, Polvos, Cacao)</option>
                <option value="Lácteos y Grasas">Lácteos y Grasas (Mantequilla, Crema, Leche, Queso)</option>
                <option value="Huevos">Huevos</option>
                <option value="Rellenos">Rellenos (Manjar, Mermeladas, Nutella)</option>
                <option value="Chocolates">Chocolates & Coberturas</option>
                <option value="Frutas">Frutas Frescas</option>
                <option value="Esencias">Esencias & Sabores</option>
                <option value="Decoración">Decoración (Sprinkles, Coco, Frutos secos)</option>
                <option value="Empaque">Empaque & Presentación (Cajas, Domos, Cintas, Pirotines)</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Cantidad Comprada *</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  id="ing-qty" 
                  required 
                  placeholder="Ej. 1000, 250, 30"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Unidad de Medida *</label>
                <select id="ing-unit" required class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="l">Litros (L)</option>
                  <option value="un">Unidades (un)</option>
                  <option value="caja">Caja / Paquete</option>
                  <option value="taza">Taza / Cup</option>
                  <option value="cda">Cucharada (cda)</option>
                  <option value="cdta">Cucharadita (cdta)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Precio Total Pagado ($) *</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  id="ing-price" 
                  required 
                  placeholder="Ej. 1290, 4500"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white font-bold"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Merma / Desperdicio (%)</label>
                <input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="90" 
                  id="ing-waste" 
                  value="0" 
                  placeholder="0"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                />
                <span class="text-[10px] text-gray-400">Ej. 10% en cáscaras de frutas</span>
              </div>
            </div>

            <!-- Vista previa del costo calculado en vivo -->
            <div id="ing-live-cost" class="bg-pink-50 dark:bg-slate-800 p-3 rounded-xl text-xs text-pink-800 dark:text-pink-300 flex justify-between items-center font-medium border border-pink-100 dark:border-slate-700">
              <span>Costo unitario calculado:</span>
              <span id="ing-live-cost-val" class="font-bold text-pink-600 dark:text-pink-400">$ 0</span>
            </div>

            <div class="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onclick="IngredientsModule.closeModal()" class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-md shadow-pink-200 transition">
                Guardar Insumo
              </button>
            </div>
          </form>
        </div>
      `;
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
      this.attachLiveCostListeners();
    }
  },

  getCategoryBadgeClass(category) {
    switch (category) {
      // Insumos de Cabina & Spa
      case 'Aceites & Cremas': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800';
      case 'Facial & Serums': return 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800';
      case 'Desechables & Cabina': return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800';
      case 'Uñas & Esmaltes': return 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800';
      case 'Pestañas & Adhesivos': return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800';
      case 'Ceras & Depilación': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800';
      case 'Esterilización & Aseo': return 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700';
      case 'Aromaterapia & Bienestar': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800';

      // Pastelería
      case 'Secos': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800';
      case 'Lácteos y Grasas': return 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800';
      case 'Huevos': return 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800';
      case 'Rellenos': return 'bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800';
      case 'Chocolates': return 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-200 border border-stone-400 dark:border-stone-700';
      case 'Frutas': return 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800';
      case 'Esencias': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800';
      case 'Decoración': return 'bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-900 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-800';
      case 'Empaque': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-slate-700';
    }
  },

  onSearch(val) {
    this.searchQuery = val;
    this.render();
    // Mantener foco en el input
    const input = document.getElementById('ingredient-search');
    if (input) {
      input.focus();
      input.setSelectionRange(val.length, val.length);
    }
  },

  clearSearch() {
    this.searchQuery = '';
    this.render();
  },

  filterByCategory(cat) {
    this.activeCategory = cat;
    this.render();
  },

  openModal(id = null) {
    this.editingId = id;
    this.ensureModal();
    const modal = document.getElementById('ingredient-modal');
    if (!modal) return;
    const form = document.getElementById('ingredient-form');
    const title = document.getElementById('ingredient-modal-title');
    if (!form || !title) return;

    if (id) {
      const ing = DB.getIngredientById(id);
      if (!ing) return;
      title.innerHTML = '<span>✏️</span> Editar Insumo';
      document.getElementById('ing-id').value = ing.id;
      document.getElementById('ing-name').value = ing.name;
      document.getElementById('ing-category').value = ing.category;
      document.getElementById('ing-qty').value = ing.packageQty;
      document.getElementById('ing-unit').value = ing.packageUnit;
      document.getElementById('ing-price').value = ing.packagePrice;
      document.getElementById('ing-waste').value = ing.yieldWastePercent || 0;
    } else {
      title.innerHTML = '<span>🍓</span> Nuevo Insumo';
      form.reset();
      document.getElementById('ing-id').value = '';
      document.getElementById('ing-waste').value = 0;
    }

    this.updateLiveCostPreview();
    App.openModal('ingredient-modal');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeModal() {
    App.closeModal('ingredient-modal');
    this.editingId = null;
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  attachLiveCostListeners() {
    ['ing-qty', 'ing-unit', 'ing-price', 'ing-waste'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateLiveCostPreview());
        el.addEventListener('change', () => this.updateLiveCostPreview());
      }
    });
  },

  updateLiveCostPreview() {
    const qty = parseFloat(document.getElementById('ing-qty')?.value) || 0;
    const unit = document.getElementById('ing-unit')?.value || 'g';
    const price = parseFloat(document.getElementById('ing-price')?.value) || 0;
    const waste = parseFloat(document.getElementById('ing-waste')?.value) || 0;
    const costValEl = document.getElementById('ing-live-cost-val');

    if (!costValEl) return;

    if (qty > 0 && price > 0) {
      const dummy = { packageQty: qty, packageUnit: unit, packagePrice: price, yieldWastePercent: waste };
      const baseInfo = Calculator.getIngredientBaseUnitCost(dummy);
      costValEl.textContent = `${Calculator.formatCurrency(baseInfo.costPerBase)} / ${baseInfo.baseUnit}`;
    } else {
      costValEl.textContent = '$ 0';
    }
  },

  saveForm(e) {
    e.preventDefault();
    const id = document.getElementById('ing-id').value;
    const name = document.getElementById('ing-name').value.trim();
    const category = document.getElementById('ing-category').value;
    const packageQty = parseFloat(document.getElementById('ing-qty').value);
    const packageUnit = document.getElementById('ing-unit').value;
    const packagePrice = parseFloat(document.getElementById('ing-price').value);
    const yieldWastePercent = parseFloat(document.getElementById('ing-waste').value) || 0;

    const data = {
      name,
      category,
      packageQty,
      packageUnit,
      packagePrice,
      yieldWastePercent
    };

    if (id) {
      DB.updateIngredient(id, data);
    } else {
      DB.addIngredient(data);
    }

    this.closeModal();
    this.render();

    // Notificación toast
    App.showToast(id ? 'Insumo actualizado con éxito' : 'Nuevo insumo agregado');
  },

  deleteConfirm(id, name) {
    if (confirm(`¿Estás seguro de eliminar el insumo "${name}"?`)) {
      DB.deleteIngredient(id);
      this.render();
      App.showToast('Insumo eliminado');
    }
  }
};
