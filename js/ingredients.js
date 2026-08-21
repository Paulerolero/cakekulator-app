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

    const allIngredients = DB.getIngredients();
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
      <!-- Header de Insumos -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📦</span> Catálogo de Insumos & Empaques
          </h2>
          <p class="text-sm text-gray-500">Administra precios de compra, formatos y costos por gramo o unidad.</p>
        </div>
        <button onclick="IngredientsModule.openModal()" class="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium shadow-md shadow-pink-200 transition active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nuevo Insumo
        </button>
      </div>

      <!-- Barra de Búsqueda y Filtro de Categorías -->
      <div class="space-y-3 mb-5">
        <div class="relative">
          <input 
            type="text" 
            id="ingredient-search" 
            placeholder="Buscar por nombre (ej. Harina, Manjar, Cajas)..." 
            value="${this.searchQuery}"
            oninput="IngredientsModule.onSearch(this.value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white shadow-sm text-sm"
          />
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          ${this.searchQuery ? `
            <button onclick="IngredientsModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Pills de Categorías con scroll horizontal para móvil -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${categories.map(cat => `
            <button 
              onclick="IngredientsModule.filterByCategory('${cat}')"
              class="px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${this.activeCategory === cat ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-100'}">
              ${cat === 'all' ? '✨ Todos (' + allIngredients.length + ')' : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Insumos -->
      ${filtered.length === 0 ? `
        <div class="bg-white rounded-2xl p-8 text-center border border-pink-100 shadow-sm">
          <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🥣</div>
          <h3 class="text-base font-semibold text-gray-800">No se encontraron insumos</h3>
          <p class="text-xs text-gray-500 mt-1 mb-4">Intenta cambiar la búsqueda o agrega un nuevo ingrediente.</p>
          <button onclick="IngredientsModule.openModal()" class="btn-secondary px-4 py-2 rounded-xl text-xs font-medium text-pink-600 border border-pink-200 hover:bg-pink-50">
            + Agregar Insumo
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${filtered.map(ing => {
            const baseInfo = Calculator.getIngredientBaseUnitCost(ing);
            const unitLabel = baseInfo.baseUnit === 'g' ? 'gramo' : (baseInfo.baseUnit === 'ml' ? 'ml' : 'unidad');
            return `
              <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition relative flex flex-col justify-between group">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md ${this.getCategoryBadgeClass(ing.category)} mb-1">
                        ${ing.category || 'General'}
                      </span>
                      <h4 class="font-bold text-gray-900 text-base leading-tight">${ing.name}</h4>
                    </div>
                    <div class="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button onclick="IngredientsModule.openModal('${ing.id}')" title="Editar" class="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onclick="IngredientsModule.deleteConfirm('${ing.id}', '${ing.name}')" title="Eliminar" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Formato de Compra -->
                  <div class="mt-3 bg-pink-50/50 rounded-xl p-2.5 text-xs text-gray-600 space-y-1">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Formato compra:</span>
                      <span class="font-medium text-gray-800">${ing.packageQty} ${ing.packageUnit}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Precio compra:</span>
                      <span class="font-semibold text-gray-900">${Calculator.formatCurrency(ing.packagePrice)}</span>
                    </div>
                    ${ing.yieldWastePercent > 0 ? `
                      <div class="flex justify-between items-center text-amber-600">
                        <span>Merma / Desperdicio:</span>
                        <span class="font-medium">${ing.yieldWastePercent}%</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Costo Base Calculado -->
                <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span class="text-xs text-gray-500">Costo por ${unitLabel}:</span>
                  <span class="text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                    ${settings.currencySymbol} ${baseInfo.costPerBase < 10 ? baseInfo.costPerBase.toFixed(2) : Math.round(baseInfo.costPerBase)} / ${baseInfo.baseUnit}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Modal de Insumo (Overlay) -->
      <div id="ingredient-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between">
            <h3 id="ingredient-modal-title" class="font-bold text-lg flex items-center gap-2">
              <span>🍓</span> Nuevo Insumo
            </h3>
            <button onclick="IngredientsModule.closeModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form id="ingredient-form" onsubmit="IngredientsModule.saveForm(event)" class="p-5 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
            <input type="hidden" id="ing-id" value="">

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre del Insumo / Empaque *</label>
              <input 
                type="text" 
                id="ing-name" 
                required 
                placeholder="Ej. Harina sin polvos, Mantequilla sin sal, Caja torta"
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
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
                <label class="block text-xs font-semibold text-gray-700 mb-1">Cantidad Comprada *</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0.01" 
                  id="ing-qty" 
                  required 
                  placeholder="Ej. 1000, 250, 30"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Unidad de Medida *</label>
                <select id="ing-unit" required class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilos (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="l">Litros (L)</option>
                  <option value="u">Unidades (u)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Precio de Compra ($) *</label>
                <input 
                  type="number" 
                  step="any" 
                  min="0" 
                  id="ing-price" 
                  required 
                  placeholder="Ej. 1200, 2500, 6500"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Merma / Desperdicio (%)</label>
                <input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="90" 
                  id="ing-waste" 
                  value="0" 
                  placeholder="0"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <span class="text-[10px] text-gray-400">Ej. 10% en cáscaras de frutas</span>
              </div>
            </div>

            <!-- Vista previa del costo calculado en vivo -->
            <div id="ing-live-cost" class="bg-pink-50 p-3 rounded-xl text-xs text-pink-800 flex justify-between items-center font-medium">
              <span>Costo unitario calculado:</span>
              <span id="ing-live-cost-val" class="font-bold text-pink-600">$ 0</span>
            </div>

            <div class="flex gap-2 pt-2">
              <button type="button" onclick="IngredientsModule.closeModal()" class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold shadow-md shadow-pink-200 transition">
                Guardar Insumo
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachLiveCostListeners();
  },

  getCategoryBadgeClass(category) {
    switch (category) {
      case 'Secos': return 'bg-amber-100 text-amber-800';
      case 'Lácteos y Grasas': return 'bg-blue-100 text-blue-800';
      case 'Huevos': return 'bg-yellow-100 text-yellow-800';
      case 'Rellenos': return 'bg-orange-100 text-orange-800';
      case 'Chocolates': return 'bg-amber-900/10 text-amber-900';
      case 'Frutas': return 'bg-rose-100 text-rose-800';
      case 'Esencias': return 'bg-purple-100 text-purple-800';
      case 'Decoración': return 'bg-fuchsia-100 text-fuchsia-800';
      case 'Empaque': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
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
    const modal = document.getElementById('ingredient-modal');
    const title = document.getElementById('ingredient-modal-title');
    const form = document.getElementById('ingredient-form');

    if (id) {
      const ing = DB.getIngredientById(id);
      if (!ing) return;
      title.innerHTML = '<span>✏️</span> Editar Insumo';
      document.getElementById('ing-id').value = ing.id;
      document.getElementById('ing-name').value = ing.name;
      document.getElementById('ing-category').value = ing.category || 'Secos';
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
    modal.classList.remove('hidden');
  },

  closeModal() {
    const modal = document.getElementById('ingredient-modal');
    if (modal) modal.classList.add('hidden');
    this.editingId = null;
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
