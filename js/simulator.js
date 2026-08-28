// ==========================================
// Cakekulator - Módulo Simulador de Precios y Márgenes con Modos Adaptativos
// ==========================================

const SimulatorModule = {
  selectedRecipeId: null,
  simMode: 'batch', // 'unit' | 'portion' | 'batch'
  simTargetPortions: null, // Porciones meta para escalar tortas, tartaletas o lotes
  customCost: 5000,
  currentPrice: 8500,
  targetMargin: 40,
  includeCardFee: false,
  cardFeePercent: 3.19,

  init() {
    this.render();
  },

  isCakeOrPie(recipe) {
    if (!recipe) return false;
    if (recipe.type === 'cake') return true;
    const cat = (recipe.category || '').toLowerCase();
    const name = (recipe.name || '').toLowerCase();
    const keywords = ['torta', 'tartaleta', 'pie', 'kuchen', 'cheesecake', 'pastel', 'bizcocho', 'tarta'];
    return keywords.some(k => cat.includes(k) || name.includes(k));
  },

  loadRecipeForSimulation(recipeId, customTargetPortions = null) {
    this.selectedRecipeId = recipeId;
    this.simTargetPortions = customTargetPortions;
    const rec = DB.getRecipeById(recipeId);
    if (rec) {
      const isCakeOrPie = this.isCakeOrPie(rec);
      // Para tortas/tartaletas iniciar por defecto en Pastel Completo, para otros en Por Unidad
      this.simMode = isCakeOrPie ? 'batch' : 'unit';
    }
    this.currentPrice = 0; // Forzar cálculo de precio sugerido
    App.switchTab('simulator');
  },

  render(targetId = null) {
    const container = (targetId && document.getElementById(targetId)) ||
                      document.getElementById('simulator-view') ||
                      document.getElementById('dashboard-simulator-container');
    if (!container) return;

    const allRecipes = DB.getRecipes();
    const allQuotes = DB.getQuotes();
    const settings = DB.getSettings();
    this.cardFeePercent = settings.defaultPaymentCommission || 3.19;

    // Si hay receta seleccionada, obtener costos y posible escalado
    let currentCost = this.customCost;
    let recipeName = 'Cálculo Libre / Manual';
    let currentYieldUnits = 1;
    let currentYieldPortions = 1;
    let basePortions = 1;
    let isCakeOrPie = false;
    let recipeCostData = null;
    let isScaled = false;
    let activeRecipe = null;

    if (this.selectedRecipeId) {
      activeRecipe = DB.getRecipeById(this.selectedRecipeId);
      if (activeRecipe) {
        isCakeOrPie = this.isCakeOrPie(activeRecipe);
        basePortions = Math.max(1, activeRecipe.yieldPortions || activeRecipe.yieldUnits || 1);
        
        // Ajustar modo según el tipo de producto
        if (isCakeOrPie) {
          if (this.simMode !== 'portion' && this.simMode !== 'batch') {
            this.simMode = 'batch'; // Pastel Completo por defecto
          }
        } else {
          if (this.simMode !== 'unit' && this.simMode !== 'batch') {
            this.simMode = 'unit'; // Por Unidad por defecto
          }
        }

        // Si no se ha definido target, usar el base de la receta
        if (!this.simTargetPortions) {
          this.simTargetPortions = basePortions;
        }

        isScaled = this.simTargetPortions !== basePortions;

        // Calcular costo escalado
        const scaleResult = Calculator.scaleRecipe(activeRecipe, {
          targetPortions: this.simTargetPortions
        });

        recipeCostData = scaleResult.costs;
        const cleanRecipeName = activeRecipe.name.replace(/\s*\(\d+\s*porc[a-zA-Z.]*\)/gi, '').replace(/\s*\(\d+\s*personas\)/gi, '').replace(/\s*\(x\d+\)/gi, '').trim();
        recipeName = isScaled ? `${cleanRecipeName} (${this.simTargetPortions} Personas)` : cleanRecipeName;
        currentYieldUnits = scaleResult.recipe.yieldUnits || 1;
        currentYieldPortions = scaleResult.recipe.yieldPortions || 1;

        if (this.simMode === 'portion') {
          currentCost = recipeCostData.costPerPortion;
        } else if (this.simMode === 'batch') {
          currentCost = recipeCostData.totalBatchCost;
        } else {
          currentCost = recipeCostData.costPerUnit;
        }
      } else {
        this.selectedRecipeId = null;
      }
    }

    // Inicializar precio de venta sugerido si no está seteado o es menor al costo
    if (!this.currentPrice || this.currentPrice < currentCost) {
      const marginFrac = this.targetMargin >= 100 ? 0.99 : this.targetMargin / 100;
      this.currentPrice = Calculator.roundUpTo(currentCost / (1 - marginFrac), 100);
    }

    // Rango del slider
    const minSliderPrice = Math.max(100, Math.floor(currentCost * 0.5));
    const maxSliderPrice = Math.max(minSliderPrice + 1000, Math.ceil(currentCost * 4.5));

    // Cálculos de simulación
    const feePct = this.includeCardFee ? this.cardFeePercent : 0;
    const simResult = Calculator.simulateSellingPrice(currentCost, this.currentPrice, feePct);

    // Estado del margen
    const marginHealth = this.getMarginHealth(simResult.profitMargin);

    container.innerHTML = `
      <!-- Selector de Receta y Modo Adaptativo -->
      <div class="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-pink-100 shadow-sm space-y-3.5 sm:space-y-4 mb-4 sm:mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center">
          <div>
            <label class="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1 sm:mb-1.5 uppercase tracking-wider">1. Selecciona Producto o Receta</label>
            <select 
              id="sim-recipe-select" 
              onchange="SimulatorModule.onRecipeSelect(this.value)"
              class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white font-semibold text-gray-800 shadow-xs text-xs sm:text-sm">
              <option value="">✨ Cálculo Libre (Ingresar costo manual)</option>
              ${allRecipes.map(r => {
                const isCakeType = this.isCakeOrPie(r);
                const cleanName = r.name.replace(/\s*\(\d+\s*porc[a-zA-Z.]*\)/gi, '').replace(/\s*\(\d+\s*personas\)/gi, '').replace(/\s*\(x\d+\)/gi, '').trim();
                const infoBadge = isCakeType ? `${r.yieldPortions || 16} porc.` : `${r.yieldUnits || 1} un.`;
                const icon = isCakeType ? '🎂' : '🍪';
                return `
                  <option value="${r.id}" ${r.id === this.selectedRecipeId ? 'selected' : ''}>
                    ${icon} ${cleanName} (${infoBadge})
                  </option>
                `;
              }).join('')}
            </select>
          </div>

          <!-- Selector de Modo Adaptativo (2 Opciones según tipo de producto) -->
          <div>
            <label class="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1 sm:mb-1.5 uppercase tracking-wider">2. Simular Por</label>
            <div class="grid grid-cols-2 gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-xl sm:rounded-2xl">
              ${isCakeOrPie ? `
                <!-- Para Tortas, Tartaletas y Pies -->
                <button 
                  onclick="SimulatorModule.setSimMode('portion')" 
                  class="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${this.simMode === 'portion' ? 'bg-white text-pink-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}">
                  <span>🍰</span> Por Porción
                </button>
                <button 
                  onclick="SimulatorModule.setSimMode('batch')" 
                  class="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${this.simMode === 'batch' ? 'bg-white text-pink-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}">
                  <span>🎂</span> Pastel Completo
                </button>
              ` : `
                <!-- Para Galletas, Alfajores, Cupcakes, etc. -->
                <button 
                  onclick="SimulatorModule.setSimMode('unit')" 
                  class="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${this.simMode === 'unit' ? 'bg-white text-pink-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}">
                  <span>🧁</span> Por Unidad
                </button>
                <button 
                  onclick="SimulatorModule.setSimMode('batch')" 
                  class="py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${this.simMode === 'batch' ? 'bg-white text-pink-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}">
                  <span>📦</span> Por Lote
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Barra de Escalado Inteligente por Personas (Si es Torta, Tartaleta o Pie) -->
        ${activeRecipe && isCakeOrPie ? `
          <div class="bg-gradient-to-r from-pink-50/80 to-rose-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-pink-200/80 space-y-2.5 sm:space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                  <span>📏</span> Ajustar Tamaño / Personas del Pastel
                </span>
                <span class="text-[10px] sm:text-[11px] text-pink-700">Receta base formulada para: <strong>${basePortions} personas</strong></span>
              </div>
              
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-gray-700">Simular para:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="500" 
                  value="${this.simTargetPortions || basePortions}" 
                  oninput="SimulatorModule.onTargetPortionsChange(this.value)"
                  class="w-16 sm:w-20 px-2 py-1 text-center rounded-xl border border-pink-300 font-black text-pink-700 text-xs sm:text-sm bg-white shadow-2xs focus:ring-2 focus:ring-pink-400"
                />
                <span class="text-xs font-bold text-pink-800">personas</span>
              </div>
            </div>

            <!-- Botones de Tallas Rápidas en fila táctil desplazable -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span class="text-[10px] sm:text-[11px] text-gray-500 font-medium mr-1 whitespace-nowrap">Tallas:</span>
              ${[10, 12, 15, 16, 20, 25, 30, 35, 40, 50].map(p => `
                <button 
                  onclick="SimulatorModule.onTargetPortionsChange(${p})"
                  class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${ (this.simTargetPortions || basePortions) === p ? 'bg-pink-600 text-white shadow-xs scale-105' : 'bg-white text-gray-700 hover:bg-pink-100 border border-pink-200'}"
                >
                  ${p}p
                </button>
              `).join('')}

              ${isScaled ? `
                <button 
                  onclick="SimulatorModule.saveScaledAsNewRecipe()" 
                  class="ml-auto whitespace-nowrap px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Guardar este pastel de ${this.simTargetPortions} personas como nueva ficha técnica"
                >
                  <span>💾</span> Guardar (${this.simTargetPortions}p)
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Costo de Fabricación Calculado -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-gray-100 bg-pink-50/40 p-3 rounded-xl sm:rounded-2xl">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
              💰
            </div>
            <div>
              <span class="text-xs text-gray-500 block">Costo de Fabricación (${this.getModeLabel(isCakeOrPie)}):</span>
              <span class="text-xs font-semibold text-gray-700">${recipeName}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            ${!this.selectedRecipeId ? `
              <input 
                type="number" 
                min="0" 
                step="any" 
                value="${this.customCost}" 
                oninput="SimulatorModule.onCustomCostChange(this.value)"
                class="w-32 px-3 py-1.5 rounded-xl border border-pink-300 font-bold text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              />
            ` : `
              <span class="text-lg font-black text-gray-900">${Calculator.formatCurrency(currentCost)}</span>
            `}
          </div>
        </div>
      </div>

      <!-- Tarjetas de Métricas Principales (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <!-- Ganancia Neta -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Ganancia Neta</span>
            <span class="text-base">${simResult.netProfit >= 0 ? '💚' : '💔'}</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black ${simResult.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}">
              ${Calculator.formatCurrency(simResult.netProfit)}
            </div>
            <span class="text-[11px] text-gray-400 font-medium">Por ${this.getModeLabel(isCakeOrPie)}</span>
          </div>
        </div>

        <!-- Margen de Ganancia -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Margen sobre Venta</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${marginHealth.badgeClass}">${marginHealth.text}</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black ${marginHealth.textClass}">
              ${simResult.profitMargin.toFixed(1)}%
            </div>
            <span class="text-[11px] text-gray-400 font-medium">De cada venta es ganancia</span>
          </div>
        </div>

        <!-- Cobro Neto / En Mano -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Ingreso Neto (Cobro)</span>
            <span class="text-base">💳</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-gray-800 dark:text-gray-100">
              ${Calculator.formatCurrency(simResult.netRevenue)}
            </div>
            ${this.includeCardFee ? `
              <span class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Comisión POS: -${Calculator.formatCurrency(simResult.commissionAmount)}</span>
            ` : `
              <span class="text-[11px] text-gray-400 font-medium">Sin comisión de tarjeta</span>
            `}
          </div>
        </div>
      </div>

      <!-- Controles Dinámicos de Fijación de Precio -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        <!-- Panel Izquierdo: Slider y Ajustes Rápidos -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-6">
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-bold text-gray-900">
                Precio de Venta al Público (${this.getModeLabel(isCakeOrPie)})
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-400 font-bold">$</span>
                <input 
                  type="number" 
                  id="sim-price-input" 
                  value="${this.currentPrice}" 
                  step="100" 
                  min="0"
                  oninput="SimulatorModule.onPriceInputChange(this.value)"
                  class="w-36 pl-7 pr-3 py-1.5 text-right font-black text-xl text-pink-600 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-pink-50/50"
                />
              </div>
            </div>

            <!-- Slider Interactivo de Precio -->
            <div class="py-2">
              <input 
                type="range" 
                min="${minSliderPrice}" 
                max="${maxSliderPrice}" 
                step="100" 
                value="${this.currentPrice}" 
                oninput="SimulatorModule.onPriceSliderChange(this.value)"
                class="w-full h-3 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
              />
              <div class="flex justify-between text-[11px] text-gray-400 mt-1 font-medium">
                <span>Mín: ${Calculator.formatCurrency(minSliderPrice)}</span>
                <span class="text-pink-600 font-bold">Precio Actual: ${Calculator.formatCurrency(this.currentPrice)}</span>
                <span>Máx: ${Calculator.formatCurrency(maxSliderPrice)}</span>
              </div>
            </div>

            <!-- Botones de Ajuste Rápido (+ / - $100, $500, $1.000) -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              <span class="text-xs text-gray-500 font-medium mr-1">Ajuste rápido:</span>
              
              <!-- Restar -->
              <button onclick="SimulatorModule.adjustPriceBy(-1000)" title="Restar $1.000" class="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 transition shadow-2xs active:scale-95">- $1.000</button>
              <button onclick="SimulatorModule.adjustPriceBy(-500)" title="Restar $500" class="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 transition shadow-2xs active:scale-95">- $500</button>
              <button onclick="SimulatorModule.adjustPriceBy(-100)" title="Restar $100" class="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 transition shadow-2xs active:scale-95">- $100</button>
              
              <!-- Sumar -->
              <button onclick="SimulatorModule.adjustPriceBy(100)" title="Sumar $100" class="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 transition shadow-2xs active:scale-95">+ $100</button>
              <button onclick="SimulatorModule.adjustPriceBy(500)" title="Sumar $500" class="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 transition shadow-2xs active:scale-95">+ $500</button>
              <button onclick="SimulatorModule.adjustPriceBy(1000)" title="Sumar $1.000" class="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 transition shadow-2xs active:scale-95">+ $1.000</button>

              <button onclick="SimulatorModule.roundPriceTo(1000)" class="px-2.5 py-1 rounded-xl bg-pink-100 hover:bg-pink-200 text-xs font-bold text-pink-800 transition active:scale-95">Redondear a $1.000</button>
            </div>
          </div>

          <!-- Sugeridor por Margen Deseado -->
          <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <div class="flex justify-between items-center">
              <div>
                <span class="text-xs font-bold text-gray-700 block">Fijar Precio por Margen Meta</span>
                <span class="text-[11px] text-gray-500">¿Qué porcentaje de ganancia quieres obtener?</span>
              </div>
              <div class="flex items-center gap-1 font-black text-pink-600 bg-white px-3 py-1 rounded-xl border border-gray-200">
                <span>${this.targetMargin}%</span>
              </div>
            </div>

            <div class="grid grid-cols-4 gap-2">
              ${[30, 40, 50, 60].map(m => `
                <button 
                  onclick="SimulatorModule.applyTargetMargin(${m}, ${currentCost})"
                  class="py-2 px-2 rounded-xl text-xs font-bold transition ${this.targetMargin === m ? 'bg-pink-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200'}">
                  ${m}% Margen
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Comisión por Pago con Tarjeta / POS -->
          <div class="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                ${this.includeCardFee ? 'checked' : ''}
                onchange="SimulatorModule.toggleCardFee(this.checked)"
                class="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 accent-pink-600 cursor-pointer"
              />
              <span class="text-xs font-bold text-gray-800">Incluir Comisión POS / Tarjeta</span>
            </label>

            <div class="flex items-center gap-1 text-xs">
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="15" 
                value="${this.cardFeePercent}"
                ${!this.includeCardFee ? 'disabled' : ''}
                onchange="SimulatorModule.onFeeChange(this.value)"
                class="w-16 px-2 py-1 text-right text-xs font-bold border border-gray-300 rounded-lg bg-white ${!this.includeCardFee ? 'opacity-50' : ''}"
              />
              <span class="text-gray-500 font-bold">%</span>
            </div>
          </div>
        </div>

        <!-- Panel Derecho: Desglose Visual y Consejos -->
        <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 class="font-bold text-gray-900 text-base mb-1">Estructura del Precio de Venta</h3>
            <p class="text-xs text-gray-500 mb-4">Descubre en qué se divide cada peso que le cobras a tu cliente:</p>

            <!-- Barra Gráfica de Porcentajes -->
            <div class="w-full h-8 bg-gray-100 rounded-2xl overflow-hidden flex font-bold text-[10px] text-white shadow-inner mb-4">
              ${this.renderBreakdownBar(currentCost, simResult, recipeCostData)}
            </div>

            <!-- Leyenda Detallada -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span class="font-semibold text-gray-700 dark:text-slate-300">Costo de Fabricación:</span>
                </div>
                <span class="font-bold text-gray-900 dark:text-white">${Calculator.formatCurrency(currentCost)}</span>
              </div>

              ${this.includeCardFee ? `
                <div class="flex justify-between items-center p-2.5 rounded-xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-100 dark:border-slate-700">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span class="font-semibold text-amber-900 dark:text-amber-300">Comisión POS (${this.cardFeePercent}%):</span>
                  </div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">-${Calculator.formatCurrency(simResult.commissionAmount)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="font-bold text-emerald-900 dark:text-emerald-300">Ganancia Neta en tu Bolsillo:</span>
                </div>
                <span class="font-black text-emerald-700 dark:text-emerald-400 text-sm">${Calculator.formatCurrency(simResult.netProfit)}</span>
              </div>
            </div>
          </div>

          <!-- Consejo pastelero inteligente -->
          <div class="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 text-xs text-gray-700">
            <p class="font-bold text-pink-800 mb-0.5">💡 Consejo de Fijación:</p>
            <p>${this.getPricingAdvice(simResult.profitMargin)}</p>
          </div>

          <!-- Botón de Acción Principal: Agregar a Cotización -->
          <button onclick="SimulatorModule.openAddToQuoteModal()" class="w-full mt-4 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition active:scale-95 flex items-center justify-center gap-2 text-sm">
            <span>📋</span> Agregar a Presupuesto / Cotización
          </button>
        </div>
      </div>

      <!-- Proyección de Ventas y Ganancias por Volumen -->
      <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <h3 class="font-bold text-gray-800 text-base mb-2 flex items-center gap-2">
          <span>🚀</span> Proyección de Ganancias por Volumen de Venta (${this.getModeLabel(isCakeOrPie)}s)
        </h3>
        <p class="text-xs text-gray-500 mb-4">Descubre cuánto dinero ganas según la cantidad de unidades vendidas al mes con este precio.</p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-pink-50 text-pink-900 border-b border-pink-100 font-bold">
                <th class="p-3 rounded-l-xl">Cantidad Vendida</th>
                <th class="p-3">Total Ventas ($)</th>
                <th class="p-3">Costo Total ($)</th>
                <th class="p-3">Comisiones ($)</th>
                <th class="p-3 font-black text-emerald-700 rounded-r-xl">Ganancia Neta ($)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 font-medium text-gray-700">
              ${[5, 10, 25, 50, 100, 250].map(qty => {
                const totalSales = this.currentPrice * qty;
                const totalCostBatch = currentCost * qty;
                const totalComm = this.includeCardFee ? (totalSales * feePct / 100) : 0;
                const totalProfit = totalSales - totalCostBatch - totalComm;
                const modePlural = isCakeOrPie 
                  ? (this.simMode === 'portion' ? 'porciones' : 'pasteles') 
                  : (this.simMode === 'batch' ? 'lotes' : 'unidades');
                return `
                  <tr class="hover:bg-pink-50/30 transition">
                    <td class="p-3 font-bold text-gray-900">${qty} ${modePlural}</td>
                    <td class="p-3">${Calculator.formatCurrency(totalSales)}</td>
                    <td class="p-3 text-gray-500">${Calculator.formatCurrency(totalCostBatch)}</td>
                    <td class="p-3 text-amber-600">${totalComm > 0 ? '-' + Calculator.formatCurrency(totalComm) : '$ 0'}</td>
                    <td class="p-3 font-bold text-emerald-600 text-sm">${Calculator.formatCurrency(totalProfit)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderBreakdownBar(cost, sim, recipeCostData) {
    const price = sim.sellingPrice;
    if (price <= 0) return `<div class="w-full bg-gray-300">Sin precio</div>`;

    const costPct = Math.min(100, (cost / price) * 100);
    const profitPct = Math.max(0, sim.profitMargin);
    const commPct = sim.commissionPercent || 0;

    return `
      <div style="width: ${Math.max(10, costPct)}%" class="bg-rose-400 truncate px-1 flex items-center justify-center" title="Costo de Fabricación: ${costPct.toFixed(0)}%">
        Costo ${costPct.toFixed(0)}%
      </div>
      ${commPct > 0 ? `
        <div style="width: ${commPct}%" class="bg-amber-400 truncate px-0.5 flex items-center justify-center" title="Comisión POS">
          ${commPct.toFixed(1)}%
        </div>
      ` : ''}
      <div style="width: ${Math.max(10, profitPct)}%" class="bg-emerald-500 truncate px-1 flex items-center justify-center" title="Ganancia Neta: ${profitPct.toFixed(0)}%">
        Ganancia ${profitPct.toFixed(0)}%
      </div>
    `;
  },

  getModeLabel(isCakeOrPie) {
    if (isCakeOrPie) {
      return this.simMode === 'portion' ? 'Porción' : 'Pastel Completo';
    }
    return this.simMode === 'batch' ? 'Lote' : 'Unidad';
  },

  getMarginHealth(margin) {
    if (margin >= 45) {
      return { text: 'Excelente', badgeClass: 'bg-emerald-100 text-emerald-800', textClass: 'text-emerald-600' };
    } else if (margin >= 30) {
      return { text: 'Saludable', badgeClass: 'bg-blue-100 text-blue-800', textClass: 'text-blue-600' };
    } else if (margin >= 15) {
      return { text: 'Ajustado', badgeClass: 'bg-amber-100 text-amber-800', textClass: 'text-amber-600' };
    } else {
      return { text: 'Peligro', badgeClass: 'bg-red-100 text-red-800', textClass: 'text-red-600' };
    }
  },

  getPricingAdvice(margin) {
    if (margin >= 45) {
      return '¡Excelente rentabilidad! Tu margen supera el 45%, lo que te permite cubrir imprevistos, reinvertir en maquinaria y tener un negocio repostero altamente sostenible.';
    } else if (margin >= 30) {
      return 'Buen margen comercial (30% a 45%). Asegúrate de no regalar horas de mano de obra en decoraciones complejas para mantener este rendimiento.';
    } else if (margin >= 15) {
      return 'Margen ajustado. Cualquier aumento en el precio de la mantequilla o el chocolate podría dejarte sin ganancias. Considera optimizar el empaque o subir un poco el precio.';
    } else {
      return '¡Cuidado! Tu margen es demasiado bajo o estás en pérdida. Estás cubriendo apenas los costos sin valorar tu tiempo de trabajo.';
    }
  },

  onRecipeSelect(recipeId) {
    this.selectedRecipeId = recipeId || null;
    this.simTargetPortions = null;
    if (recipeId) {
      const rec = DB.getRecipeById(recipeId);
      if (rec) {
        this.simMode = this.isCakeOrPie(rec) ? 'batch' : 'unit';
      }
    }
    this.currentPrice = 0;
    this.render();
  },

  onTargetPortionsChange(val) {
    this.simTargetPortions = Math.max(1, parseInt(val) || 1);
    this.currentPrice = 0;
    this.render();
  },

  saveScaledAsNewRecipe() {
    if (!this.selectedRecipeId || !this.simTargetPortions) return;
    const recipe = DB.getRecipeById(this.selectedRecipeId);
    if (!recipe) return;

    const scaleResult = Calculator.scaleRecipe(recipe, {
      targetPortions: this.simTargetPortions
    });

    const newRecipeData = {
      ...scaleResult.recipe,
      id: null
    };

    const saved = DB.addRecipe(newRecipeData);
    this.selectedRecipeId = saved.id;
    this.simTargetPortions = saved.yieldPortions;
    this.render();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🎉 ¡Nueva ficha técnica "${saved.name}" guardada en tu catálogo!`);
    } else {
      alert(`🎉 ¡Ficha técnica "${saved.name}" guardada!`);
    }
  },

  setSimMode(mode) {
    this.simMode = mode;
    this.currentPrice = 0; // Forzar recalculo sugerido
    this.render();
  },

  onCustomCostChange(val) {
    this.customCost = Math.max(0, parseFloat(val) || 0);
    this.render();
  },

  onPriceSliderChange(val) {
    this.currentPrice = parseFloat(val) || 0;
    const input = document.getElementById('sim-price-input');
    if (input) input.value = this.currentPrice;
    this.render();
  },

  onPriceInputChange(val) {
    this.currentPrice = Math.max(0, parseFloat(val) || 0);
    this.render();
  },

  adjustPriceBy(amount) {
    this.currentPrice = Math.max(0, (this.currentPrice || 0) + amount);
    this.render();
  },

  roundPriceTo(multiple) {
    this.currentPrice = Math.ceil(this.currentPrice / multiple) * multiple;
    this.render();
  },

  applyTargetMargin(margin, cost) {
    this.targetMargin = margin;
    const marginFraction = margin >= 100 ? 0.99 : margin / 100;
    this.currentPrice = Calculator.roundUpTo(cost / (1 - marginFraction), 100);
    this.render();
  },

  toggleCardFee(checked) {
    this.includeCardFee = checked;
    this.render();
  },

  onFeeChange(val) {
    this.cardFeePercent = parseFloat(val) || 0;
    this.render();
  },

  // ==========================================
  // Acciones de Agregar a Cotización (Centrado en Portal Global)
  // ==========================================
  ensureAddToQuoteModal() {
    const root = document.getElementById('modals-root') || document.body;
    let modal = document.getElementById('sim-add-to-quote-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sim-add-to-quote-modal';
      root.appendChild(modal);
    } else if (modal.parentElement !== root) {
      root.appendChild(modal);
    }
    modal.className = 'fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto no-scrollbar hidden';

    let recipeName = 'Cálculo Libre / Manual';
    let isCakeOrPie = false;

    if (this.selectedRecipeId && this.selectedRecipeId !== 'custom') {
      const rec = DB.getRecipeById(this.selectedRecipeId);
      if (rec) {
        recipeName = rec.name;
        isCakeOrPie = rec.type === 'cake' || rec.type === 'pie';
      }
    }

    const allQuotes = DB.getQuotes();

    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-pink-100 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] modal-animate-in">
        
        <!-- Header Estándar de Modal -->
        <div class="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-xs shrink-0">
              📋
            </div>
            <div>
              <h3 class="font-bold text-base sm:text-lg leading-tight text-white">
                Agregar a Presupuesto
              </h3>
              <p class="text-xs text-pink-100 mt-0.5">Crea una nueva cotización o añade este producto a una existente</p>
            </div>
          </div>
          <button onclick="SimulatorModule.closeAddToQuoteModal()" class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer text-lg leading-none shrink-0" title="Cerrar">
            ✕
          </button>
        </div>

        <!-- Contenido Desplazable -->
        <div class="p-4 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          
          <!-- Tarjeta del Producto Simulado -->
          <div class="bg-pink-50/60 dark:bg-slate-800/80 p-4 rounded-2xl border border-pink-100 dark:border-slate-700 space-y-3">
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">Nombre del Producto en la Cotización</label>
              <input 
                type="text" 
                id="sim-modal-name" 
                value="${recipeName}" 
                placeholder="Ej. Torta de Chocolate 20 personas"
                class="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div class="grid grid-cols-2 gap-3 pt-1 border-t border-pink-100 dark:border-slate-700">
              <div>
                <span class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">Precio Unitario:</span>
                <span class="text-sm sm:text-base font-black text-pink-600 dark:text-pink-400 block">${Calculator.formatCurrency(this.currentPrice)}</span>
              </div>
              
              <div>
                <label class="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Cantidad a Cotizar:</label>
                <div class="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    id="sim-modal-qty" 
                    value="1" 
                    oninput="SimulatorModule.onSimModalQtyChange(this.value)" 
                    class="w-16 px-2.5 py-1 text-center font-bold text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-pink-400"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">${this.getModeLabel(isCakeOrPie)}s</span>
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-pink-100 dark:border-slate-700 font-bold text-xs sm:text-sm">
              <span class="text-gray-700 dark:text-gray-300">Subtotal Estimado:</span>
              <span id="sim-modal-subtotal" class="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">${Calculator.formatCurrency(this.currentPrice)}</span>
            </div>
          </div>

          <!-- Opciones de Destino -->
          <div class="space-y-3.5 pt-1">
            <!-- Opción 1: Crear Nueva Cotización -->
            <button 
              type="button" 
              onclick="SimulatorModule.confirmCreateNewQuote()" 
              class="w-full py-3.5 px-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-md shadow-pink-200/80 dark:shadow-none transition flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
            >
              <span>✨</span> Crear Nueva Cotización con este Producto
            </button>

            <!-- Separador -->
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
              <span class="flex-shrink mx-3 text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">O a una cotización existente</span>
              <div class="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
            </div>

            <!-- Opción 2: Añadir a Cotización Existente -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">Seleccionar Cotización Guardada:</label>
              ${allQuotes.length > 0 ? `
                <select 
                  id="sim-modal-target-quote" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-pink-400 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-800 dark:text-gray-100"
                >
                  ${allQuotes.map(q => `
                    <option value="${q.id}">
                      ${q.code} - ${q.customerName || 'Cliente'} (${Calculator.formatCurrency(q.total)})
                    </option>
                  `).join('')}
                </select>
                <button 
                  type="button" 
                  onclick="SimulatorModule.confirmAddToExistingQuote()" 
                  class="w-full py-2.5 sm:py-3 bg-gray-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>📥</span> Añadir a Esta Cotización
                </button>
              ` : `
                <p class="text-xs text-gray-500 dark:text-gray-400 py-1">No tienes cotizaciones guardadas aún. Usa el botón superior para crear una nueva.</p>
              `}
            </div>
          </div>

        </div>

        <!-- Footer con Botón Cancelar -->
        <div class="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700/80 flex justify-end shrink-0">
          <button 
            type="button" 
            onclick="SimulatorModule.closeAddToQuoteModal()" 
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition text-xs cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    `;
  },

  openAddToQuoteModal() {
    if (typeof AuthModule !== 'undefined' && !AuthModule.currentUser) {
      AuthModule.showLoginRequiredModal();
      return;
    }
    this.ensureAddToQuoteModal();
    App.openModal('sim-add-to-quote-modal');
    this.onSimModalQtyChange(1);
  },

  closeAddToQuoteModal() {
    App.closeModal('sim-add-to-quote-modal');
  },

  onSimModalQtyChange(val) {
    const qty = Math.max(1, parseInt(val, 10) || 1);
    const subtotalEl = document.getElementById('sim-modal-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = Calculator.formatCurrency(this.currentPrice * qty);
    }
  },

  confirmCreateNewQuote() {
    const nameInput = document.getElementById('sim-modal-name');
    const qtyInput = document.getElementById('sim-modal-qty');
    const name = nameInput ? nameInput.value.trim() : 'Producto';
    const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;

    this.closeAddToQuoteModal();
    QuotesModule.createFromSimulator({
      recipeId: this.selectedRecipeId || 'custom',
      recipeName: name,
      quantity: qty,
      unitPrice: this.currentPrice
    });
  },

  confirmAddToExistingQuote() {
    const select = document.getElementById('sim-modal-target-quote');
    if (!select || !select.value) {
      alert('Por favor selecciona una cotización de la lista.');
      return;
    }
    const quoteId = select.value;
    const nameInput = document.getElementById('sim-modal-name');
    const qtyInput = document.getElementById('sim-modal-qty');
    const name = nameInput ? nameInput.value.trim() : 'Producto';
    const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;

    this.closeAddToQuoteModal();
    QuotesModule.addItemToExistingQuote(quoteId, {
      recipeId: this.selectedRecipeId || 'custom',
      recipeName: name,
      quantity: qty,
      unitPrice: this.currentPrice
    });
  }
};
