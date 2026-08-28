// ==========================================
// Cakekulator - Panel de Administración de Finanzas
// Solo visible para usuarios autenticados
// ==========================================

const FinanceModule = {
  charts: {},
  selectedPeriod: '6m',
  selectedPriceIngredients: [],

  render() {
    const container = document.getElementById('finance-view');
    if (!container) return;

    const isLoggedIn = typeof AuthModule !== 'undefined' && AuthModule.currentUser;

    if (!isLoggedIn) {
      container.innerHTML = this.renderLoginGate();
      return;
    }

    const quotes = DB.getQuotes();
    const recipes = DB.getRecipes();
    const ingredients = DB.getIngredients();
    const settings = DB.getSettings();
    const priceHistory = DB.getPriceHistory();

    // Calcular métricas
    const approvedQuotes = quotes.filter(q => q.status === 'approved');
    const totalSales = approvedQuotes.reduce((s, q) => s + (Number(q.total) || 0), 0);
    const avgTicket = approvedQuotes.length > 0 ? totalSales / approvedQuotes.length : 0;
    const conversionRate = quotes.length > 0 ? (approvedQuotes.length / quotes.length) * 100 : 0;

    // Margen promedio ponderado
    let totalMarginWeighted = 0;
    let totalCostWeighted = 0;
    const ingredientsMap = new Map(ingredients.map(i => [i.id, i]));
    approvedQuotes.forEach(q => {
      (q.items || []).forEach(item => {
        const recipe = recipes.find(r => r.id === item.recipeId);
        if (recipe) {
          const costs = Calculator.calculateRecipeFullCosts(recipe, ingredientsMap);
          if (costs) {
            const unitCost = costs.costPerUnit || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const qty = Number(item.quantity) || 1;
            if (unitPrice > 0) {
              totalMarginWeighted += ((unitPrice - unitCost) / unitPrice) * 100 * (unitPrice * qty);
              totalCostWeighted += unitPrice * qty;
            }
          }
        }
      });
    });
    const avgMargin = totalCostWeighted > 0 ? totalMarginWeighted / totalCostWeighted : 0;

    container.innerHTML = `
      <div class="space-y-4 sm:space-y-5 max-w-6xl mx-auto">
        
        <!-- Header del Panel -->
        <div class="bg-pink-600 dark:bg-pink-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
                📊
              </div>
              <div>
                <h2 class="text-lg sm:text-2xl font-black tracking-tight leading-tight">
                  Panel de Finanzas
                </h2>
                <p class="text-pink-100 text-[11px] sm:text-xs mt-0.5">
                  Inteligencia financiera de ${settings.businessName || 'tu pastelería'}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${['3m', '6m', '12m', 'all'].map(p => `
                <button onclick="FinanceModule.setPeriod('${p}')" class="px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition ${this.selectedPeriod === p ? 'bg-white text-pink-700 shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'} cursor-pointer">
                  ${p === '3m' ? '3 Meses' : p === '6m' ? '6 Meses' : p === '12m' ? '1 Año' : 'Todo'}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="absolute -right-4 -bottom-6 opacity-15 text-7xl sm:text-8xl pointer-events-none select-none">💰</div>
        </div>

        <!-- KPIs Financieros -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          ${this.renderKpiCard('💵', 'Ventas Totales', Calculator.formatCurrency(totalSales), 'Cotizaciones aprobadas', 'pink')}
          ${this.renderKpiCard('🎫', 'Ticket Promedio', Calculator.formatCurrency(avgTicket), `${approvedQuotes.length} ventas`, 'purple')}
          ${this.renderKpiCard('📈', 'Tasa Conversión', avgMargin > 0 ? conversionRate.toFixed(1) + '%' : '—', `${approvedQuotes.length} de ${quotes.length}`, 'emerald')}
          ${this.renderKpiCard('💎', 'Margen Promedio', avgMargin > 0 ? avgMargin.toFixed(1) + '%' : '—', 'Ponderado por venta', 'amber')}
        </div>

        <!-- Fila de Gráficos: Evolutivo + Proyección -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Evolutivo de Cotizaciones -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-3">
              <span>📊</span> Evolutivo de Cotizaciones
            </h3>
            <div class="relative" style="height: 260px;">
              <canvas id="finance-quotes-chart"></canvas>
            </div>
          </div>

          <!-- Proyección de Ventas -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-3">
              <span>🔮</span> Proyección de Ventas
            </h3>
            <div class="relative" style="height: 260px;">
              <canvas id="finance-projection-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Fila: Productos Más Pedidos -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <!-- Donut Chart -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-3">
              <span>🏆</span> Top Productos
            </h3>
            <div class="relative mx-auto" style="height: 220px; max-width: 220px;">
              <canvas id="finance-products-chart"></canvas>
            </div>
          </div>

          <!-- Tabla de Productos -->
          <div class="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-3">
              <span>📋</span> Detalle de Productos Más Cotizados
            </h3>
            <div class="overflow-x-auto">
              ${this.renderTopProductsTable(quotes, recipes)}
            </div>
          </div>
        </div>

        <!-- Evolutivo de Precios de Insumos -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <span>📉</span> Evolutivo de Precios de Insumos
            </h3>
            <div class="flex items-center gap-2 flex-wrap">
              <select id="finance-ingredient-select" onchange="FinanceModule.addPriceIngredient(this.value); this.value='';"
                class="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-pink-400 max-w-[200px]">
                <option value="">+ Agregar insumo al gráfico</option>
                ${ingredients.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
              </select>
            </div>
          </div>
          ${this.selectedPriceIngredients.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${this.selectedPriceIngredients.map(id => {
                const ing = ingredients.find(i => i.id === id);
                return ing ? `
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-[11px] font-bold border border-pink-200 dark:border-pink-800">
                    ${ing.name}
                    <button onclick="FinanceModule.removePriceIngredient('${id}')" class="text-pink-400 hover:text-pink-600 cursor-pointer ml-0.5">✕</button>
                  </span>
                ` : '';
              }).join('')}
            </div>
          ` : `
            <div class="py-6 text-center text-gray-400 dark:text-gray-500 text-xs">
              <span class="text-2xl block mb-1">📉</span>
              Selecciona uno o más insumos del menú para ver cómo han variado sus precios en el tiempo.
              ${priceHistory.length === 0 ? '<br><span class="text-[11px] text-gray-300 dark:text-gray-600 mt-1 block">El historial se llena automáticamente cada vez que editas el precio de un insumo.</span>' : ''}
            </div>
          `}
          ${this.selectedPriceIngredients.length > 0 ? `
            <div class="relative" style="height: 260px;">
              <canvas id="finance-price-history-chart"></canvas>
            </div>
            ${this.renderPriceTrends(priceHistory, ingredients)}
          ` : ''}
        </div>

        <!-- Rentabilidad por Receta -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-800 shadow-sm">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-3">
            <span>💰</span> Rentabilidad por Receta
          </h3>
          <div class="overflow-x-auto">
            ${this.renderProfitabilityTable(recipes, ingredientsMap)}
          </div>
        </div>

      </div>
    `;

    // Renderizar gráficos después de que el DOM esté listo
    requestAnimationFrame(() => {
      this.renderQuotesChart(quotes);
      this.renderProjectionChart(quotes);
      this.renderProductsDonut(quotes);
      if (this.selectedPriceIngredients.length > 0) {
        this.renderPriceHistoryChart(priceHistory, ingredients);
      }
    });
  },

  // ==========================================
  // Gate de Login
  // ==========================================
  renderLoginGate() {
    return `
      <div class="max-w-lg mx-auto mt-12 text-center space-y-5">
        <div class="w-20 h-20 rounded-3xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center mx-auto text-4xl shadow-sm border border-pink-100 dark:border-pink-900">
          🔐
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">Panel de Finanzas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
          Inicia sesión con tu cuenta de Google para acceder a la inteligencia financiera de tu pastelería: evolutivos, proyecciones y análisis de tendencias.
        </p>
        <button onclick="AuthModule.showLoginRequiredModal()" class="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl text-sm shadow-md transition active:scale-95 cursor-pointer inline-flex items-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.11a7.12 7.12 0 0 1 0-4.22V7.05H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.66-2.84.9-.44z"/><path fill="currentColor" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z"/></svg>
          Iniciar Sesión con Google
        </button>
      </div>
    `;
  },

  // ==========================================
  // Tarjeta KPI
  // ==========================================
  renderKpiCard(icon, label, value, sub, color) {
    const colors = {
      pink: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900',
      purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900',
      emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
      amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900'
    };
    const iconBg = {
      pink: 'bg-pink-100 dark:bg-pink-900/50',
      purple: 'bg-purple-100 dark:bg-purple-900/50',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/50',
      amber: 'bg-amber-100 dark:bg-amber-900/50'
    };
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border ${colors[color] || colors.pink} shadow-xs finance-kpi-card">
        <div class="flex items-center gap-2 mb-1.5">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${iconBg[color] || iconBg.pink} flex items-center justify-center text-base sm:text-lg shrink-0">${icon}</div>
          <span class="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">${label}</span>
        </div>
        <div class="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">${value}</div>
        <div class="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">${sub}</div>
      </div>
    `;
  },

  // ==========================================
  // Helpers
  // ==========================================
  setPeriod(period) {
    this.selectedPeriod = period;
    this.render();
  },

  addPriceIngredient(id) {
    if (!id || this.selectedPriceIngredients.includes(id)) return;
    if (this.selectedPriceIngredients.length >= 5) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('Máximo 5 insumos para comparar');
      return;
    }
    this.selectedPriceIngredients.push(id);
    this.render();
  },

  removePriceIngredient(id) {
    this.selectedPriceIngredients = this.selectedPriceIngredients.filter(i => i !== id);
    this.render();
  },

  getFilteredQuotes(quotes) {
    const now = new Date();
    let cutoff = null;
    if (this.selectedPeriod === '3m') cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    else if (this.selectedPeriod === '6m') cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    else if (this.selectedPeriod === '12m') cutoff = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    if (!cutoff) return quotes;
    return quotes.filter(q => q.createdAt && new Date(q.createdAt) >= cutoff);
  },

  getMonthLabels(quotes) {
    const filtered = this.getFilteredQuotes(quotes);
    const months = new Map();
    filtered.forEach(q => {
      if (!q.createdAt) return;
      const d = new Date(q.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months.has(key)) months.set(key, key);
    });

    // Si no hay datos, generar los últimos meses según periodo
    if (months.size === 0) {
      const now = new Date();
      const count = this.selectedPeriod === '3m' ? 3 : this.selectedPeriod === '6m' ? 6 : this.selectedPeriod === '12m' ? 12 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.set(key, key);
      }
    }

    return Array.from(months.keys()).sort();
  },

  formatMonthLabel(key) {
    const [y, m] = key.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  },

  // ==========================================
  // Gráfico: Evolutivo de Cotizaciones
  // ==========================================
  renderQuotesChart(quotes) {
    const canvas = document.getElementById('finance-quotes-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.quotes) this.charts.quotes.destroy();

    const filtered = this.getFilteredQuotes(quotes);
    const labels = this.getMonthLabels(quotes);

    const statusGroups = {
      approved: { label: 'Aprobadas', color: '#059669' },
      sent: { label: 'Enviadas', color: '#7c3aed' },
      rejected: { label: 'Rechazadas', color: '#dc2626' },
      draft: { label: 'Borradores', color: '#94a3b8' }
    };

    const datasets = Object.entries(statusGroups).map(([status, info]) => ({
      label: info.label,
      data: labels.map(month => {
        return filtered.filter(q => {
          if (!q.createdAt) return false;
          const d = new Date(q.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === month && q.status === status;
        }).length;
      }),
      backgroundColor: info.color + '99',
      borderColor: info.color,
      borderWidth: 1,
      borderRadius: 6,
      stack: 'stack0'
    }));

    // Línea de monto total
    const amountData = labels.map(month => {
      return filtered.filter(q => {
        if (!q.createdAt) return false;
        const d = new Date(q.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === month;
      }).reduce((s, q) => s + (Number(q.total) || 0), 0);
    });

    datasets.push({
      label: 'Monto Total',
      data: amountData,
      type: 'line',
      borderColor: '#db2777',
      backgroundColor: '#db277720',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#db2777',
      tension: 0.3,
      yAxisID: 'y1',
      fill: true
    });

    this.charts.quotes = new Chart(canvas, {
      type: 'bar',
      data: { labels: labels.map(l => this.formatMonthLabel(l)), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                if (ctx.dataset.yAxisID === 'y1') return `${ctx.dataset.label}: ${Calculator.formatCurrency(ctx.raw)}`;
                return `${ctx.dataset.label}: ${ctx.raw}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Cantidad', font: { size: 10 } }, ticks: { font: { size: 10 }, stepSize: 1 }, grid: { color: '#f3f4f620' } },
          y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Monto ($)', font: { size: 10 } }, ticks: { font: { size: 10 }, callback: v => Calculator.formatCurrency(v) }, grid: { drawOnChartArea: false } }
        }
      }
    });
  },

  // ==========================================
  // Gráfico: Proyección de Ventas
  // ==========================================
  renderProjectionChart(quotes) {
    const canvas = document.getElementById('finance-projection-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.projection) this.charts.projection.destroy();

    const approvedQuotes = quotes.filter(q => q.status === 'approved' && q.createdAt);
    const labels = this.getMonthLabels(quotes);

    const monthlyTotals = labels.map(month => {
      return approvedQuotes.filter(q => {
        const d = new Date(q.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === month;
      }).reduce((s, q) => s + (Number(q.total) || 0), 0);
    });

    // Proyección lineal simple (3 meses futuros)
    const n = monthlyTotals.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += monthlyTotals[i];
      sumXY += i * monthlyTotals[i];
      sumXX += i * i;
    }
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

    const projectionMonths = 3;
    const projLabels = [...labels];
    const projData = [...monthlyTotals];
    const now = new Date();
    const lastMonth = labels.length > 0 ? labels[labels.length - 1] : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [ly, lm] = lastMonth.split('-').map(Number);

    for (let i = 1; i <= projectionMonths; i++) {
      const nd = new Date(ly, lm - 1 + i, 1);
      const key = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
      projLabels.push(key);
      projData.push(Math.max(0, Math.round(slope * (n + i - 1) + intercept)));
    }

    // Calcular desviación estándar para intervalo de confianza
    const mean = n > 0 ? sumY / n : 0;
    const variance = n > 1 ? monthlyTotals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);

    const upperBand = projData.map((v, i) => i >= n ? Math.round(v + stdDev * 1.2) : null);
    const lowerBand = projData.map((v, i) => i >= n ? Math.max(0, Math.round(v - stdDev * 1.2)) : null);

    this.charts.projection = new Chart(canvas, {
      type: 'line',
      data: {
        labels: projLabels.map(l => this.formatMonthLabel(l)),
        datasets: [
          {
            label: 'Ventas Reales',
            data: monthlyTotals.concat(Array(projectionMonths).fill(null)),
            borderColor: '#059669',
            backgroundColor: '#05966920',
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#059669',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Proyección',
            data: Array(n > 0 ? n - 1 : 0).fill(null).concat(n > 0 ? [monthlyTotals[n - 1]] : []).concat(projData.slice(n)),
            borderColor: '#db2777',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 3,
            pointBackgroundColor: '#db2777',
            tension: 0.3,
            fill: false
          },
          {
            label: 'Banda Superior',
            data: Array(n > 0 ? n - 1 : 0).fill(null).concat(n > 0 ? [monthlyTotals[n - 1]] : []).concat(upperBand.slice(n)),
            borderColor: 'transparent',
            backgroundColor: '#db277715',
            fill: '+1',
            pointRadius: 0
          },
          {
            label: 'Banda Inferior',
            data: Array(n > 0 ? n - 1 : 0).fill(null).concat(n > 0 ? [monthlyTotals[n - 1]] : []).concat(lowerBand.slice(n)),
            borderColor: 'transparent',
            backgroundColor: '#db277715',
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true, boxWidth: 8, font: { size: 10 },
              filter: item => !item.text.includes('Banda')
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ctx.dataset.label.includes('Banda') ? null : `${ctx.dataset.label}: ${Calculator.formatCurrency(ctx.raw)}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => Calculator.formatCurrency(v) }, grid: { color: '#f3f4f620' } }
        }
      }
    });
  },

  // ==========================================
  // Gráfico: Productos Más Pedidos (Donut)
  // ==========================================
  renderProductsDonut(quotes) {
    const canvas = document.getElementById('finance-products-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.products) this.charts.products.destroy();

    const productCounts = {};
    const filtered = this.getFilteredQuotes(quotes);
    filtered.forEach(q => {
      (q.items || []).forEach(item => {
        const name = item.recipeName || 'Sin nombre';
        if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 };
        productCounts[name].count += Number(item.quantity) || 1;
        productCounts[name].revenue += Number(item.subtotal) || 0;
      });
    });

    const sorted = Object.entries(productCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
    const chartColors = ['#db2777', '#7c3aed', '#059669', '#d97706', '#2563eb', '#dc2626', '#0891b2', '#84cc16'];

    if (sorted.length === 0) {
      canvas.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center"><div><span class="text-2xl block mb-1">📭</span>Sin datos de productos<br>en el periodo seleccionado</div></div>';
      return;
    }

    this.charts.products = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          data: sorted.map(s => s[1].count),
          backgroundColor: chartColors.slice(0, sorted.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.raw} pedidos`
            }
          }
        }
      }
    });
  },

  // ==========================================
  // Tabla: Top Productos
  // ==========================================
  renderTopProductsTable(quotes, recipes) {
    const productCounts = {};
    const filtered = this.getFilteredQuotes(quotes);
    let grandTotal = 0;

    filtered.forEach(q => {
      (q.items || []).forEach(item => {
        const name = item.recipeName || 'Sin nombre';
        if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 };
        productCounts[name].count += Number(item.quantity) || 1;
        productCounts[name].revenue += Number(item.subtotal) || 0;
        grandTotal += Number(item.subtotal) || 0;
      });
    });

    const sorted = Object.entries(productCounts).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
    const chartColors = ['#db2777', '#7c3aed', '#059669', '#d97706', '#2563eb', '#dc2626', '#0891b2', '#84cc16', '#6366f1', '#f43f5e'];

    if (sorted.length === 0) {
      return '<div class="py-6 text-center text-gray-400 text-xs"><span class="text-xl block mb-1">📭</span>No hay productos cotizados en este periodo.</div>';
    }

    return `
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
            <th class="py-2 pr-2"></th>
            <th class="py-2 pr-2 font-bold">Producto</th>
            <th class="py-2 pr-2 font-bold text-center">Pedidos</th>
            <th class="py-2 pr-2 font-bold text-right">Ingresos</th>
            <th class="py-2 font-bold text-right">% Total</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(([name, data], i) => `
            <tr class="border-b border-gray-50 dark:border-slate-800/50 hover:bg-pink-50/30 dark:hover:bg-slate-800/30 transition">
              <td class="py-2 pr-2">
                <div class="w-3 h-3 rounded-full" style="background: ${chartColors[i] || '#94a3b8'}"></div>
              </td>
              <td class="py-2 pr-2 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">${name}</td>
              <td class="py-2 pr-2 text-center font-bold text-gray-700 dark:text-gray-300">${data.count}</td>
              <td class="py-2 pr-2 text-right font-black text-emerald-600 dark:text-emerald-400">${Calculator.formatCurrency(data.revenue)}</td>
              <td class="py-2 text-right text-gray-500 dark:text-gray-400">${grandTotal > 0 ? ((data.revenue / grandTotal) * 100).toFixed(1) : 0}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  // ==========================================
  // Gráfico: Historial de Precios
  // ==========================================
  renderPriceHistoryChart(priceHistory, ingredients) {
    const canvas = document.getElementById('finance-price-history-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (this.charts.priceHistory) this.charts.priceHistory.destroy();

    const chartColors = ['#db2777', '#7c3aed', '#059669', '#d97706', '#2563eb'];

    const datasets = this.selectedPriceIngredients.map((ingId, idx) => {
      const ing = ingredients.find(i => i.id === ingId);
      const records = priceHistory
        .filter(r => r.ingredientId === ingId)
        .sort((a, b) => a.timestamp - b.timestamp);

      // Agregar precio actual al final
      if (ing) {
        const lastRecord = records.length > 0 ? records[records.length - 1] : null;
        if (!lastRecord || lastRecord.newPrice !== ing.packagePrice) {
          records.push({
            ingredientId: ingId,
            ingredientName: ing.name,
            newPrice: ing.packagePrice,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
          });
        }
      }

      return {
        label: ing ? ing.name : ingId,
        data: records.map(r => ({ x: r.date || new Date(r.timestamp).toISOString().split('T')[0], y: r.newPrice })),
        borderColor: chartColors[idx % chartColors.length],
        backgroundColor: chartColors[idx % chartColors.length] + '20',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: chartColors[idx % chartColors.length],
        tension: 0.3,
        fill: false
      };
    });

    if (datasets.every(d => d.data.length === 0)) {
      canvas.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs text-center py-8"><div><span class="text-xl block mb-1">📉</span>Sin historial de precios para los insumos seleccionados.<br><span class="text-[11px] text-gray-300">El historial se genera automáticamente al editar precios de insumos.</span></div></div>';
      return;
    }

    this.charts.priceHistory = new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${Calculator.formatCurrency(ctx.raw.y || ctx.raw)}` } }
        },
        scales: {
          x: { type: 'category', grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
          y: { beginAtZero: false, ticks: { font: { size: 10 }, callback: v => Calculator.formatCurrency(v) }, grid: { color: '#f3f4f620' } }
        }
      }
    });
  },

  // ==========================================
  // Insights de Tendencia de Precios
  // ==========================================
  renderPriceTrends(priceHistory, ingredients) {
    if (this.selectedPriceIngredients.length === 0) return '';

    const trends = this.selectedPriceIngredients.map(ingId => {
      const ing = ingredients.find(i => i.id === ingId);
      if (!ing) return null;

      const records = priceHistory.filter(r => r.ingredientId === ingId).sort((a, b) => a.timestamp - b.timestamp);
      if (records.length < 2) return null;

      const oldest = records[0].newPrice || records[0].oldPrice;
      const newest = records[records.length - 1].newPrice;
      const change = oldest > 0 ? ((newest - oldest) / oldest) * 100 : 0;

      return { name: ing.name, change, newest, oldest };
    }).filter(Boolean);

    if (trends.length === 0) return '';

    return `
      <div class="flex flex-wrap gap-2 mt-3">
        ${trends.map(t => `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
            t.change > 0
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
              : t.change < 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
          }">
            <span>${t.change > 0 ? '↗' : t.change < 0 ? '↘' : '→'}</span>
            <span>${t.name}:</span>
            <span>${t.change >= 0 ? '+' : ''}${t.change.toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ==========================================
  // Tabla: Rentabilidad por Receta
  // ==========================================
  renderProfitabilityTable(recipes, ingredientsMap) {
    if (recipes.length === 0) {
      return '<div class="py-6 text-center text-gray-400 text-xs"><span class="text-xl block mb-1">🎂</span>No hay recetas registradas todavía.</div>';
    }

    const recipeData = recipes.map(r => {
      const costs = Calculator.calculateRecipeFullCosts(r, ingredientsMap);
      const sellingPrice = Number(r.sellingPrice) || costs.suggestedUnitPrice || 0;
      const cost = costs.costPerUnit || 0;
      const profit = sellingPrice - cost;
      const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

      return { name: r.name, type: r.type, cost, sellingPrice, profit, margin };
    }).sort((a, b) => b.margin - a.margin);

    return `
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
            <th class="py-2 pr-2 font-bold">Receta</th>
            <th class="py-2 pr-2 font-bold text-right">Costo</th>
            <th class="py-2 pr-2 font-bold text-right">Precio Venta</th>
            <th class="py-2 pr-2 font-bold text-right">Ganancia</th>
            <th class="py-2 font-bold text-right">Margen %</th>
          </tr>
        </thead>
        <tbody>
          ${recipeData.map(r => {
            const marginColor = r.margin >= 40
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              : r.margin >= 20
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40';
            return `
              <tr class="border-b border-gray-50 dark:border-slate-800/50 hover:bg-pink-50/30 dark:hover:bg-slate-800/30 transition">
                <td class="py-2.5 pr-2 font-bold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
                  <span class="mr-1">${r.type === 'cake' ? '🎂' : '🍪'}</span>${r.name}
                </td>
                <td class="py-2.5 pr-2 text-right text-gray-600 dark:text-gray-400">${Calculator.formatCurrency(r.cost)}</td>
                <td class="py-2.5 pr-2 text-right font-bold text-gray-800 dark:text-gray-200">${Calculator.formatCurrency(r.sellingPrice)}</td>
                <td class="py-2.5 pr-2 text-right font-bold ${r.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">${Calculator.formatCurrency(r.profit)}</td>
                <td class="py-2.5 text-right">
                  <span class="inline-block px-2 py-0.5 rounded-lg text-[11px] font-black ${marginColor}">
                    ${r.margin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
};
