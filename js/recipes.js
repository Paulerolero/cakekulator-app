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

    const isServicesMode = (typeof App !== 'undefined' && App.currentMode === 'services');
    let allRecipes = DB.getRecipes();
    const allIngredients = DB.getIngredients();
    const ingredientsMap = new Map(allIngredients.map(i => [i.id, i]));

    // Filtrar recetas según el ambiente activo
    if (isServicesMode) {
      allRecipes = allRecipes.filter(r => r.itemType === 'service' || ['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type));
    } else {
      allRecipes = allRecipes.filter(r => (r.itemType || 'product') === 'product' && !['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(r.type));
    }

    const categories = ['all', ...new Set(allRecipes.map(r => r.category).filter(Boolean))];

    // Filtrar por categoría y texto
    let filtered = allRecipes.filter(r => {
      const matchesCat = this.activeCategory === 'all' || r.category === this.activeCategory;
      const matchesSearch = !this.searchQuery ||
        r.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    container.innerHTML = `
      <!-- Barra Superior de Acciones y Búsqueda -->
      <div class="space-y-2.5 sm:space-y-3 mb-3 sm:mb-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="recipe-search" 
              placeholder="${isServicesMode ? 'Buscar servicio o tratamiento (ej. Masaje Relajante, Limpieza Facial)...' : 'Buscar receta (ej. Alfajores, Torta de Chocolate)...'}" 
              value="${this.searchQuery}"
              oninput="RecipesModule.onSearch(this.value)"
              class="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border ${isServicesMode ? 'border-teal-200 focus:ring-teal-400' : 'border-pink-200 focus:ring-pink-400'} focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-xs text-xs sm:text-sm"
            />
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-2.5 sm:top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            ${this.searchQuery ? `
              <button onclick="RecipesModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            ` : ''}
          </div>

          <div class="flex items-center gap-2 shrink-0">
            ${!isServicesMode ? `
              <button onclick="RecipeScannerModule.openModal()" class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap">
                <span>📸</span> Escanear Receta
              </button>
            ` : ''}
            <button onclick="RecipesModule.openEditor()" class="flex-1 sm:flex-none ${isServicesMode ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'btn-primary'} flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              ${isServicesMode ? 'Nuevo Servicio' : 'Nueva Receta'}
            </button>
          </div>
        </div>

        <!-- Categorías -->
        <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${categories.map(cat => `
            <button 
              onclick="RecipesModule.filterByCategory('${cat}')"
              class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap transition-colors ${this.activeCategory === cat ? (isServicesMode ? 'bg-teal-600 text-white shadow-xs font-bold' : 'bg-pink-500 text-white shadow-xs font-bold') : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 border border-gray-100 dark:border-slate-700'}">
              ${cat === 'all' ? (isServicesMode ? '✨ Todos los Servicios (' + allRecipes.length + ')' : '✨ Todas las Recetas (' + allRecipes.length + ')') : cat}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Recetas / Servicios -->
      ${filtered.length === 0 ? `
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border ${isServicesMode ? 'border-teal-100' : 'border-pink-100'} dark:border-slate-800 shadow-sm">
          <div class="w-16 h-16 ${isServicesMode ? 'bg-teal-50 dark:bg-teal-950/60' : 'bg-pink-50 dark:bg-pink-950/60'} rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            ${isServicesMode ? '💆' : '👩‍🍳'}
          </div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
            ${isServicesMode ? 'No se encontraron servicios ni protocolos' : 'No se encontraron recetas'}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
            ${isServicesMode ? 'Crea tu primera ficha de servicio para costear duración, insumos de cabina y honorarios.' : 'Crea tu primera ficha técnica para empezar a costear.'}
          </p>
          <button onclick="RecipesModule.openEditor()" class="px-4 py-2 rounded-xl text-xs font-bold ${isServicesMode ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100' : 'btn-secondary text-pink-600 border border-pink-200 hover:bg-pink-50'}">
            ${isServicesMode ? '+ Crear Ficha de Servicio' : '+ Crear Ficha Técnica'}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12 sm:pb-0">
          ${filtered.map(recipe => {
            const costs = Calculator.calculateRecipeFullCosts(recipe, ingredientsMap);
            const isServ = costs.isService;
            const isCake = recipe.type === 'cake';
            return `
              <div onclick="RecipesModule.openEditor('${recipe.id}')" class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md ${isServ ? 'hover:border-teal-300 dark:hover:border-teal-500' : 'hover:border-pink-300 dark:hover:border-pink-500'} transition overflow-hidden flex flex-col justify-between group cursor-pointer active:scale-[0.99]">
                <div class="p-4">
                  <!-- Header Card -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md ${this.getCategoryBadgeClass(recipe.category)}">
                          ${recipe.category || 'General'}
                        </span>
                        <span class="px-2 py-0.5 text-[10px] font-medium rounded-md ${isServ ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'}">
                          ${isServ ? `💆 Sesión (${recipe.durationMinutes || 60} min)` : (isCake ? `🎂 Torta (${recipe.yieldPortions} porciones)` : `📦 Lote de ${recipe.yieldUnits} ${recipe.unitName || 'un'}`)}
                        </span>
                      </div>
                      <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">${recipe.name}</h3>
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="event.stopPropagation(); RecipesModule.duplicateRecipe('${recipe.id}')" title="Duplicar" class="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>
                      </button>
                      <button onclick="event.stopPropagation(); RecipesModule.deleteRecipe('${recipe.id}', '${recipe.name}')" title="Eliminar" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  ${recipe.description ? `<p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">${recipe.description}</p>` : ''}

                  <!-- Métricas de Costo -->
                  <div class="grid grid-cols-2 gap-2 ${isServ ? 'bg-teal-50/40 dark:bg-slate-800/60' : 'bg-pink-50/40 dark:bg-slate-800/60'} rounded-xl p-2.5 mb-3 text-xs">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400 text-[11px] block">${isServ ? 'Costo Directo Sesión:' : 'Costo Total Lote:'}</span>
                      <span class="font-bold text-gray-900 dark:text-gray-100 text-sm">${Calculator.formatCurrency(isServ ? costs.costPerUnit : costs.totalBatchCost)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400 text-[11px] block">${isServ ? 'Honorarios / Mano de Obra:' : (isCake ? 'Costo por Porción:' : 'Costo Unitario:')}</span>
                      <span class="font-bold ${isServ ? 'text-teal-600 dark:text-teal-400' : 'text-pink-600 dark:text-pink-400'} text-sm">
                        ${Calculator.formatCurrency(isServ ? costs.laborCost : (isCake ? costs.costPerPortion : costs.costPerUnit))}
                      </span>
                    </div>
                  </div>

                  <!-- Desglose Miniatura -->
                  <div class="space-y-1 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-slate-800 pt-2 mb-2">
                    <div class="flex justify-between">
                      <span>${isServ ? 'Insumos de Cabina / Dosis:' : 'Insumos de Receta:'}</span>
                      <span class="font-medium text-gray-700 dark:text-gray-300">${Calculator.formatCurrency(costs.ingredientsCost)}</span>
                    </div>
                    ${isServ ? `
                      <div class="flex justify-between">
                        <span>Gastos de Cabina / Box:</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">${Calculator.formatCurrency(costs.cabinCost || 0)}</span>
                      </div>
                    ` : `
                      <div class="flex justify-between">
                        <span>Empaque & Presentación:</span>
                        <span class="font-medium text-gray-700 dark:text-gray-300">${Calculator.formatCurrency(costs.packagingCost)}</span>
                      </div>
                    `}
                    <div class="flex justify-between">
                      <span>${isServ ? `Mano de Obra (${recipe.durationMinutes || 60} min):` : `Mano de Obra (${recipe.laborHours || 0} hrs):`}</span>
                      <span class="font-medium text-gray-700 dark:text-gray-300">${Calculator.formatCurrency(costs.laborCost)}</span>
                    </div>
                  </div>

                  <!-- Precio de Venta Sugerido -->
                  <div class="bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700 rounded-xl p-2.5 text-xs">
                    <div class="flex justify-between items-center">
                      <div>
                        <span class="text-emerald-800 dark:text-emerald-300 font-bold block text-[11px]">${isServ ? 'Precio Sesión Sugerido:' : 'Precio Venta Sugerido:'}</span>
                        <span class="text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">Margen meta: ${costs.targetMargin}%</span>
                      </div>
                      <div class="text-right">
                        <span class="text-sm font-black text-emerald-800 dark:text-emerald-300">
                          ${isServ ? Calculator.formatCurrency(costs.suggestedUnitPrice) + ' / sesión' : (isCake ? Calculator.formatCurrency(costs.suggestedBatchPrice) : Calculator.formatCurrency(costs.suggestedUnitPrice) + ' c/u')}
                        </span>
                        ${isServ && costs.sessionPack4 ? `<span class="block text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Pack 4 (-10%): ${Calculator.formatCurrency(costs.sessionPack4)}</span>` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer Acciones -->
                <div class="p-3 bg-gray-50/70 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  ${!isServ ? `
                    <button onclick="event.stopPropagation(); RecipesModule.openScalingModal('${recipe.id}')" title="Agrandar o achicar receta" class="py-2 px-2.5 bg-pink-50 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                      <span>📏</span> Escalar
                    </button>
                  ` : `
                    <button onclick="event.stopPropagation(); RecipesModule.openEditor('${recipe.id}')" title="Ver o editar protocolo" class="py-2 px-2.5 bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                      <span>✏️</span> Editar
                    </button>
                  `}
                  <button onclick="event.stopPropagation(); SimulatorModule.loadRecipeForSimulation('${recipe.id}')" class="py-2 px-2.5 ${isServ ? 'bg-teal-600 hover:bg-teal-700' : 'bg-pink-600 hover:bg-pink-700'} text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer">
                    <span>📊</span> Simular
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  ensureEditorModal() {
    let modal = document.getElementById('recipe-editor-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'recipe-editor-modal';
      modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs hidden flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 p-4 text-white flex items-center justify-between shrink-0">
            <h3 id="recipe-editor-title" class="font-bold text-lg flex items-center gap-2">
              <span>👩‍🍳</span> Ficha Técnica de Costos
            </h3>
            <button onclick="RecipesModule.closeEditor()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Formulario Scrollable -->
          <form id="recipe-form" onsubmit="RecipesModule.saveRecipeForm(event)" class="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
            <input type="hidden" id="rec-id" value="">

            <!-- Sección 1: Datos Generales -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">1</span>
                Datos Generales del Producto
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre de la Receta / Producto *</label>
                  <input type="text" id="rec-name" required placeholder="Ej. Alfajores de Maicena, Torta Red Velvet" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
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
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Presentación</label>
                  <select id="rec-type" onchange="RecipesModule.onTypeChange(this.value)" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="units">Por Unidades / Piezas (Alfajores, Galletas, Cupcakes)</option>
                    <option value="cake">Torta Entera (con cálculo por Porción)</option>
                  </select>
                </div>
                <div>
                  <label id="rec-yield-units-label" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Unidades producidas por lote *</label>
                  <input type="number" step="1" min="1" id="rec-yield-units" required value="24" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div id="rec-portion-col">
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Porciones estimadas</label>
                  <input type="number" step="1" min="1" id="rec-yield-portions" value="24" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tiempo de Preparación (min)</label>
                  <input type="number" id="rec-prep-time" value="60" class="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tiempo de Horneado (min)</label>
                  <input type="number" id="rec-bake-time" value="20" class="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>
            </div>

            <!-- Sección 2: Insumos & Ingredientes -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Ingredientes & Cantidades
                </h4>

                <!-- Botones de Escalado Rápido en Formulario -->
                <div class="flex flex-wrap items-center gap-1.5 text-xs">
                  <div class="inline-flex rounded-xl p-0.5 bg-gray-200/70 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                    <button type="button" onclick="RecipesModule.scaleFormIngredients(0.5)" class="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 font-bold rounded-lg shadow-2xs text-[11px]" title="Reducir a la mitad">½</button>
                    <button type="button" onclick="RecipesModule.scaleFormIngredients(1.5)" class="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 font-bold rounded-lg shadow-2xs text-[11px]" title="Aumentar 50%">x1.5</button>
                    <button type="button" onclick="RecipesModule.scaleFormIngredients(2)" class="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 font-bold rounded-lg shadow-2xs text-[11px]" title="Duplicar">x2</button>
                  </div>
                  <button type="button" onclick="RecipesModule.promptScaleForm()" class="px-2.5 py-1.5 bg-pink-100 dark:bg-slate-800 hover:bg-pink-200 text-pink-800 dark:text-pink-300 font-bold rounded-xl text-xs transition active:scale-95" title="Escalar por número de personas">📏 Por Personas...</button>
                  <button type="button" onclick="RecipesModule.addIngredientRow()" class="px-3 py-1.5 bg-pink-600 text-white hover:bg-pink-700 font-bold rounded-xl shadow-xs transition flex items-center gap-1 text-xs active:scale-95">
                    + Insumo
                  </button>
                </div>
              </div>

              <div id="recipe-ingredients-table" class="space-y-2">
                <!-- Filas dinámicas generadas por JS -->
              </div>

              <div class="text-right text-xs font-bold text-gray-700 dark:text-gray-300 pt-1">
                Subtotal Insumos: <span id="rec-ingredients-subtotal" class="text-pink-600">$ 0</span>
              </div>
            </div>

            <!-- Sección 3: Empaque y Presentación -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">3</span>
                  Empaque, Cajas & Presentación
                </h4>
                <button type="button" onclick="RecipesModule.addPackagingRow()" class="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 font-semibold text-xs transition flex items-center gap-1">
                  + Agregar Empaque
                </button>
              </div>

              <div id="recipe-packaging-table" class="space-y-2">
                <!-- Filas dinámicas generadas por JS -->
              </div>

              <div class="text-right text-xs font-bold text-gray-700 dark:text-gray-300 pt-1">
                Subtotal Empaque: <span id="rec-packaging-subtotal" class="text-emerald-600">$ 0</span>
              </div>
            </div>

            <!-- Sección 4: Mano de Obra y Costos Indirectos -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">4</span>
                Mano de Obra y Gastos Indirectos
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Horas dedicadas</label>
                  <input type="number" step="0.25" min="0" id="rec-labor-hours" value="1.5" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <span class="text-[10px] text-gray-400">Ej. 1.5 = 1 hora 30 min</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tarifa por Hora ($)</label>
                  <input type="number" step="any" min="0" id="rec-labor-rate" value="4000" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Gas / Electricidad / Fijos ($)</label>
                  <input type="number" step="any" min="0" id="rec-overhead" value="1200" oninput="RecipesModule.recalculateLiveSummary()" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <span class="text-[10px] text-gray-400">Gas del horno y luz</span>
                </div>
              </div>
            </div>

            <!-- Sección 5: Margen y Precios de Venta -->
            <div class="bg-pink-50/70 dark:bg-slate-800/80 p-4 rounded-2xl border border-pink-200 dark:border-slate-700 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-pink-900 dark:text-pink-300 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
                  Simulación de Margen y Precio de Venta
                </h4>
                <div class="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-pink-200 dark:border-slate-700">
                  <span class="text-xs text-gray-600 dark:text-gray-300">Margen Meta:</span>
                  <input type="number" id="rec-suggested-margin" min="5" max="95" value="45" oninput="RecipesModule.recalculateLiveSummary()" class="w-12 font-bold text-pink-600 text-center focus:outline-none bg-transparent">
                  <span class="text-xs text-pink-600 font-bold">%</span>
                </div>
              </div>

              <!-- Slider interactivo de margen -->
              <input type="range" id="rec-margin-slider" min="10" max="80" step="5" value="45" oninput="document.getElementById('rec-suggested-margin').value = this.value; RecipesModule.recalculateLiveSummary();" class="w-full accent-pink-500">

              <!-- Resumen de Costos Calculados -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm">
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 block">Costo Total Lote</span>
                  <span id="summary-total-cost" class="font-black text-gray-900 dark:text-white text-sm">$ 0</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm">
                  <span id="summary-unit-cost-label" class="text-[10px] text-gray-500 dark:text-gray-400 block">Costo Unitario</span>
                  <span id="summary-unit-cost" class="font-black text-pink-600 text-sm">$ 0</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm">
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 block">Precio Venta Lote</span>
                  <span id="summary-sale-batch" class="font-black text-emerald-600 text-sm">$ 0</span>
                </div>
                <div class="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-sm">
                  <span id="summary-sale-unit-label" class="text-[10px] text-gray-500 dark:text-gray-400 block">Precio Venta Unitario</span>
                  <span id="summary-sale-unit" class="font-black text-emerald-600 text-sm">$ 0</span>
                </div>
              </div>
            </div>

            <!-- Notas de preparación -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas / Instrucciones de Horneado</label>
              <textarea id="rec-notes" rows="2" placeholder="Ej. Hornear a 180°C por 20 minutos. Dejar reposar 1 hora antes de rellenar." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white"></textarea>
            </div>

            <!-- Footer con Botones -->
            <div class="flex gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
              <button type="button" onclick="RecipesModule.closeEditor()" class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 transition">
                Guardar Ficha Técnica
              </button>
            </div>
          </form>
        </div>
      `;
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
  },

  getCategoryBadgeClass(category) {
    switch (category) {
      // Servicios & Spa
      case 'Masajes & Spa': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800';
      case 'Estética Facial': return 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800';
      case 'Manicure & Pedicure': return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-800';
      case 'Corporales & Drenaje': return 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800';
      case 'Pestañas & Cejas': return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800';
      case 'Depilación': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800';
      
      // Pastelería
      case 'Alfajores': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800';
      case 'Profiteroles': return 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800';
      case 'Galletas': return 'bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800';
      case 'Tortas': return 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800';
      case 'Cupcakes': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800';
      case 'Tartaletas': return 'bg-pink-100 dark:bg-pink-950/80 text-pink-900 dark:text-pink-200 border border-pink-300 dark:border-pink-800';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-slate-700';
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
    this.ensureEditorModal();
    const modal = document.getElementById('recipe-editor-modal');
    if (!modal) return;

    const title = document.getElementById('recipe-editor-title');
    const form = document.getElementById('recipe-form');
    const settings = DB.getSettings();

    const ingContainer = document.getElementById('recipe-ingredients-table');
    const packContainer = document.getElementById('recipe-packaging-table');
    if (!ingContainer || !packContainer || !form || !title) return;

    ingContainer.innerHTML = '';
    packContainer.innerHTML = '';

    const isServicesMode = (typeof App !== 'undefined' && App.currentMode === 'services');

    if (id) {
      const rec = DB.getRecipeById(id);
      if (!rec) return;
      const isServ = rec.itemType === 'service' || ['service_session', 'service_hourly', 'service_person', 'service_fixed', 'service'].includes(rec.type);
      title.innerHTML = isServ ? '<span>💆</span> Editar Ficha de Servicio' : '<span>✏️</span> Editar Ficha Técnica';
      document.getElementById('rec-id').value = rec.id;
      document.getElementById('rec-name').value = rec.name;
      document.getElementById('rec-category').value = rec.category || (isServ ? 'Masajes & Spa' : 'Alfajores');
      document.getElementById('rec-type').value = rec.type || (isServ ? 'service_session' : 'units');
      document.getElementById('rec-yield-units').value = rec.yieldUnits || 1;
      document.getElementById('rec-yield-portions').value = rec.yieldPortions || 1;
      document.getElementById('rec-prep-time').value = rec.prepTimeMinutes || 60;
      document.getElementById('rec-bake-time').value = rec.bakeTimeMinutes || 20;
      document.getElementById('rec-labor-hours').value = rec.laborHours || 1.5;
      document.getElementById('rec-labor-rate').value = rec.laborRatePerHour || settings.defaultHourlyRate || 4000;
      document.getElementById('rec-overhead').value = rec.overheadCost || (isServ ? (rec.cabinCost || 3000) : 1200);
      document.getElementById('rec-suggested-margin').value = rec.suggestedMargin || 45;
      document.getElementById('rec-margin-slider').value = rec.suggestedMargin || 45;
      document.getElementById('rec-notes').value = rec.notes || '';

      // Campos específicos de servicio
      const durInput = document.getElementById('serv-duration');
      if (durInput) durInput.value = rec.durationMinutes || 60;
      const staffInput = document.getElementById('serv-staff-count');
      if (staffInput) staffInput.value = rec.staffCount || 1;
      const cabinInput = document.getElementById('serv-cabin-cost');
      if (cabinInput) cabinInput.value = rec.cabinCost || 0;

      // Cargar filas de ingredientes / insumos de cabina
      (rec.ingredients || []).forEach(item => {
        this.addIngredientRow(item.ingredientId, item.quantity, item.unit);
      });

      // Cargar filas de empaque / desechables
      (rec.packaging || []).forEach(item => {
        this.addPackagingRow(item.ingredientId, item.quantity, item.unit);
      });

      this.switchEditorType(isServ ? 'service' : 'product');
    } else {
      title.innerHTML = isServicesMode ? '<span>💆</span> Nueva Ficha de Servicio & Protocolo' : '<span>👩‍🍳</span> Nueva Ficha Técnica';
      form.reset();
      document.getElementById('rec-id').value = '';
      document.getElementById('rec-labor-rate').value = settings.defaultHourlyRate || 4000;
      document.getElementById('rec-suggested-margin').value = settings.defaultTargetMargin || 40;
      document.getElementById('rec-margin-slider').value = settings.defaultTargetMargin || 40;
      document.getElementById('rec-overhead').value = isServicesMode ? 2500 : 1000;
      document.getElementById('rec-yield-units').value = isServicesMode ? 1 : 24;
      document.getElementById('rec-yield-portions').value = isServicesMode ? 1 : 24;

      const durInput = document.getElementById('serv-duration');
      if (durInput) durInput.value = 60;
      const staffInput = document.getElementById('serv-staff-count');
      if (staffInput) staffInput.value = 1;
      const cabinInput = document.getElementById('serv-cabin-cost');
      if (cabinInput) cabinInput.value = 3000;

      // Filas iniciales vacías
      this.addIngredientRow();
      if (!isServicesMode) this.addIngredientRow();

      this.switchEditorType(isServicesMode ? 'service' : 'product');
    }

    this.onTypeChange(document.getElementById('rec-type').value);
    this.recalculateLiveSummary();
    App.openModal('recipe-editor-modal');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeEditor() {
    App.closeModal('recipe-editor-modal');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  openEditorWithData(data) {
    this.openEditor();
    if (!data) return;

    document.getElementById('rec-id').value = '';
    document.getElementById('rec-name').value = data.name || '';
    document.getElementById('rec-category').value = data.category || 'Tortas';
    document.getElementById('rec-type').value = data.type || 'cake';
    document.getElementById('rec-yield-units').value = data.yieldUnits || 1;
    document.getElementById('rec-yield-portions').value = data.yieldPortions || 16;
    document.getElementById('rec-prep-time').value = data.prepTimeMinutes || 45;
    document.getElementById('rec-bake-time').value = data.bakeTimeMinutes || 35;
    if (data.notes) document.getElementById('rec-notes').value = data.notes;

    this.onTypeChange(data.type || 'cake');

    // Limpiar filas de ingredientes e insertar las extraídas del escaneo
    const ingTable = document.getElementById('recipe-ingredients-table');
    if (ingTable) ingTable.innerHTML = '';

    (data.ingredients || []).forEach(item => {
      this.addIngredientRow(item.ingredientId || item.matchedIngredientId || '', item.quantity, item.unit);
    });

    this.recalculateLiveSummary();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`✨ Receta "${data.name}" precargada con éxito.`);
    }
  },

  scaleFormIngredients(factor) {
    if (!factor || factor <= 0) return;

    // Escalar filas de ingredientes
    document.querySelectorAll('#recipe-ingredients-table > div').forEach(row => {
      const qtyInput = row.querySelector('.ing-qty');
      const unitSelect = row.querySelector('.ing-unit');
      if (qtyInput && qtyInput.value) {
        const oldVal = parseFloat(qtyInput.value) || 0;
        let newVal = oldVal * factor;
        const unit = unitSelect ? unitSelect.value : 'g';
        if (unit === 'g' || unit === 'ml' || unit === 'cc') {
          newVal = newVal >= 50 ? Math.round(newVal) : Number(newVal.toFixed(1));
        } else if (unit === 'u') {
          newVal = Math.round(newVal * 2) / 2;
          if (newVal < 1 && oldVal >= 1) newVal = 1;
        } else {
          newVal = Number(newVal.toFixed(2));
        }
        qtyInput.value = newVal;
        const rowId = row.id;
        this.onIngredientRowChange(rowId);
      }
    });

    // Escalar porciones
    const portionsInput = document.getElementById('rec-yield-portions');
    const unitsInput = document.getElementById('rec-yield-units');
    const type = document.getElementById('rec-type')?.value;

    if (portionsInput && portionsInput.value) {
      portionsInput.value = Math.max(1, Math.round(parseFloat(portionsInput.value) * factor));
    }
    if (type !== 'cake' && unitsInput && unitsInput.value) {
      unitsInput.value = Math.max(1, Math.round(parseFloat(unitsInput.value) * factor));
    }

    this.recalculateLiveSummary();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`📏 Ingredientes escalados ${factor}x`);
    }
  },

  promptScaleForm() {
    const currentPortions = parseInt(document.getElementById('rec-yield-portions')?.value) || 16;
    const targetStr = prompt(`Ingresa la cantidad de personas / porciones a la que deseas escalar esta receta (Actual: ${currentPortions} personas):`, '30');
    if (!targetStr) return;

    const targetPortions = parseInt(targetStr);
    if (!targetPortions || targetPortions <= 0) {
      alert('Por favor ingresa un número válido de personas mayor a 0.');
      return;
    }

    const factor = targetPortions / currentPortions;
    this.scaleFormIngredients(factor);
  },

  addIngredientRow(selectedId = '', qty = '', unit = 'g') {
    const container = document.getElementById('recipe-ingredients-table');
    const allIngredients = DB.getIngredients().filter(i => i.category !== 'Empaque');
    const rowId = 'ing_row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs space-y-2';
    row.innerHTML = `
      <!-- Fila 1: Selección del Insumo -->
      <div class="w-full">
        <select class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-pink-400 ing-select bg-white truncate" onchange="RecipesModule.onIngredientRowChange('${rowId}')">
          <option value="">-- Seleccionar Insumo --</option>
          ${allIngredients.map(ing => `
            <option value="${ing.id}" ${ing.id === selectedId ? 'selected' : ''}>
              ${ing.name} (${ing.packageQty}${ing.packageUnit})
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Fila 2: Cantidad, Unidad, Costo Calculado y Botón Eliminar -->
      <div class="flex items-center gap-2">
        <div class="flex-1 min-w-[70px]">
          <input type="number" step="any" min="0" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-center font-bold ing-qty focus:ring-2 focus:ring-pink-400 bg-gray-50/50" oninput="RecipesModule.onIngredientRowChange('${rowId}')">
        </div>

        <div class="w-20">
          <select class="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-xs font-medium ing-unit focus:ring-2 focus:ring-pink-400 bg-white" onchange="RecipesModule.onIngredientRowChange('${rowId}')">
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

        <div class="flex-1 text-right px-1">
          <span class="text-xs font-black text-pink-600 ing-cost truncate inline-block">$ 0</span>
        </div>

        <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipesModule.recalculateLiveSummary();" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0" title="Eliminar fila">
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
    row.className = 'bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs space-y-2';
    row.innerHTML = `
      <!-- Fila 1: Selección del Empaque -->
      <div class="w-full">
        <select class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-400 pack-select bg-white truncate" onchange="RecipesModule.onPackagingRowChange('${rowId}')">
          <option value="">-- Seleccionar Empaque --</option>
          ${allPackaging.map(ing => `
            <option value="${ing.id}" ${ing.id === selectedId ? 'selected' : ''}>
              ${ing.name} (${Calculator.formatCurrency(ing.packagePrice)} / ${ing.packageQty}${ing.packageUnit})
            </option>
          `).join('')}
        </select>
      </div>

      <!-- Fila 2: Cantidad, Unidad, Costo Calculado y Botón Eliminar -->
      <div class="flex items-center gap-2">
        <div class="flex-1 min-w-[70px]">
          <input type="number" step="any" min="0" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-center font-bold pack-qty focus:ring-2 focus:ring-emerald-400 bg-gray-50/50" oninput="RecipesModule.onPackagingRowChange('${rowId}')">
        </div>

        <div class="w-20">
          <select class="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-xs font-medium pack-unit focus:ring-2 focus:ring-emerald-400 bg-white" onchange="RecipesModule.onPackagingRowChange('${rowId}')">
            <option value="u" ${unit === 'u' ? 'selected' : ''}>un</option>
            <option value="g" ${unit === 'g' ? 'selected' : ''}>g</option>
            <option value="m" ${unit === 'm' ? 'selected' : ''}>m</option>
          </select>
        </div>

        <div class="flex-1 text-right px-1">
          <span class="text-xs font-black text-emerald-600 pack-cost truncate inline-block">$ 0</span>
        </div>

        <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipesModule.recalculateLiveSummary();" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0" title="Eliminar empaque">
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
    const suggestedBatchPrice = Calculator.roundUpTo(totalBatchCost / (1 - marginFraction), 100);
    const suggestedUnitPrice = Calculator.roundUpTo(costPerUnit / (1 - marginFraction), 100);
    const suggestedPortionPrice = Calculator.roundUpTo(costPerPortion / (1 - marginFraction), 100);

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
  },

  // ====================================================
  // Escalador Inteligente de Recetas (Personas / Moldes)
  // ====================================================
  scalingState: {
    recipeId: null,
    mode: 'portions', // 'portions' | 'diameter'
    basePortions: 16,
    targetPortions: 16,
    baseDiameter: 18,
    targetDiameter: 18
  },

  openScalingModal(recipeId) {
    const recipe = DB.getRecipeById(recipeId);
    if (!recipe) return;

    this.scalingState.recipeId = recipeId;
    this.scalingState.mode = recipe.type === 'cake' ? 'portions' : 'portions';
    this.scalingState.basePortions = Math.max(1, Number(recipe.yieldPortions || recipe.yieldUnits || 16));
    this.scalingState.targetPortions = this.scalingState.basePortions === 16 ? 30 : Math.round(this.scalingState.basePortions * 1.5);
    this.scalingState.baseDiameter = 18;
    this.scalingState.targetDiameter = 24;

    let modal = document.getElementById('recipe-scaling-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'recipe-scaling-modal';
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto';

    this.renderScalingModalContent();
    modal.classList.remove('hidden');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeScalingModal() {
    const modal = document.getElementById('recipe-scaling-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  setScalingMode(mode) {
    this.scalingState.mode = mode;
    if (mode === 'diameter') {
      const equivPortions = Calculator.estimateCakePortionsByDiameter(this.scalingState.targetDiameter);
      this.scalingState.targetPortions = equivPortions;
    }
    this.renderScalingModalContent();
  },

  setTargetPortions(val) {
    this.scalingState.targetPortions = Math.max(1, parseInt(val) || 1);
    this.renderScalingModalContent();
  },

  setTargetDiameter(val) {
    this.scalingState.targetDiameter = Math.max(10, parseInt(val) || 18);
    const equivPortions = Calculator.estimateCakePortionsByDiameter(this.scalingState.targetDiameter);
    this.scalingState.targetPortions = equivPortions;
    this.renderScalingModalContent();
  },

  renderScalingModalContent() {
    const modal = document.getElementById('recipe-scaling-modal');
    if (!modal) return;

    const recipe = DB.getRecipeById(this.scalingState.recipeId);
    if (!recipe) return;

    const isCake = recipe.type === 'cake';
    const allIngredients = DB.getIngredients();
    const ingredientsMap = new Map(allIngredients.map(i => [i.id, i]));

    // Calcular escala
    const scaleResult = Calculator.scaleRecipe(recipe, {
      targetPortions: this.scalingState.targetPortions,
      baseDiameterCm: this.scalingState.baseDiameter,
      targetDiameterCm: this.scalingState.mode === 'diameter' ? this.scalingState.targetDiameter : null
    });

    const scaledRecipe = scaleResult.recipe;
    const baseCosts = Calculator.calculateRecipeFullCosts(recipe, ingredientsMap);
    const scaledCosts = scaleResult.costs;
    const factor = scaleResult.scalingFactor;
    const pctDiff = ((factor - 1) * 100).toFixed(1);

    const portionPresets = isCake ? [10, 12, 15, 16, 20, 25, 30, 35, 40, 50] : [6, 12, 24, 36, 48, 60, 100];
    const diameterPresets = [14, 16, 18, 20, 22, 24, 26, 28, 30];

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-4 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-xs">
              📏
            </div>
            <div>
              <h3 class="font-bold text-base leading-tight">Escalador Inteligente de Receta</h3>
              <p class="text-xs text-pink-100">${recipe.name} · Base: ${recipe.yieldPortions} ${isCake ? 'personas' : 'unidades'}</p>
            </div>
          </div>
          <button onclick="RecipesModule.closeScalingModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition">✕</button>
        </div>

        <!-- Contenido Scrollable -->
        <div class="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          <!-- Selector de Modo y Tamaño -->
          <div class="bg-pink-50/60 p-4 rounded-2xl border border-pink-100 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200/60 pb-3">
              <span class="font-bold text-pink-900 text-sm">1. Elige cómo quieres ajustar el tamaño:</span>
              
              <div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-pink-200 shadow-2xs">
                <button 
                  onclick="RecipesModule.setScalingMode('portions')"
                  class="px-3 py-1 rounded-lg font-bold transition ${this.scalingState.mode === 'portions' ? 'bg-pink-600 text-white' : 'text-gray-600 hover:text-pink-600'}"
                >
                  👥 Por Personas / Porciones
                </button>
                ${isCake ? `
                  <button 
                    onclick="RecipesModule.setScalingMode('diameter')"
                    class="px-3 py-1 rounded-lg font-bold transition ${this.scalingState.mode === 'diameter' ? 'bg-pink-600 text-white' : 'text-gray-600 hover:text-pink-600'}"
                  >
                    🎂 Por Diámetro Molde (cm)
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Controles según Modo -->
            ${this.scalingState.mode === 'portions' ? `
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-gray-700 font-semibold">Tallas rápidas:</span>
                  <div class="flex items-center gap-1.5 font-bold text-pink-800">
                    <span>Tamaño deseado:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="500" 
                      value="${this.scalingState.targetPortions}"
                      oninput="RecipesModule.setTargetPortions(this.value)"
                      class="w-20 px-2 py-1 text-center rounded-xl border border-pink-300 font-black text-pink-700 bg-white text-sm"
                    />
                    <span>${isCake ? 'personas' : 'unidades'}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  ${portionPresets.map(p => `
                    <button 
                      onclick="RecipesModule.setTargetPortions(${p})"
                      class="px-3 py-1.5 rounded-xl font-bold transition ${this.scalingState.targetPortions === p ? 'bg-pink-600 text-white shadow-xs scale-105' : 'bg-white text-gray-700 hover:bg-pink-100 border border-pink-200'}"
                    >
                      ${p} ${isCake ? 'pers.' : 'un.'}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-gray-700 font-semibold">Diámetros de molde estándar:</span>
                  <div class="flex items-center gap-1.5 font-bold text-pink-800">
                    <span>Molde Meta:</span>
                    <span class="text-sm font-black text-pink-700 bg-white px-3 py-1 rounded-xl border border-pink-300">
                      Ø ${this.scalingState.targetDiameter} cm (~${this.scalingState.targetPortions} personas)
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  ${diameterPresets.map(d => `
                    <button 
                      onclick="RecipesModule.setTargetDiameter(${d})"
                      class="px-3 py-1.5 rounded-xl font-bold transition ${this.scalingState.targetDiameter === d ? 'bg-pink-600 text-white shadow-xs scale-105' : 'bg-white text-gray-700 hover:bg-pink-100 border border-pink-200'}"
                    >
                      Ø ${d} cm (${Calculator.estimateCakePortionsByDiameter(d)}p)
                    </button>
                  `).join('')}
                </div>
              </div>
            `}

            <!-- Badge del Factor de Escala -->
            <div class="flex items-center justify-between pt-1 border-t border-pink-200/50 text-[11px]">
              <span class="text-gray-600">Factor de multiplicación aplicado a la receta:</span>
              <span class="font-black px-2.5 py-0.5 rounded-full ${factor >= 1 ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}">
                ${factor.toFixed(2)}x (${pctDiff >= 0 ? '+' : ''}${pctDiff}%)
              </span>
            </div>
          </div>

          <!-- Comparativa de Precios y Ganancias -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-center">
              <span class="text-gray-400 block text-[11px]">Receta Base (${recipe.yieldPortions}p)</span>
              <span class="text-sm font-bold text-gray-600 block mt-0.5">${Calculator.formatCurrency(baseCosts.totalBatchCost)}</span>
              <span class="text-[10px] text-gray-400">Venta sug: ${Calculator.formatCurrency(baseCosts.suggestedBatchPrice)}</span>
            </div>

            <div class="bg-gradient-to-br from-pink-50 to-rose-50 p-3.5 rounded-2xl border border-pink-200 text-center">
              <span class="text-pink-700 block font-semibold text-[11px]">Costo Torta Escalada (${this.scalingState.targetPortions}p)</span>
              <span class="text-base font-black text-pink-700 block mt-0.5">${Calculator.formatCurrency(scaledCosts.totalBatchCost)}</span>
              <span class="text-[10px] text-pink-600 font-medium">Insumos: ${Calculator.formatCurrency(scaledCosts.ingredientsCost)}</span>
            </div>

            <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
              <span class="text-emerald-800 block font-bold text-[11px]">Precio Venta Sugerido (${scaledCosts.targetMargin}%)</span>
              <span class="text-lg font-black text-emerald-700 block mt-0.5">${Calculator.formatCurrency(scaledCosts.suggestedBatchPrice)}</span>
              <span class="text-[10px] text-emerald-600 font-bold">Ganancia: +${Calculator.formatCurrency(scaledCosts.suggestedBatchPrice - scaledCosts.totalBatchCost)}</span>
            </div>
          </div>

          <!-- Tabla Comparativa de Ingredientes -->
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h4 class="font-bold text-gray-800 text-xs">2. Ingredientes con Nuevas Cantidades Exactas</h4>
              <span class="text-[11px] text-gray-500">${scaledRecipe.ingredients.length} ingredientes</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-gray-50/50 text-gray-500 border-b border-gray-100 font-semibold text-[11px]">
                    <th class="p-2.5">Ingrediente</th>
                    <th class="p-2.5 text-center">Base (${recipe.yieldPortions}p)</th>
                    <th class="p-2.5 text-center bg-pink-50/50 font-black text-pink-700">Nueva Cantidad (${this.scalingState.targetPortions}p)</th>
                    <th class="p-2.5 text-right">Nuevo Costo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${scaledRecipe.ingredients.map(item => {
      const ing = ingredientsMap.get(item.ingredientId);
      const itemCost = ing ? Calculator.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
      return `
                      <tr class="hover:bg-pink-50/30 transition">
                        <td class="p-2.5 font-bold text-gray-800">${ing ? ing.name : 'Insumo'}</td>
                        <td class="p-2.5 text-center text-gray-500">${item.originalQuantity} ${item.unit}</td>
                        <td class="p-2.5 text-center bg-pink-50/40 font-black text-pink-600 text-sm">
                          ${item.quantity} ${item.unit}
                        </td>
                        <td class="p-2.5 text-right font-semibold text-gray-700">${Calculator.formatCurrency(itemCost)}</td>
                      </tr>
                    `;
    }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Footer Acciones -->
        <div class="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button 
            onclick="RecipesModule.openInSimulatorFromScaling()" 
            class="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📊</span> Probar en Simulador
          </button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onclick="RecipesModule.applyScalingToCurrentRecipe()" 
              class="flex-1 sm:flex-none py-2.5 px-4 bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              🔄 Modificar Receta Actual
            </button>
            <button 
              onclick="RecipesModule.saveScaledRecipeAsNew()" 
              class="flex-1 sm:flex-none py-2.5 px-5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-pink-300 transition active:scale-95 cursor-pointer"
            >
              💾 Guardar como Nueva Receta (${this.scalingState.targetPortions}p)
            </button>
          </div>
        </div>

      </div>
    `;
  },

  saveScaledRecipeAsNew() {
    const recipe = DB.getRecipeById(this.scalingState.recipeId);
    if (!recipe) return;

    const scaleResult = Calculator.scaleRecipe(recipe, {
      targetPortions: this.scalingState.targetPortions,
      baseDiameterCm: this.scalingState.baseDiameter,
      targetDiameterCm: this.scalingState.mode === 'diameter' ? this.scalingState.targetDiameter : null
    });

    const newRecipeData = {
      ...scaleResult.recipe,
      id: null // DB.addRecipe creará un nuevo ID
    };

    const saved = DB.addRecipe(newRecipeData);
    this.closeScalingModal();
    this.render();
    App.showToast(`🎉 ¡Nueva ficha técnica creada: "${saved.name}"!`);
  },

  applyScalingToCurrentRecipe() {
    const recipe = DB.getRecipeById(this.scalingState.recipeId);
    if (!recipe) return;

    if (confirm(`¿Deseas reemplazar las cantidades de "${recipe.name}" para adaptarla a ${this.scalingState.targetPortions} personas?`)) {
      const scaleResult = Calculator.scaleRecipe(recipe, {
        targetPortions: this.scalingState.targetPortions,
        baseDiameterCm: this.scalingState.baseDiameter,
        targetDiameterCm: this.scalingState.mode === 'diameter' ? this.scalingState.targetDiameter : null
      });

      DB.updateRecipe(recipe.id, {
        yieldPortions: scaleResult.recipe.yieldPortions,
        yieldUnits: scaleResult.recipe.yieldUnits,
        laborHours: scaleResult.recipe.laborHours,
        overheadCost: scaleResult.recipe.overheadCost,
        ingredients: scaleResult.recipe.ingredients,
        packaging: scaleResult.recipe.packaging
      });

      this.closeScalingModal();
      this.render();
      App.showToast(`✅ Receta "${recipe.name}" actualizada a ${this.scalingState.targetPortions} personas.`);
    }
  },

  openInSimulatorFromScaling() {
    const recipeId = this.scalingState.recipeId;
    const targetPortions = this.scalingState.targetPortions;
    this.closeScalingModal();
    SimulatorModule.loadRecipeForSimulation(recipeId, targetPortions);
  }
};
