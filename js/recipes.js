// ==========================================
// Cakekulator - Módulo de Recetas y Costeos
// ==========================================

const RecipesModule = {
  activeCategory: 'all',
  searchQuery: '',
  currentRecipeData: null, // Para el formulario de edición
  viewingRecipeId: null,

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('recipes-view');
    if (!container) return;

    const allRecipes = DB.getRecipes();
    const allIngredients = DB.getIngredients();
    const ingredientsMap = new Map(allIngredients.map(i => [i.id, i]));
    const categories = ['all', ...new Set(allRecipes.map(r => r.category).filter(Boolean))];

    // Filtrar recetas
    let filtered = allRecipes.filter(r => {
      const matchesCat = this.activeCategory === 'all' || r.category === this.activeCategory;
      const matchesSearch = !this.searchQuery || 
        r.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    container.innerHTML = `
      <!-- Header de Recetas -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🎂</span> Fichas Técnicas y Costeos
          </h2>
          <p class="text-sm text-gray-500">Calcula costos por lote, unidad y porción para tortas, alfajores, galletas y más.</p>
        </div>
        <button onclick="RecipesModule.openEditor()" class="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium shadow-md shadow-pink-200 transition active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Receta
        </button>
      </div>

      <!-- Barra de Búsqueda y Categorías -->
      <div class="space-y-3 mb-5">
        <div class="relative">
          <input 
            type="text" 
            id="recipe-search" 
            placeholder="Buscar receta (ej. Alfajores, Torta de Chocolate, Cupcakes)..." 
            value="${this.searchQuery}"
            oninput="RecipesModule.onSearch(this.value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white shadow-sm text-sm"
          />
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          ${this.searchQuery ? `
            <button onclick="RecipesModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Categorías -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${categories.map(cat => `
            <button 
              onclick="RecipesModule.filterByCategory('${cat}')"
              class="px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${this.activeCategory === cat ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-100'}">
              ${cat === 'all' ? '✨ Todas (' + allRecipes.length + ')' : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Recetas -->
      ${filtered.length === 0 ? `
        <div class="bg-white rounded-2xl p-8 text-center border border-pink-100 shadow-sm">
          <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">👩‍🍳</div>
          <h3 class="text-base font-semibold text-gray-800">No se encontraron recetas</h3>
          <p class="text-xs text-gray-500 mt-1 mb-4">Crea tu primera ficha técnica para empezar a costear.</p>
          <button onclick="RecipesModule.openEditor()" class="btn-secondary px-4 py-2 rounded-xl text-xs font-medium text-pink-600 border border-pink-200 hover:bg-pink-50">
            + Crear Ficha Técnica
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map(recipe => {
            const costs = Calculator.calculateRecipeFullCosts(recipe, ingredientsMap);
            const isCake = recipe.type === 'cake';
            return `
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group">
                <div class="p-4">
                  <!-- Header Card -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md ${this.getCategoryBadgeClass(recipe.category)}">
                          ${recipe.category || 'General'}
                        </span>
                        <span class="px-2 py-0.5 text-[10px] font-medium rounded-md bg-purple-50 text-purple-700">
                          ${isCake ? `🎂 Torta (${recipe.yieldPortions} porciones)` : `📦 Lote de ${recipe.yieldUnits} ${recipe.unitName || 'un'}`}
                        </span>
                      </div>
                      <h3 class="font-bold text-gray-900 text-base leading-tight">${recipe.name}</h3>
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="RecipesModule.duplicateRecipe('${recipe.id}')" title="Duplicar receta" class="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                      </button>
                      <button onclick="RecipesModule.deleteRecipe('${recipe.id}', '${recipe.name}')" title="Eliminar" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  ${recipe.description ? `<p class="text-xs text-gray-500 line-clamp-2 mb-3">${recipe.description}</p>` : ''}

                  <!-- Métricas de Costo -->
                  <div class="grid grid-cols-2 gap-2 bg-pink-50/40 rounded-xl p-2.5 mb-3 text-xs">
                    <div>
                      <span class="text-gray-500 text-[11px] block">Costo Total Lote:</span>
                      <span class="font-bold text-gray-900 text-sm">${Calculator.formatCurrency(costs.totalBatchCost)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 text-[11px] block">${isCake ? 'Costo por Porción:' : 'Costo Unitario:'}</span>
                      <span class="font-bold text-pink-600 text-sm">
                        ${Calculator.formatCurrency(isCake ? costs.costPerPortion : costs.costPerUnit)}
                      </span>
                    </div>
                  </div>

                  <!-- Desglose Miniatura -->
                  <div class="space-y-1 text-[11px] text-gray-500 border-t border-gray-100 pt-2 mb-2">
                    <div class="flex justify-between">
                      <span>Insumos (${(recipe.ingredients || []).length} items):</span>
                      <span class="font-medium text-gray-700">${Calculator.formatCurrency(costs.ingredientsCost)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Empaque & Presentación:</span>
                      <span class="font-medium text-gray-700">${Calculator.formatCurrency(costs.packagingCost)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Mano de obra (${recipe.laborHours || 0} hrs):</span>
                      <span class="font-medium text-gray-700">${Calculator.formatCurrency(costs.laborCost)}</span>
                    </div>
                  </div>

                  <!-- Precio de Venta Sugerido -->
                  <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-2.5 text-xs">
                    <div class="flex justify-between items-center">
                      <div>
                        <span class="text-emerald-800 font-semibold block text-[11px]">Precio Venta Sugerido:</span>
                        <span class="text-emerald-600 text-[10px]">Margen meta: ${costs.targetMargin}%</span>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-black text-emerald-700">
                          ${isCake ? Calculator.formatCurrency(costs.suggestedBatchPrice) : Calculator.formatCurrency(costs.suggestedUnitPrice) + ' c/u'}
                        </span>
                        ${!isCake ? `<span class="block text-[10px] text-emerald-600 font-medium">${Calculator.formatCurrency(costs.suggestedBatchPrice)} lote</span>` : `<span class="block text-[10px] text-emerald-600 font-medium">${Calculator.formatCurrency(costs.suggestedPortionPrice)} / porción</span>`}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer Acciones -->
                <div class="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button onclick="RecipesModule.openEditor('${recipe.id}')" class="flex-1 py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    Ver / Editar
                  </button>
                  <button onclick="SimulatorModule.loadRecipeForSimulation('${recipe.id}')" class="flex-1 py-2 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-pink-200 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    Simular Precio
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Modal Editor / Creador de Ficha Técnica -->
      <div id="recipe-editor-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 p-4 text-white flex items-center justify-between shrink-0">
            <h3 id="recipe-editor-title" class="font-bold text-lg flex items-center gap-2">
              <span>👩‍🍳</span> Ficha Técnica de Costos
            </h3>
            <button onclick="RecipesModule.closeEditor()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Formulario Scrollable -->
          <form id="recipe-form" onsubmit="RecipesModule.saveRecipeForm(event)" class="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
            <input type="hidden" id="rec-id" value="">

            <!-- Sección 1: Datos Generales -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">1</span>
                Datos Generales del Producto
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Receta / Producto *</label>
                  <input type="text" id="rec-name" required placeholder="Ej. Alfajores de Maicena, Torta Red Velvet" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Categoría</label>
                  <select id="rec-category" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="Alfajores">Alfajores</option>
                    <option value="Profiteroles">Profiteroles / Masa Choux</option>
                    <option value="Galletas">Galletas</option>
                    <option value="Tortas">Tortas y Pasteles</option>
                    <option value="Cupcakes">Cupcakes & Muffins</option>
                    <option value="Tartaletas">Tartaletas & Pies</option>
                    <option value="Postres">Postres Individuales</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <!-- Tipo de Producto y Rendimiento -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tipo de Presentación</label>
                  <select id="rec-type" onchange="RecipesModule.onTypeChange(this.value)" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="units">Por Unidades / Piezas (Alfajores, Galletas, Cupcakes)</option>
                    <option value="cake">Torta Entera (con cálculo por Porción)</option>
                  </select>
                </div>
                <div>
                  <label id="rec-yield-units-label" class="block text-xs font-semibold text-gray-700 mb-1">Unidades producidas por lote *</label>
                  <input type="number" step="1" min="1" id="rec-yield-units" required value="24" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div id="rec-portion-col">
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Porciones estimadas</label>
                  <input type="number" step="1" min="1" id="rec-yield-portions" value="24" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tiempo de Preparación (min)</label>
                  <input type="number" id="rec-prep-time" value="60" class="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tiempo de Horneado (min)</label>
                  <input type="number" id="rec-bake-time" value="20" class="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>
            </div>

            <!-- Sección 2: Insumos & Ingredientes -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Ingredientes & Cantidades
                </h4>
                <button type="button" onclick="RecipesModule.addIngredientRow()" class="px-3 py-1.5 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold text-xs transition flex items-center gap-1">
                  + Agregar Insumo
                </button>
              </div>

              <div id="recipe-ingredients-table" class="space-y-2">
                <!-- Filas dinámicas generadas por JS -->
              </div>

              <div class="text-right text-xs font-bold text-gray-700 pt-1">
                Subtotal Insumos: <span id="rec-ingredients-subtotal" class="text-pink-600">$ 0</span>
              </div>
            </div>

            <!-- Sección 3: Empaque y Presentación -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">3</span>
                  Empaque, Cajas & Presentación
                </h4>
                <button type="button" onclick="RecipesModule.addPackagingRow()" class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold text-xs transition flex items-center gap-1">
                  + Agregar Empaque
                </button>
              </div>

              <div id="recipe-packaging-table" class="space-y-2">
                <!-- Filas dinámicas generadas por JS -->
              </div>

              <div class="text-right text-xs font-bold text-gray-700 pt-1">
                Subtotal Empaque: <span id="rec-packaging-subtotal" class="text-emerald-600">$ 0</span>
              </div>
            </div>

            <!-- Sección 4: Mano de Obra y Costos Indirectos -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">4</span>
                Mano de Obra y Gastos Indirectos
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Horas dedicadas</label>
                  <input type="number" step="0.25" min="0" id="rec-labor-hours" value="1.5" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <span class="text-[10px] text-gray-400">Ej. 1.5 = 1 hora 30 min</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tarifa por Hora ($)</label>
                  <input type="number" step="100" min="0" id="rec-labor-rate" value="4000" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Gas / Electricidad / Fijos ($)</label>
                  <input type="number" step="100" min="0" id="rec-overhead" value="1200" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <span class="text-[10px] text-gray-400">Gas del horno y luz</span>
                </div>
              </div>
            </div>

            <!-- Sección 5: Margen y Precios de Venta -->
            <div class="bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 p-4 rounded-2xl border border-pink-200 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-pink-900 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
                  Simulación de Margen y Precio de Venta
                </h4>
                <div class="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-pink-200">
                  <span class="text-xs text-gray-600">Margen Meta:</span>
                  <input type="number" id="rec-suggested-margin" min="5" max="95" value="45" oninput="RecipesModule.recalculateLiveSummary()" class="w-12 font-bold text-pink-600 text-center focus:outline-none">
                  <span class="text-xs text-pink-600 font-bold">%</span>
                </div>
              </div>

              <!-- Slider interactivo de margen -->
              <input type="range" id="rec-margin-slider" min="10" max="80" step="5" value="45" oninput="document.getElementById('rec-suggested-margin').value = this.value; RecipesModule.recalculateLiveSummary();" class="w-full accent-pink-500">

              <!-- Resumen de Costos Calculados -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                <div class="bg-white p-2.5 rounded-xl border border-pink-100 shadow-sm">
                  <span class="text-[10px] text-gray-500 block">Costo Total Lote</span>
                  <span id="summary-total-cost" class="font-black text-gray-900 text-sm">$ 0</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-pink-100 shadow-sm">
                  <span id="summary-unit-cost-label" class="text-[10px] text-gray-500 block">Costo Unitario</span>
                  <span id="summary-unit-cost" class="font-black text-pink-600 text-sm">$ 0</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-pink-100 shadow-sm">
                  <span class="text-[10px] text-gray-500 block">Precio Venta Lote</span>
                  <span id="summary-sale-batch" class="font-black text-emerald-600 text-sm">$ 0</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-pink-100 shadow-sm">
                  <span id="summary-sale-unit-label" class="text-[10px] text-gray-500 block">Precio Venta Unitario</span>
                  <span id="summary-sale-unit" class="font-black text-emerald-600 text-sm">$ 0</span>
                </div>
              </div>
            </div>

            <!-- Notas de preparación -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Notas / Instrucciones de Horneado</label>
              <textarea id="rec-notes" rows="2" placeholder="Ej. Hornear a 180°C por 20 minutos. Dejar reposar 1 hora antes de rellenar." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white"></textarea>
            </div>

            <!-- Footer con Botones -->
            <div class="flex gap-3 pt-3 border-t border-gray-200">
              <button type="button" onclick="RecipesModule.closeEditor()" class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 transition">
                Guardar Ficha Técnica
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  getCategoryBadgeClass(category) {
    switch (category) {
      case 'Alfajores': return 'bg-amber-100 text-amber-800';
      case 'Profiteroles': return 'bg-yellow-100 text-yellow-800';
      case 'Galletas': return 'bg-orange-100 text-orange-800';
      case 'Tortas': return 'bg-rose-100 text-rose-800';
      case 'Cupcakes': return 'bg-purple-100 text-purple-800';
      case 'Tartaletas': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  onSearch(val) {
    this.searchQuery = val;
    this.render();
    const input = document.getElementById('recipe-search');
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

  onTypeChange(type) {
    const unitsLabel = document.getElementById('rec-yield-units-label');
    const portionsCol = document.getElementById('rec-portion-col');
    if (type === 'cake') {
      if (unitsLabel) unitsLabel.textContent = 'Cantidad de Tortas *';
      document.getElementById('rec-yield-units').value = 1;
      if (portionsCol) portionsCol.classList.remove('hidden');
    } else {
      if (unitsLabel) unitsLabel.textContent = 'Unidades producidas por lote *';
      if (portionsCol) portionsCol.classList.add('hidden');
    }
    this.recalculateLiveSummary();
  },

  openEditor(id = null) {
    const modal = document.getElementById('recipe-editor-modal');
    const title = document.getElementById('recipe-editor-title');
    const form = document.getElementById('recipe-form');
    const settings = DB.getSettings();

    const ingContainer = document.getElementById('recipe-ingredients-table');
    const packContainer = document.getElementById('recipe-packaging-table');
    ingContainer.innerHTML = '';
    packContainer.innerHTML = '';

    if (id) {
      const rec = DB.getRecipeById(id);
      if (!rec) return;
      title.innerHTML = '<span>✏️</span> Editar Ficha Técnica';
      document.getElementById('rec-id').value = rec.id;
      document.getElementById('rec-name').value = rec.name;
      document.getElementById('rec-category').value = rec.category || 'Alfajores';
      document.getElementById('rec-type').value = rec.type || 'units';
      document.getElementById('rec-yield-units').value = rec.yieldUnits || 24;
      document.getElementById('rec-yield-portions').value = rec.yieldPortions || 24;
      document.getElementById('rec-prep-time').value = rec.prepTimeMinutes || 60;
      document.getElementById('rec-bake-time').value = rec.bakeTimeMinutes || 20;
      document.getElementById('rec-labor-hours').value = rec.laborHours || 1.5;
      document.getElementById('rec-labor-rate').value = rec.laborRatePerHour || settings.defaultHourlyRate || 4000;
      document.getElementById('rec-overhead').value = rec.overheadCost || 1200;
      document.getElementById('rec-suggested-margin').value = rec.suggestedMargin || 45;
      document.getElementById('rec-margin-slider').value = rec.suggestedMargin || 45;
      document.getElementById('rec-notes').value = rec.notes || '';

      // Cargar filas de ingredientes
      (rec.ingredients || []).forEach(item => {
        this.addIngredientRow(item.ingredientId, item.quantity, item.unit);
      });

      // Cargar filas de empaque
      (rec.packaging || []).forEach(item => {
        this.addPackagingRow(item.ingredientId, item.quantity, item.unit);
      });
    } else {
      title.innerHTML = '<span>👩‍🍳</span> Nueva Ficha Técnica';
      form.reset();
      document.getElementById('rec-id').value = '';
      document.getElementById('rec-labor-rate').value = settings.defaultHourlyRate || 4000;
      document.getElementById('rec-suggested-margin').value = settings.defaultTargetMargin || 40;
      document.getElementById('rec-margin-slider').value = settings.defaultTargetMargin || 40;
      document.getElementById('rec-overhead').value = 1000;
      document.getElementById('rec-yield-units').value = 24;
      document.getElementById('rec-yield-portions').value = 24;

      // Filas iniciales vacías
      this.addIngredientRow();
      this.addIngredientRow();
    }

    this.onTypeChange(document.getElementById('rec-type').value);
    this.recalculateLiveSummary();
    modal.classList.remove('hidden');
  },

  closeEditor() {
    const modal = document.getElementById('recipe-editor-modal');
    if (modal) modal.classList.add('hidden');
  },

  addIngredientRow(selectedId = '', qty = '', unit = 'g') {
    const container = document.getElementById('recipe-ingredients-table');
    const allIngredients = DB.getIngredients().filter(i => i.category !== 'Empaque');
    const rowId = 'ing_row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs';
    row.innerHTML = `
      <div class="col-span-5 sm:col-span-5">
        <select class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:ring-1 focus:ring-pink-400 ing-select bg-white" onchange="RecipesModule.onIngredientRowChange('${rowId}')">
          <option value="">-- Seleccionar Insumo --</option>
          ${allIngredients.map(ing => `
            <option value="${ing.id}" ${ing.id === selectedId ? 'selected' : ''}>
              ${ing.name} (${ing.packageQty}${ing.packageUnit})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="col-span-3 sm:col-span-3">
        <input type="number" step="any" min="0" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-center ing-qty focus:ring-1 focus:ring-pink-400" oninput="RecipesModule.onIngredientRowChange('${rowId}')">
      </div>

      <div class="col-span-2 sm:col-span-2">
        <select class="w-full px-1.5 py-1.5 rounded-lg border border-gray-200 text-xs ing-unit focus:ring-1 focus:ring-pink-400 bg-white" onchange="RecipesModule.onIngredientRowChange('${rowId}')">
          <option value="g" ${unit === 'g' ? 'selected' : ''}>g</option>
          <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
          <option value="ml" ${unit === 'ml' ? 'selected' : ''}>ml</option>
          <option value="l" ${unit === 'l' || unit === 'L' ? 'selected' : ''}>L</option>
          <option value="u" ${unit === 'u' ? 'selected' : ''}>u</option>
          <option value="tbsp" ${unit === 'tbsp' ? 'selected' : ''}>cda</option>
          <option value="tsp" ${unit === 'tsp' ? 'selected' : ''}>cdta</option>
          <option value="cup" ${unit === 'cup' ? 'selected' : ''}>taza</option>
        </select>
      </div>

      <div class="col-span-2 sm:col-span-2 flex items-center justify-between pl-1">
        <span class="text-[11px] font-bold text-gray-700 ing-cost truncate">$ 0</span>
        <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipesModule.recalculateLiveSummary();" class="text-gray-300 hover:text-red-500 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    container.appendChild(row);
    this.onIngredientRowChange(rowId);
  },

  addPackagingRow(selectedId = '', qty = '', unit = 'u') {
    const container = document.getElementById('recipe-packaging-table');
    const allPackaging = DB.getIngredients().filter(i => i.category === 'Empaque' || i.packageUnit === 'u');
    const rowId = 'pack_row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs';
    row.innerHTML = `
      <div class="col-span-5 sm:col-span-5">
        <select class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:ring-1 focus:ring-emerald-400 pack-select bg-white" onchange="RecipesModule.onPackagingRowChange('${rowId}')">
          <option value="">-- Seleccionar Empaque --</option>
          ${allPackaging.map(ing => `
            <option value="${ing.id}" ${ing.id === selectedId ? 'selected' : ''}>
              ${ing.name} (${Calculator.formatCurrency(ing.packagePrice)} / ${ing.packageQty}${ing.packageUnit})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="col-span-3 sm:col-span-3">
        <input type="number" step="any" min="0" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-center pack-qty focus:ring-1 focus:ring-emerald-400" oninput="RecipesModule.onPackagingRowChange('${rowId}')">
      </div>

      <div class="col-span-2 sm:col-span-2">
        <select class="w-full px-1.5 py-1.5 rounded-lg border border-gray-200 text-xs pack-unit focus:ring-1 focus:ring-emerald-400 bg-white" onchange="RecipesModule.onPackagingRowChange('${rowId}')">
          <option value="u" ${unit === 'u' ? 'selected' : ''}>un</option>
          <option value="g" ${unit === 'g' ? 'selected' : ''}>g</option>
          <option value="m" ${unit === 'm' ? 'selected' : ''}>m</option>
        </select>
      </div>

      <div class="col-span-2 sm:col-span-2 flex items-center justify-between pl-1">
        <span class="text-[11px] font-bold text-gray-700 pack-cost truncate">$ 0</span>
        <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipesModule.recalculateLiveSummary();" class="text-gray-300 hover:text-red-500 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    container.appendChild(row);
    this.onPackagingRowChange(rowId);
  },

  onIngredientRowChange(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const select = row.querySelector('.ing-select');
    const qtyInput = row.querySelector('.ing-qty');
    const unitSelect = row.querySelector('.ing-unit');
    const costSpan = row.querySelector('.ing-cost');

    const ingId = select.value;
    const qty = parseFloat(qtyInput.value) || 0;
    const unit = unitSelect.value;

    if (ingId && qty > 0) {
      const ing = DB.getIngredientById(ingId);
      const cost = Calculator.getIngredientItemCost(ing, qty, unit);
      costSpan.textContent = Calculator.formatCurrency(cost);
      costSpan.dataset.cost = cost;
    } else {
      costSpan.textContent = '$ 0';
      costSpan.dataset.cost = 0;
    }

    this.recalculateLiveSummary();
  },

  onPackagingRowChange(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const select = row.querySelector('.pack-select');
    const qtyInput = row.querySelector('.pack-qty');
    const unitSelect = row.querySelector('.pack-unit');
    const costSpan = row.querySelector('.pack-cost');

    const ingId = select.value;
    const qty = parseFloat(qtyInput.value) || 0;
    const unit = unitSelect.value;

    if (ingId && qty > 0) {
      const ing = DB.getIngredientById(ingId);
      const cost = Calculator.getIngredientItemCost(ing, qty, unit);
      costSpan.textContent = Calculator.formatCurrency(cost);
      costSpan.dataset.cost = cost;
    } else {
      costSpan.textContent = '$ 0';
      costSpan.dataset.cost = 0;
    }

    this.recalculateLiveSummary();
  },

  recalculateLiveSummary() {
    // 1. Insumos
    let ingredientsCost = 0;
    document.querySelectorAll('#recipe-ingredients-table .ing-cost').forEach(el => {
      ingredientsCost += parseFloat(el.dataset.cost || 0);
    });
    const ingSubtotalEl = document.getElementById('rec-ingredients-subtotal');
    if (ingSubtotalEl) ingSubtotalEl.textContent = Calculator.formatCurrency(ingredientsCost);

    // 2. Empaque
    let packagingCost = 0;
    document.querySelectorAll('#recipe-packaging-table .pack-cost').forEach(el => {
      packagingCost += parseFloat(el.dataset.cost || 0);
    });
    const packSubtotalEl = document.getElementById('rec-packaging-subtotal');
    if (packSubtotalEl) packSubtotalEl.textContent = Calculator.formatCurrency(packagingCost);

    // 3. Mano de obra
    const laborHours = parseFloat(document.getElementById('rec-labor-hours')?.value) || 0;
    const laborRate = parseFloat(document.getElementById('rec-labor-rate')?.value) || 0;
    const laborCost = laborHours * laborRate;

    // 4. Overhead
    const overheadCost = parseFloat(document.getElementById('rec-overhead')?.value) || 0;

    // 5. Totales
    const totalBatchCost = ingredientsCost + packagingCost + laborCost + overheadCost;
    const type = document.getElementById('rec-type')?.value || 'units';
    const isCake = type === 'cake';

    const yieldUnits = Math.max(1, parseFloat(document.getElementById('rec-yield-units')?.value) || 1);
    const yieldPortions = Math.max(1, parseFloat(document.getElementById('rec-yield-portions')?.value) || yieldUnits);

    const costPerUnit = totalBatchCost / yieldUnits;
    const costPerPortion = totalBatchCost / yieldPortions;

    const targetMargin = parseFloat(document.getElementById('rec-suggested-margin')?.value) || 40;
    const marginFraction = targetMargin >= 100 ? 0.99 : targetMargin / 100;
    const suggestedBatchPrice = totalBatchCost / (1 - marginFraction);
    const suggestedUnitPrice = costPerUnit / (1 - marginFraction);
    const suggestedPortionPrice = costPerPortion / (1 - marginFraction);

    // Actualizar vista
    const totalCostEl = document.getElementById('summary-total-cost');
    const unitCostEl = document.getElementById('summary-unit-cost');
    const unitCostLabelEl = document.getElementById('summary-unit-cost-label');
    const saleBatchEl = document.getElementById('summary-sale-batch');
    const saleUnitEl = document.getElementById('summary-sale-unit');
    const saleUnitLabelEl = document.getElementById('summary-sale-unit-label');

    if (totalCostEl) totalCostEl.textContent = Calculator.formatCurrency(totalBatchCost);

    if (isCake) {
      if (unitCostLabelEl) unitCostLabelEl.textContent = 'Costo x Porción';
      if (unitCostEl) unitCostEl.textContent = Calculator.formatCurrency(costPerPortion);
      if (saleBatchEl) saleBatchEl.textContent = Calculator.formatCurrency(suggestedBatchPrice);
      if (saleUnitLabelEl) saleUnitLabelEl.textContent = 'Precio x Porción';
      if (saleUnitEl) saleUnitEl.textContent = Calculator.formatCurrency(suggestedPortionPrice);
    } else {
      if (unitCostLabelEl) unitCostLabelEl.textContent = 'Costo x Unidad';
      if (unitCostEl) unitCostEl.textContent = Calculator.formatCurrency(costPerUnit);
      if (saleBatchEl) saleBatchEl.textContent = Calculator.formatCurrency(suggestedBatchPrice);
      if (saleUnitLabelEl) saleUnitLabelEl.textContent = 'Precio x Unidad';
      if (saleUnitEl) saleUnitEl.textContent = Calculator.formatCurrency(suggestedUnitPrice);
    }
  },

  saveRecipeForm(e) {
    e.preventDefault();

    const id = document.getElementById('rec-id').value;
    const name = document.getElementById('rec-name').value.trim();
    const category = document.getElementById('rec-category').value;
    const type = document.getElementById('rec-type').value;
    const yieldUnits = parseFloat(document.getElementById('rec-yield-units').value) || 1;
    const yieldPortions = parseFloat(document.getElementById('rec-yield-portions').value) || yieldUnits;
    const prepTimeMinutes = parseInt(document.getElementById('rec-prep-time').value) || 0;
    const bakeTimeMinutes = parseInt(document.getElementById('rec-bake-time').value) || 0;
    const laborHours = parseFloat(document.getElementById('rec-labor-hours').value) || 0;
    const laborRatePerHour = parseFloat(document.getElementById('rec-labor-rate').value) || 4000;
    const overheadCost = parseFloat(document.getElementById('rec-overhead').value) || 0;
    const suggestedMargin = parseFloat(document.getElementById('rec-suggested-margin').value) || 40;
    const notes = document.getElementById('rec-notes').value.trim();

    // Recolectar ingredientes
    const ingredients = [];
    document.querySelectorAll('#recipe-ingredients-table > div').forEach(row => {
      const ingId = row.querySelector('.ing-select')?.value;
      const qty = parseFloat(row.querySelector('.ing-qty')?.value);
      const unit = row.querySelector('.ing-unit')?.value;
      if (ingId && qty > 0) {
        ingredients.push({ ingredientId: ingId, quantity: qty, unit });
      }
    });

    // Recolectar empaque
    const packaging = [];
    document.querySelectorAll('#recipe-packaging-table > div').forEach(row => {
      const ingId = row.querySelector('.pack-select')?.value;
      const qty = parseFloat(row.querySelector('.pack-qty')?.value);
      const unit = row.querySelector('.pack-unit')?.value;
      if (ingId && qty > 0) {
        packaging.push({ ingredientId: ingId, quantity: qty, unit });
      }
    });

    if (ingredients.length === 0) {
      alert('Debes agregar al menos un ingrediente a la receta.');
      return;
    }

    const data = {
      name,
      category,
      type,
      yieldUnits,
      yieldPortions,
      unitName: type === 'cake' ? 'porción' : (name.toLowerCase().includes('alfajor') ? 'alfajor' : (name.toLowerCase().includes('galleta') ? 'galleta' : 'unidad')),
      prepTimeMinutes,
      bakeTimeMinutes,
      laborHours,
      laborRatePerHour,
      overheadCost,
      suggestedMargin,
      ingredients,
      packaging,
      notes
    };

    if (id) {
      DB.updateRecipe(id, data);
    } else {
      DB.addRecipe(data);
    }

    this.closeEditor();
    this.render();
    App.showToast(id ? 'Ficha técnica actualizada' : 'Nueva ficha técnica creada');
  },

  duplicateRecipe(id) {
    const copy = DB.duplicateRecipe(id);
    if (copy) {
      this.render();
      App.showToast('Receta duplicada');
    }
  },

  deleteRecipe(id, name) {
    if (confirm(`¿Estás seguro de eliminar la receta "${name}"?`)) {
      DB.deleteRecipe(id);
      this.render();
      App.showToast('Receta eliminada');
    }
  }
};
