// ==========================================
// Cakekulator - Módulo Simulador de Precios y Márgenes con Escalador de Tortas
// ==========================================

const SimulatorModule = {
  selectedRecipeId: null,
  simMode: 'unit', // 'unit' | 'portion' | 'batch'
  simTargetPortions: null, // Porciones meta para escalar tortas o lotes
  customCost: 5000,
  currentPrice: 8500,
  targetMargin: 40,
  includeCardFee: false,
  cardFeePercent: 3.19,

  init() {
    this.render();
  },

  loadRecipeForSimulation(recipeId, customTargetPortions = null) {
    this.selectedRecipeId = recipeId;
    this.simTargetPortions = customTargetPortions;
    this.currentPrice = 0; // Forzar cálculo de precio sugerido
    App.switchTab('dashboard');
    const el = document.getElementById('dashboard-simulator-container') || document.getElementById('simulator-view');
    if (el) {
      this.render();
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  },

  render(targetId = null) {
    const container = (targetId && document.getElementById(targetId)) ||
                      document.getElementById('dashboard-simulator-container') ||
                      document.getElementById('simulator-view');
    if (!container) return;

    const allRecipes = DB.getRecipes();
    const settings = DB.getSettings();
    this.cardFeePercent = settings.defaultPaymentCommission || 3.19;

    // Si hay receta seleccionada, obtener costos y posible escalado
    let currentCost = this.customCost;
    let recipeName = 'Cálculo Libre / Manual';
    let currentYieldUnits = 1;
    let currentYieldPortions = 1;
    let basePortions = 1;
    let isCake = false;
    let recipeCostData = null;
    let isScaled = false;
    let activeRecipe = null;

    if (this.selectedRecipeId) {
      activeRecipe = DB.getRecipeById(this.selectedRecipeId);
      if (activeRecipe) {
        isCake = activeRecipe.type === 'cake';
        basePortions = Math.max(1, activeRecipe.yieldPortions || activeRecipe.yieldUnits || 1);
        
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
        recipeName = isScaled ? `${activeRecipe.name} (${this.simTargetPortions} Personas)` : activeRecipe.name;
        currentYieldUnits = scaleResult.recipe.yieldUnits || 1;
        currentYieldPortions = scaleResult.recipe.yieldPortions || 1;

        if (this.simMode === 'batch' || (isCake && this.simMode === 'unit')) {
          currentCost = recipeCostData.totalBatchCost;
        } else if (this.simMode === 'portion') {
          currentCost = recipeCostData.costPerPortion;
        } else {
          currentCost = recipeCostData.costPerUnit;
        }
      } else {
        this.selectedRecipeId = null;
      }
    }

    // Inicializar precio de venta sugerido
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
      <!-- Header -->
      <div class="mb-5">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📊</span> Simulador de Precios y Rentabilidad
        </h2>
        <p class="text-sm text-gray-500">Calcula precios para cualquier tamaño de torta o cantidad de personas conociendo tus costos y margen real.</p>
      </div>

      <!-- Selector de Receta y Modo -->
      <div class="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm space-y-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">1. Selecciona Producto o Receta</label>
            <select 
              id="sim-recipe-select" 
              onchange="SimulatorModule.onRecipeSelect(this.value)"
              class="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white font-semibold text-gray-800 shadow-xs">
              <option value="">✨ Cálculo Libre (Ingresar costo manual)</option>
              ${allRecipes.map(r => `
                <option value="${r.id}" ${r.id === this.selectedRecipeId ? 'selected' : ''}>
                  ${r.name} (${r.type === 'cake' ? 'Torta ' + r.yieldPortions + ' porc.' : 'Lote ' + r.yieldUnits + ' un.'})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Selector de Modo (Unidad / Porción / Lote) -->
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">2. Simular Por</label>
            <div class="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
              <button 
                onclick="SimulatorModule.setSimMode('unit')" 
                class="py-2 rounded-xl text-xs font-bold transition ${this.simMode === 'unit' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                ${isCake ? 'Torta Completa' : 'Por Unidad'}
              </button>
              <button 
                onclick="SimulatorModule.setSimMode('portion')" 
                class="py-2 rounded-xl text-xs font-bold transition ${this.simMode === 'portion' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                Por Porción
              </button>
              <button 
                onclick="SimulatorModule.setSimMode('batch')" 
                class="py-2 rounded-xl text-xs font-bold transition ${this.simMode === 'batch' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                Lote Completo
              </button>
            </div>
          </div>
        </div>

        <!-- Barra de Escalado Inteligente por Personas (Si hay receta seleccionada) -->
        ${activeRecipe ? `
          <div class="bg-gradient-to-r from-pink-50/70 to-rose-50/70 p-4 rounded-2xl border border-pink-200/80 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                  <span>📏</span> Ajustar Tamaño / Personas de la Torta
                </span>
                <span class="text-[11px] text-pink-700">Receta base formulada para: <strong>${basePortions} personas</strong></span>
              </div>
              
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-gray-700">Simular para:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="500" 
                  value="${this.simTargetPortions || basePortions}" 
                  oninput="SimulatorModule.onTargetPortionsChange(this.value)"
                  class="w-20 px-2.5 py-1 text-center rounded-xl border border-pink-300 font-black text-pink-700 text-sm bg-white shadow-2xs focus:ring-2 focus:ring-pink-400"
                />
                <span class="text-xs font-bold text-pink-800">${isCake ? 'personas' : 'unidades'}</span>
              </div>
            </div>

            <!-- Botones de Tallas Rápidas -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] text-gray-500 font-medium mr-1">Tallas rápidas:</span>
              ${(isCake ? [10, 12, 15, 16, 20, 25, 30, 35, 40, 50] : [6, 12, 24, 36, 48, 60, 100]).map(p => `
                <button 
                  onclick="SimulatorModule.onTargetPortionsChange(${p})"
                  class="px-2.5 py-1 rounded-xl text-xs font-bold transition ${ (this.simTargetPortions || basePortions) === p ? 'bg-pink-600 text-white shadow-xs scale-105' : 'bg-white text-gray-700 hover:bg-pink-100 border border-pink-200'}"
                >
                  ${p} ${isCake ? 'pers.' : 'un.'}
                </button>
              `).join('')}

              ${isScaled ? `
                <button 
                  onclick="SimulatorModule.saveScaledAsNewRecipe()" 
                  class="ml-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Guardar esta torta de ${this.simTargetPortions} personas como nueva receta en tu catálogo"
                >
                  <span>💾</span> Guardar Ficha (${this.simTargetPortions}p)
                </button>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Costo de Fabricación Calculado -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 bg-pink-50/40 p-3 rounded-2xl">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
              💰
            </div>
            <div>
              <span class="text-xs text-gray-500 block">Costo de Fabricación (${isCake ? `Torta ${this.simTargetPortions || basePortions} personas` : this.getModeLabel(isCake)}):</span>
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
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <!-- Ganancia Neta -->
        <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Ganancia Neta</span>
            <span class="text-base">${simResult.netProfit >= 0 ? '💚' : '💔'}</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black ${simResult.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}">
              ${Calculator.formatCurrency(simResult.netProfit)}
            </div>
            <span class="text-[11px] text-gray-400 font-medium">Por ${isCake ? `Torta (${this.simTargetPortions || basePortions}p)` : this.getModeLabel(isCake)}</span>
          </div>
        </div>

        <!-- Margen de Ganancia -->
        <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
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

        <!-- Markup / Recargo -->
        <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Markup (Recargo)</span>
            <span class="text-base">📈</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-purple-600">
              ${simResult.markup.toFixed(1)}%
            </div>
            <span class="text-[11px] text-gray-400 font-medium">Multiplicador: ${simResult.costMultiplier.toFixed(2)}x</span>
          </div>
        </div>

        <!-- Cobro Neto / En Mano -->
        <div class="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Ingreso Neto</span>
            <span class="text-base">💳</span>
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-black text-gray-800">
              ${Calculator.formatCurrency(simResult.netRevenue)}
            </div>
            ${this.includeCardFee ? `
              <span class="text-[10px] text-amber-600 font-medium">Comisión POS: -${Calculator.formatCurrency(simResult.commissionAmount)}</span>
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
                Precio de Venta al Público (${isCake ? `Torta ${this.simTargetPortions || basePortions}p` : this.getModeLabel(isCake)})
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
              <div class="flex justify-between items-center p-2 rounded-xl bg-gray-50">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-400"></span>
                  <span class="font-medium text-gray-700">Costo de Fabricación:</span>
                </div>
                <span class="font-bold text-gray-900">${Calculator.formatCurrency(currentCost)}</span>
              </div>

              ${this.includeCardFee ? `
                <div class="flex justify-between items-center p-2 rounded-xl bg-amber-50">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="font-medium text-amber-900">Comisión POS (${this.cardFeePercent}%):</span>
                  </div>
                  <span class="font-bold text-amber-700">-${Calculator.formatCurrency(simResult.commissionAmount)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between items-center p-2 rounded-xl bg-emerald-50">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="font-bold text-emerald-900">Ganancia Neta en tu Bolsillo:</span>
                </div>
                <span class="font-black text-emerald-600 text-sm">${Calculator.formatCurrency(simResult.netProfit)}</span>
              </div>
            </div>
          </div>

          <!-- Consejo pastelero inteligente -->
          <div class="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 text-xs text-gray-700">
            <p class="font-bold text-pink-800 mb-0.5">💡 Consejo de Fijación:</p>
            <p>${this.getPricingAdvice(simResult.profitMargin)}</p>
          </div>
        </div>
      </div>

      <!-- Proyección de Ventas y Ganancias por Volumen -->
      <div class="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <h3 class="font-bold text-gray-800 text-base mb-2 flex items-center gap-2">
          <span>🚀</span> Proyección de Ganancias por Volumen de Venta (${isCake ? `Tortas de ${this.simTargetPortions || basePortions}p` : this.getModeLabel(isCake)}s)
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
                return `
                  <tr class="hover:bg-pink-50/30 transition">
                    <td class="p-3 font-bold text-gray-900">${qty} ${isCake ? 'tortas' : this.getModeLabel(isCake) + 's'}</td>
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

  getModeLabel(isCake) {
    if (this.simMode === 'batch') return 'Lote';
    if (this.simMode === 'portion') return 'Porción';
    return isCake ? 'Torta' : 'Unidad';
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
  }
};
