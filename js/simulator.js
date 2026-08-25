// ==========================================
// Cakekulator - Módulo Simulador de Precios y Márgenes
// ==========================================

const SimulatorModule = {
  selectedRecipeId: null,
  simMode: 'unit', // 'unit' | 'portion' | 'batch'
  customCost: 5000,
  currentPrice: 8500,
  targetMargin: 40,
  includeCardFee: false,
  cardFeePercent: 3.19,

  init() {
    this.render();
  },

  loadRecipeForSimulation(recipeId) {
    this.selectedRecipeId = recipeId;
    App.switchTab('simulator');
    this.render();
  },

  render() {
    const container = document.getElementById('simulator-view');
    if (!container) return;

    const allRecipes = DB.getRecipes();
    const settings = DB.getSettings();
    this.cardFeePercent = settings.defaultPaymentCommission || 3.19;

    // Si hay receta seleccionada, obtener costos
    let currentCost = this.customCost;
    let recipeName = 'Cálculo Libre / Manual';
    let currentYieldUnits = 1;
    let currentYieldPortions = 1;
    let isCake = false;
    let recipeCostData = null;

    if (this.selectedRecipeId) {
      const rec = DB.getRecipeById(this.selectedRecipeId);
      if (rec) {
        recipeCostData = Calculator.calculateRecipeFullCosts(rec);
        recipeName = rec.name;
        isCake = rec.type === 'cake';
        currentYieldUnits = rec.yieldUnits || 1;
        currentYieldPortions = rec.yieldPortions || 1;

        if (this.simMode === 'batch') {
          currentCost = recipeCostData.totalBatchCost;
        } else if (this.simMode === 'portion' || (isCake && this.simMode === 'unit')) {
          currentCost = recipeCostData.costPerPortion;
        } else {
          currentCost = recipeCostData.costPerUnit;
        }
      } else {
        this.selectedRecipeId = null;
      }
    }

    // Inicializar precio de venta si es la primera carga o cambio de modo
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
        <p class="text-sm text-gray-500">Ajusta el precio de venta en tiempo real para conocer tus ganancias netas y márgenes.</p>
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
                Por Unidad
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

        <!-- Input de Costo Base -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 bg-pink-50/40 p-3 rounded-2xl">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
              💰
            </div>
            <div>
              <span class="text-xs text-gray-500 block">Costo de Fabricación (${this.getModeLabel(isCake)}):</span>
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
            <span class="text-[11px] text-gray-400 font-medium">Por ${this.getModeLabel(isCake)}</span>
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

      <!-- Panel Central de Ajuste de Precio y Margen -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <!-- Columna Izquierda: Controles Interactivos -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-6">
          <h3 class="font-bold text-gray-800 text-base flex items-center gap-2">
            <span>🎚️</span> Simulador Dinámico de Precio de Venta
          </h3>

          <!-- Control de Precio de Venta -->
          <div class="bg-gradient-to-br from-pink-50/70 to-rose-50/40 p-5 rounded-2xl border border-pink-100 space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Precio de Venta Simulado</label>
                <span class="text-xs text-gray-500">¿Cuánto deseas cobrar?</span>
              </div>
              <div class="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-pink-300 shadow-xs">
                <span class="text-sm font-bold text-gray-500">${settings.currencySymbol}</span>
                <input 
                  type="number" 
                  id="sim-price-input"
                  min="0"
                  step="any"
                  value="${this.currentPrice}"
                  oninput="SimulatorModule.onPriceInputChange(this.value)"
                  class="w-28 font-black text-xl text-pink-600 text-right focus:outline-none"
                />
              </div>
            </div>

            <!-- Slider de Precio -->
            <div class="space-y-1">
              <input 
                type="range" 
                id="sim-price-slider"
                min="${minSliderPrice}" 
                max="${maxSliderPrice}" 
                step="50" 
                value="${this.currentPrice}"
                oninput="SimulatorModule.onPriceSliderChange(this.value)"
                class="w-full accent-pink-500 cursor-pointer h-2.5 bg-pink-200 rounded-lg"
              />
              <div class="flex justify-between text-[11px] text-gray-400 font-medium">
                <span>Mín: ${Calculator.formatCurrency(minSliderPrice)}</span>
                <span>Sugerido (40%): ${Calculator.formatCurrency(Math.round(currentCost / 0.6))}</span>
                <span>Máx: ${Calculator.formatCurrency(maxSliderPrice)}</span>
              </div>
            </div>

            <!-- Botones de Ajuste Rápido -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="text-xs text-gray-500 self-center mr-1">Ajuste rápido:</span>
              <button onclick="SimulatorModule.adjustPriceBy(500)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 transition">+ $500</button>
              <button onclick="SimulatorModule.adjustPriceBy(1000)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 transition">+ $1.000</button>
              <button onclick="SimulatorModule.adjustPriceBy(5000)" class="px-2.5 py-1 rounded-lg bg-white hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-700 transition">+ $5.000</button>
              <button onclick="SimulatorModule.roundPriceTo(1000)" class="px-2.5 py-1 rounded-lg bg-pink-100 hover:bg-pink-200 text-xs font-bold text-pink-800 transition">Redondear a $1.000</button>
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
              ${[30, 40, 50, 60].map(pct => `
                <button 
                  onclick="SimulatorModule.applyTargetMargin(${pct}, ${currentCost})" 
                  class="py-2 rounded-xl text-xs font-bold transition ${this.targetMargin === pct ? 'bg-pink-500 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-pink-50'}">
                  ${pct}% Margen
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Toggle de Comisión por Tarjeta -->
          <div class="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div class="flex items-center gap-2.5">
              <input 
                type="checkbox" 
                id="sim-card-toggle" 
                ${this.includeCardFee ? 'checked' : ''} 
                onchange="SimulatorModule.toggleCardFee(this.checked)"
                class="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-400"
              />
              <div>
                <label for="sim-card-toggle" class="text-xs font-bold text-gray-800 cursor-pointer block">
                  Cobro con Tarjeta / POS / Webpay
                </label>
                <span class="text-[11px] text-gray-500">Descuenta la comisión de pasarela de pago</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <input 
                type="number" 
                step="0.01" 
                value="${this.cardFeePercent}" 
                onchange="SimulatorModule.onFeeChange(this.value)"
                class="w-14 px-2 py-1 text-xs font-bold text-right rounded-lg border border-gray-200 bg-white"
              />
              <span class="text-xs text-gray-500 font-bold">%</span>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Gráfico de Desglose y Análisis Visual -->
        <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
              <span>🥧</span> ¿A dónde va cada peso que cobras?
            </h3>

            <!-- Barra Visual de Desglose -->
            <div class="space-y-3 mb-5">
              <div class="h-6 w-full rounded-xl overflow-hidden flex shadow-inner bg-gray-100 text-[10px] font-bold text-white text-center leading-6">
                ${this.renderBreakdownBar(currentCost, simResult, recipeCostData)}
              </div>

              <!-- Leyenda de Costos -->
              <div class="space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1.5 text-gray-600">
                    <span class="w-3 h-3 rounded-full bg-pink-400"></span> Costo de Insumos:
                  </span>
                  <span class="font-bold text-gray-900">${Calculator.formatCurrency(recipeCostData ? (this.simMode === 'batch' ? recipeCostData.ingredientsCost : recipeCostData.ingredientsCost / currentYieldUnits) : currentCost * 0.6)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1.5 text-gray-600">
                    <span class="w-3 h-3 rounded-full bg-emerald-400"></span> Empaque & Presentación:
                  </span>
                  <span class="font-bold text-gray-900">${Calculator.formatCurrency(recipeCostData ? (this.simMode === 'batch' ? recipeCostData.packagingCost : recipeCostData.packagingCost / currentYieldUnits) : currentCost * 0.1)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="flex items-center gap-1.5 text-gray-600">
                    <span class="w-3 h-3 rounded-full bg-blue-400"></span> Mano de Obra & Horno:
                  </span>
                  <span class="font-bold text-gray-900">${Calculator.formatCurrency(recipeCostData ? (this.simMode === 'batch' ? (recipeCostData.laborCost + recipeCostData.overheadCost) : (recipeCostData.laborCost + recipeCostData.overheadCost) / currentYieldUnits) : currentCost * 0.3)}</span>
                </div>
                ${this.includeCardFee ? `
                  <div class="flex justify-between items-center">
                    <span class="flex items-center gap-1.5 text-gray-600">
                      <span class="w-3 h-3 rounded-full bg-amber-400"></span> Comisión POS / Pasarela:
                    </span>
                    <span class="font-bold text-amber-700">${Calculator.formatCurrency(simResult.commissionAmount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between items-center pt-2 border-t border-gray-100 font-bold">
                  <span class="flex items-center gap-1.5 text-emerald-700">
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span> Ganancia Neta de Bolsillo:
                  </span>
                  <span class="text-emerald-700 text-sm">${Calculator.formatCurrency(simResult.netProfit)}</span>
                </div>
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
          <span>🚀</span> Proyección de Ganancias por Volumen de Venta
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
                    <td class="p-3 font-bold text-gray-900">${qty} ${this.getModeLabel(isCake)}s</td>
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

      <!-- Modal: Agregar a Cotización (Nueva o Existente) -->
      <div id="sim-add-to-quote-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between">
            <h3 class="font-bold text-base sm:text-lg flex items-center gap-2">
              <span>📋</span> Agregar a Presupuesto
            </h3>
            <button onclick="SimulatorModule.closeAddToQuoteModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-5 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
            <!-- Producto a Agregar -->
            <div class="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100 space-y-2">
              <div class="flex justify-between items-start gap-2">
                <div class="flex-1">
                  <span class="text-[10px] font-bold text-pink-700 uppercase tracking-wider block">Producto Simulado</span>
                  <input type="text" id="sim-modal-name" value="${recipeName}" class="font-bold text-gray-900 bg-transparent border-b border-pink-200 focus:outline-none focus:border-pink-500 text-sm w-full">
                </div>
                <div class="text-right shrink-0">
                  <span class="text-[10px] text-gray-400 block font-medium">Precio Unitario</span>
                  <span class="text-base font-black text-pink-600">${Calculator.formatCurrency(this.currentPrice)}</span>
                </div>
              </div>

              <!-- Selector de Cantidad -->
              <div class="flex justify-between items-center pt-2 border-t border-pink-100/80">
                <label class="text-xs font-semibold text-gray-700">Cantidad a Cotizar:</label>
                <div class="flex items-center gap-2">
                  <input type="number" min="1" step="1" id="sim-modal-qty" value="1" oninput="SimulatorModule.onSimModalQtyChange(this.value)" class="w-16 px-2.5 py-1 text-center font-bold text-sm rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <span class="text-xs text-gray-500">${this.getModeLabel(isCake)}s</span>
                </div>
              </div>

              <div class="flex justify-between items-center text-xs pt-1 font-bold text-gray-800">
                <span>Subtotal Estimado:</span>
                <span id="sim-modal-subtotal" class="text-pink-600 text-sm">${Calculator.formatCurrency(this.currentPrice)}</span>
              </div>
            </div>

            <!-- Opciones de Destino -->
            <div class="space-y-3 pt-1">
              <!-- Opción 1: Crear Nueva Cotización -->
              <button type="button" onclick="SimulatorModule.confirmCreateNewQuote()" class="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-md shadow-pink-200 transition flex items-center justify-center gap-2 text-xs sm:text-sm">
                <span>✨</span> Crear Nueva Cotización con este Producto
              </button>

              <div class="relative flex py-1 items-center">
                <div class="flex-grow border-t border-gray-200"></div>
                <span class="flex-shrink mx-3 text-[11px] font-semibold text-gray-400 uppercase">O a una existente</span>
                <div class="flex-grow border-t border-gray-200"></div>
              </div>

              <!-- Opción 2: Añadir a Cotización Existente -->
              <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5">
                <label class="block text-xs font-bold text-gray-700">Seleccionar Cotización Guardada:</label>
                ${allQuotes.length > 0 ? `
                  <select id="sim-modal-target-quote" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white text-xs font-medium text-gray-800">
                    ${allQuotes.map(q => `
                      <option value="${q.id}">
                        ${q.code} - ${q.customerName || 'Cliente'} (${Calculator.formatCurrency(q.total)})
                      </option>
                    `).join('')}
                  </select>
                  <button type="button" onclick="SimulatorModule.confirmAddToExistingQuote()" class="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                    <span>📥</span> Añadir a Esta Cotización
                  </button>
                ` : `
                  <p class="text-xs text-gray-500">No tienes cotizaciones guardadas aún. Usa el botón superior para crear una nueva.</p>
                `}
              </div>
            </div>
          </div>
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
      <div style="width: ${Math.max(10, costPct)}%" class="bg-rose-400 truncate px-1" title="Costo de Fabricación: ${costPct.toFixed(0)}%">
        Costo ${costPct.toFixed(0)}%
      </div>
      ${commPct > 0 ? `
        <div style="width: ${commPct}%" class="bg-amber-400 truncate px-0.5" title="Comisión POS">
          ${commPct.toFixed(1)}%
        </div>
      ` : ''}
      <div style="width: ${Math.max(10, profitPct)}%" class="bg-emerald-500 truncate px-1" title="Ganancia Neta: ${profitPct.toFixed(0)}%">
        Ganancia ${profitPct.toFixed(0)}%
      </div>
    `;
  },

  getModeLabel(isCake) {
    if (this.simMode === 'batch') return 'Lote';
    if (this.simMode === 'portion' || isCake) return 'Porción';
    return 'Unidad';
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
    this.render();
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
    this.currentPrice += amount;
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
  // Acciones de Agregar a Cotización
  // ==========================================
  openAddToQuoteModal() {
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
