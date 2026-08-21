// ==========================================
// Cakekulator - Módulo de Presupuestos y Cotizaciones
// ==========================================

const QuotesModule = {
  searchQuery: '',
  filterStatus: 'all',
  editingQuoteId: null,

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('quotes-view');
    if (!container) return;

    const allQuotes = DB.getQuotes();
    const settings = DB.getSettings();

    // Filtrar
    let filtered = allQuotes.filter(q => {
      const matchesStatus = this.filterStatus === 'all' || q.status === this.filterStatus;
      const matchesSearch = !this.searchQuery || 
        (q.customerName && q.customerName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (q.code && q.code.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (q.eventName && q.eventName.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });

    container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📋</span> Presupuestos & Cotizaciones
          </h2>
          <p class="text-sm text-gray-500">Crea cotizaciones profesionales, calcula abonos y envíalas directo a WhatsApp o PDF.</p>
        </div>
        <button onclick="QuotesModule.openEditor()" class="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium shadow-md shadow-pink-200 transition active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Cotización
        </button>
      </div>

      <!-- Barra de Búsqueda y Filtros -->
      <div class="space-y-3 mb-5">
        <div class="relative">
          <input 
            type="text" 
            id="quote-search" 
            placeholder="Buscar por cliente, folio o evento..." 
            value="${this.searchQuery}"
            oninput="QuotesModule.onSearch(this.value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white shadow-sm text-sm"
          />
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          ${this.searchQuery ? `
            <button onclick="QuotesModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ` : ''}
        </div>

        <!-- Filtros de Estado -->
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${[
            { id: 'all', label: '✨ Todas (' + allQuotes.length + ')' },
            { id: 'draft', label: '📝 Borradores' },
            { id: 'sent', label: '📤 Enviadas' },
            { id: 'approved', label: '✅ Aprobadas / Pagadas' },
            { id: 'rejected', label: '❌ Rechazadas' }
          ].map(st => `
            <button 
              onclick="QuotesModule.filterByStatus('${st.id}')"
              class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition ${this.filterStatus === st.id ? 'bg-pink-500 text-white shadow-sm font-semibold' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-100'}">
              ${st.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Listado de Cotizaciones -->
      ${filtered.length === 0 ? `
        <div class="bg-white rounded-2xl p-8 text-center border border-pink-100 shadow-sm">
          <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📑</div>
          <h3 class="text-base font-semibold text-gray-800">No hay presupuestos registrados</h3>
          <p class="text-xs text-gray-500 mt-1 mb-4">Crea una cotización para un cliente seleccionando tus productos.</p>
          <button onclick="QuotesModule.openEditor()" class="btn-secondary px-4 py-2 rounded-xl text-xs font-medium text-pink-600 border border-pink-200 hover:bg-pink-50">
            + Crear Presupuesto
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map(q => {
            const statusInfo = this.getStatusBadge(q.status);
            const total = q.total || q.subtotal || 0;
            const deposit = q.depositAmount || (total * 0.5);
            const balance = q.remainingBalance || (total - deposit);

            return `
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group">
                <div class="p-4">
                  <!-- Top Bar -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md font-mono">${q.code || 'COT'}</span>
                        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.badgeClass}">${statusInfo.label}</span>
                      </div>
                      <h3 class="font-bold text-gray-900 text-base leading-tight">${q.customerName || 'Cliente sin nombre'}</h3>
                      ${q.customerPhone ? `<p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">📞 ${q.customerPhone}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="QuotesModule.openEditor('${q.id}')" title="Editar" class="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button onclick="QuotesModule.deleteQuote('${q.id}')" title="Eliminar" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Detalle Evento -->
                  <div class="bg-gray-50/80 rounded-xl p-2.5 text-xs text-gray-600 space-y-1 mb-3">
                    ${q.eventName ? `<div class="font-medium text-gray-800">🎉 ${q.eventName}</div>` : ''}
                    ${q.eventDate ? `<div class="text-gray-500">📅 Fecha: <span class="font-semibold text-gray-700">${q.eventDate}</span></div>` : ''}
                    <div class="text-[11px] text-gray-500">🛒 ${(q.items || []).length} productos en el pedido</div>
                  </div>

                  <!-- Resumen Financiero -->
                  <div class="bg-gradient-to-r from-pink-50/50 to-rose-50/30 rounded-xl p-3 border border-pink-100 text-xs space-y-1.5">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Total Cotizado:</span>
                      <span class="text-base font-black text-gray-900">${Calculator.formatCurrency(total)}</span>
                    </div>
                    <div class="flex justify-between items-center text-emerald-700 font-medium">
                      <span>Abono requerido (${q.depositPercent || 50}%):</span>
                      <span class="font-bold">${Calculator.formatCurrency(deposit)}</span>
                    </div>
                    <div class="flex justify-between items-center text-gray-500 text-[11px]">
                      <span>Saldo al entregar:</span>
                      <span>${Calculator.formatCurrency(balance)}</span>
                    </div>
                  </div>
                </div>

                <!-- Footer Botones de Exportar -->
                <div class="p-3 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button onclick="QuotesModule.sendWhatsApp('${q.id}')" class="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200 transition">
                    <span>💬</span> Enviar WhatsApp
                  </button>
                  <button onclick="QuotesModule.viewPrintModal('${q.id}')" class="py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                    <span>🖨️</span> Ver / PDF
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Modal Editor de Cotización -->
      <div id="quote-editor-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between shrink-0">
            <h3 id="quote-editor-title" class="font-bold text-lg flex items-center gap-2">
              <span>📋</span> Nueva Cotización para Cliente
            </h3>
            <button onclick="QuotesModule.closeEditor()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form id="quote-form" onsubmit="QuotesModule.saveQuoteForm(event)" class="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
            <input type="hidden" id="q-id" value="">
            <input type="hidden" id="q-code" value="">

            <!-- 1. Datos del Cliente -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">1</span>
                Datos del Cliente y Evento
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre del Cliente *</label>
                  <input type="text" id="q-customer-name" required placeholder="Ej. Camila González" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Teléfono / WhatsApp</label>
                  <input type="tel" id="q-customer-phone" placeholder="Ej. +56 9 8765 4321" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Motivo / Evento</label>
                  <input type="text" id="q-event-name" placeholder="Ej. Cumpleaños, Baby Shower" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Fecha del Evento</label>
                  <input type="date" id="q-event-date" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Estado</label>
                  <select id="q-status" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="approved">Aprobada / Pagada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 2. Productos y Cantidades -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Productos del Pedido
                </h4>
                <button type="button" onclick="QuotesModule.addItemRow()" class="px-3 py-1.5 rounded-xl bg-pink-100 text-pink-700 hover:bg-pink-200 font-semibold text-xs transition flex items-center gap-1">
                  + Agregar Producto
                </button>
              </div>

              <div id="quote-items-table" class="space-y-2">
                <!-- Filas dinámicas -->
              </div>
            </div>

            <!-- 3. Totales, Descuento y Abono -->
            <div class="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-2xl border border-pink-100 space-y-3">
              <h4 class="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                Condiciones de Pago & Totales
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Descuento (%)</label>
                  <input type="number" min="0" max="100" id="q-discount-pct" value="0" oninput="QuotesModule.recalculateTotals()" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Abono Requerido (%)</label>
                  <input type="number" min="0" max="100" id="q-deposit-pct" value="50" oninput="QuotesModule.recalculateTotals()" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tipo de Entrega</label>
                  <select id="q-delivery" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="Retiro en taller">Retiro en taller</option>
                    <option value="Despacho a domicilio">Despacho a domicilio</option>
                  </select>
                </div>
              </div>

              <!-- Resumen Calculado en Vivo -->
              <div class="bg-white p-4 rounded-2xl border border-pink-200 space-y-2 text-xs">
                <div class="flex justify-between items-center text-gray-600">
                  <span>Subtotal Pedido:</span>
                  <span id="q-live-subtotal" class="font-bold text-gray-800 text-sm">$ 0</span>
                </div>
                <div class="flex justify-between items-center text-rose-600">
                  <span>Descuento aplicado:</span>
                  <span id="q-live-discount" class="font-bold">-$ 0</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-100 text-base font-black text-gray-900">
                  <span>TOTAL COTIZACIÓN:</span>
                  <span id="q-live-total" class="text-pink-600 text-lg">$ 0</span>
                </div>
                <div class="flex justify-between items-center pt-1 text-emerald-700 font-bold text-xs bg-emerald-50 p-2 rounded-xl">
                  <span>Abono para Reserva (50%):</span>
                  <span id="q-live-deposit">$ 0</span>
                </div>
                <div class="flex justify-between items-center text-gray-600 text-xs px-2">
                  <span>Saldo al momento de entrega:</span>
                  <span id="q-live-balance" class="font-bold">$ 0</span>
                </div>
              </div>
            </div>

            <!-- 4. Notas y Condiciones -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Notas y Condiciones del Presupuesto</label>
              <textarea id="q-notes" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white"></textarea>
            </div>

            <div class="flex gap-3 pt-3 border-t border-gray-200">
              <button type="button" onclick="QuotesModule.closeEditor()" class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 transition">
                Guardar Presupuesto
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Vista Imprimible / PDF de Cotización -->
      <div id="quote-print-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
          <div class="bg-gray-900 p-4 text-white flex items-center justify-between shrink-0 no-print">
            <h3 class="font-bold text-base flex items-center gap-2">
              <span>🖨️</span> Vista Previa de Presupuesto para Cliente
            </h3>
            <div class="flex items-center gap-2">
              <button onclick="window.print()" class="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>🖨️</span> Imprimir / Guardar PDF
              </button>
              <button onclick="QuotesModule.closePrintModal()" class="text-white/80 hover:text-white p-1 rounded-full">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div id="printable-quote-content" class="p-6 overflow-y-auto bg-white text-gray-900 text-sm print-area">
            <!-- Renderizado dinámico del formato formal de presupuesto -->
          </div>
        </div>
      </div>
    `;
  },

  getStatusBadge(status) {
    switch (status) {
      case 'approved': return { label: 'Aprobada', badgeClass: 'bg-emerald-100 text-emerald-800' };
      case 'sent': return { label: 'Enviada', badgeClass: 'bg-blue-100 text-blue-800' };
      case 'rejected': return { label: 'Rechazada', badgeClass: 'bg-red-100 text-red-800' };
      default: return { label: 'Borrador', badgeClass: 'bg-gray-100 text-gray-700' };
    }
  },

  onSearch(val) {
    this.searchQuery = val;
    this.render();
    const input = document.getElementById('quote-search');
    if (input) {
      input.focus();
      input.setSelectionRange(val.length, val.length);
    }
  },

  clearSearch() {
    this.searchQuery = '';
    this.render();
  },

  filterByStatus(st) {
    this.filterStatus = st;
    this.render();
  },

  openEditor(id = null) {
    const modal = document.getElementById('quote-editor-modal');
    const title = document.getElementById('quote-editor-title');
    const form = document.getElementById('quote-form');
    const settings = DB.getSettings();

    const itemsContainer = document.getElementById('quote-items-table');
    itemsContainer.innerHTML = '';

    if (id) {
      const q = DB.getQuoteById(id);
      if (!q) return;
      title.innerHTML = '<span>✏️</span> Editar Cotización ' + (q.code || '');
      document.getElementById('q-id').value = q.id;
      document.getElementById('q-code').value = q.code || '';
      document.getElementById('q-customer-name').value = q.customerName || '';
      document.getElementById('q-customer-phone').value = q.customerPhone || '';
      document.getElementById('q-event-name').value = q.eventName || '';
      document.getElementById('q-event-date').value = q.eventDate || '';
      document.getElementById('q-status').value = q.status || 'draft';
      document.getElementById('q-discount-pct').value = q.discountPercent || 0;
      document.getElementById('q-deposit-pct').value = q.depositPercent || 50;
      document.getElementById('q-delivery').value = q.deliveryOption || 'Retiro en taller';
      document.getElementById('q-notes').value = q.notes || settings.quoteNote;

      (q.items || []).forEach(item => {
        this.addItemRow(item.recipeId, item.recipeName, item.quantity, item.unitPrice);
      });
    } else {
      title.innerHTML = '<span>📋</span> Nueva Cotización para Cliente';
      form.reset();
      document.getElementById('q-id').value = '';
      document.getElementById('q-code').value = '';
      document.getElementById('q-deposit-pct').value = settings.defaultDepositPercent || 50;
      document.getElementById('q-discount-pct').value = 0;
      document.getElementById('q-notes').value = settings.quoteNote;

      this.addItemRow();
    }

    this.recalculateTotals();
    modal.classList.remove('hidden');
  },

  closeEditor() {
    const modal = document.getElementById('quote-editor-modal');
    if (modal) modal.classList.add('hidden');
  },

  addItemRow(selectedRecipeId = '', customName = '', qty = 1, unitPrice = 0) {
    const container = document.getElementById('quote-items-table');
    const allRecipes = DB.getRecipes();
    const rowId = 'qitem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs';
    
    row.innerHTML = `
      <div class="col-span-5 sm:col-span-5">
        <select class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:ring-1 focus:ring-pink-400 q-item-select bg-white" onchange="QuotesModule.onItemSelectChange('${rowId}')">
          <option value="">-- Seleccionar Receta o Personalizado --</option>
          ${allRecipes.map(r => {
            const costs = Calculator.calculateRecipeFullCosts(r);
            const price = costs.recipeType === 'cake' ? costs.suggestedBatchPrice : costs.suggestedUnitPrice;
            const finalPrice = Calculator.roundUpTo(price, 100);
            return `
              <option value="${r.id}" data-name="${r.name}" data-price="${finalPrice}" ${r.id === selectedRecipeId ? 'selected' : ''}>
                ${r.name}
              </option>
            `;
          }).join('')}
          <option value="custom" ${selectedRecipeId === 'custom' || (!selectedRecipeId && customName) ? 'selected' : ''}>✍️ Ítem Personalizado</option>
        </select>
        <input type="text" placeholder="Nombre ítem personalizado..." value="${customName}" class="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-xs q-item-custom-name ${selectedRecipeId === 'custom' || (!selectedRecipeId && customName) ? '' : 'hidden'}" oninput="QuotesModule.recalculateTotals()">
      </div>

      <div class="col-span-2 sm:col-span-2">
        <input type="number" step="1" min="1" placeholder="Cant" value="${qty || 1}" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-center q-item-qty focus:ring-1 focus:ring-pink-400" oninput="QuotesModule.recalculateTotals()">
      </div>

      <div class="col-span-3 sm:col-span-3">
        <input type="number" step="any" min="0" placeholder="Precio ($)" value="${unitPrice || ''}" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-right font-semibold q-item-price focus:ring-1 focus:ring-pink-400" oninput="QuotesModule.recalculateTotals()">
      </div>

      <div class="col-span-2 sm:col-span-2 flex items-center justify-between pl-1">
        <span class="text-[11px] font-black text-pink-600 q-item-subtotal truncate">$ 0</span>
        <button type="button" onclick="document.getElementById('${rowId}').remove(); QuotesModule.recalculateTotals();" class="text-gray-300 hover:text-red-500 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    container.appendChild(row);
    if (selectedRecipeId && !unitPrice) {
      this.onItemSelectChange(rowId);
    } else {
      this.recalculateTotals();
    }
  },

  onItemSelectChange(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const select = row.querySelector('.q-item-select');
    const customInput = row.querySelector('.q-item-custom-name');
    const priceInput = row.querySelector('.q-item-price');

    const selectedOption = select.options[select.selectedIndex];
    const val = select.value;

    if (val === 'custom') {
      customInput.classList.remove('hidden');
    } else if (val) {
      customInput.classList.add('hidden');
      const suggestedPrice = selectedOption.dataset.price;
      if (suggestedPrice && (!priceInput.value || parseFloat(priceInput.value) === 0)) {
        priceInput.value = suggestedPrice;
      }
    } else {
      customInput.classList.add('hidden');
    }

    this.recalculateTotals();
  },

  recalculateTotals() {
    let subtotal = 0;

    document.querySelectorAll('#quote-items-table > div').forEach(row => {
      const qty = parseFloat(row.querySelector('.q-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.q-item-price')?.value) || 0;
      const rowSubtotal = qty * price;
      subtotal += rowSubtotal;

      const subtotalSpan = row.querySelector('.q-item-subtotal');
      if (subtotalSpan) subtotalSpan.textContent = Calculator.formatCurrency(rowSubtotal);
    });

    const discountPct = parseFloat(document.getElementById('q-discount-pct')?.value) || 0;
    const discountAmount = subtotal * (discountPct / 100);
    const total = Math.max(0, subtotal - discountAmount);

    const depositPct = parseFloat(document.getElementById('q-deposit-pct')?.value) || 50;
    const depositAmount = total * (depositPct / 100);
    const remainingBalance = total - depositAmount;

    // Actualizar vista previa en vivo
    const subtotalEl = document.getElementById('q-live-subtotal');
    const discountEl = document.getElementById('q-live-discount');
    const totalEl = document.getElementById('q-live-total');
    const depositEl = document.getElementById('q-live-deposit');
    const balanceEl = document.getElementById('q-live-balance');

    if (subtotalEl) subtotalEl.textContent = Calculator.formatCurrency(subtotal);
    if (discountEl) discountEl.textContent = `-${Calculator.formatCurrency(discountAmount)} (${discountPct}%)`;
    if (totalEl) totalEl.textContent = Calculator.formatCurrency(total);
    if (depositEl) depositEl.textContent = `${Calculator.formatCurrency(depositAmount)} (${depositPct}%)`;
    if (balanceEl) balanceEl.textContent = Calculator.formatCurrency(remainingBalance);
  },

  saveQuoteForm(e) {
    e.preventDefault();

    const id = document.getElementById('q-id').value;
    const code = document.getElementById('q-code').value;
    const customerName = document.getElementById('q-customer-name').value.trim();
    const customerPhone = document.getElementById('q-customer-phone').value.trim();
    const eventName = document.getElementById('q-event-name').value.trim();
    const eventDate = document.getElementById('q-event-date').value;
    const status = document.getElementById('q-status').value;
    const discountPercent = parseFloat(document.getElementById('q-discount-pct').value) || 0;
    const depositPercent = parseFloat(document.getElementById('q-deposit-pct').value) || 50;
    const deliveryOption = document.getElementById('q-delivery').value;
    const notes = document.getElementById('q-notes').value.trim();

    // Recolectar ítems
    const items = [];
    let subtotal = 0;

    document.querySelectorAll('#quote-items-table > div').forEach(row => {
      const select = row.querySelector('.q-item-select');
      const customInput = row.querySelector('.q-item-custom-name');
      const qty = parseFloat(row.querySelector('.q-item-qty')?.value) || 1;
      const unitPrice = parseFloat(row.querySelector('.q-item-price')?.value) || 0;

      let recipeId = select?.value;
      let recipeName = '';

      if (recipeId === 'custom' || (!recipeId && customInput?.value)) {
        recipeId = 'custom';
        recipeName = customInput?.value.trim() || 'Ítem especial';
      } else if (recipeId) {
        const rec = DB.getRecipeById(recipeId);
        recipeName = rec ? rec.name : 'Producto';
      }

      if (recipeName && unitPrice > 0) {
        const itemSubtotal = qty * unitPrice;
        subtotal += itemSubtotal;
        items.push({
          recipeId,
          recipeName,
          quantity: qty,
          unitPrice,
          subtotal: itemSubtotal
        });
      }
    });

    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la cotización con precio mayor a cero.');
      return;
    }

    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const depositAmount = total * (depositPercent / 100);
    const remainingBalance = total - depositAmount;

    const data = {
      code,
      customerName,
      customerPhone,
      eventName,
      eventDate,
      status,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      depositPercent,
      depositAmount,
      remainingBalance,
      deliveryOption,
      notes
    };

    if (id) {
      DB.updateQuote(id, data);
    } else {
      DB.addQuote(data);
    }

    this.closeEditor();
    this.render();
    App.showToast(id ? 'Presupuesto actualizado' : 'Cotización generada con éxito');
  },

  deleteQuote(id) {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      DB.deleteQuote(id);
      this.render();
      App.showToast('Presupuesto eliminado');
    }
  },

  // Generador de Mensaje Formateado para WhatsApp
  sendWhatsApp(id) {
    const quote = DB.getQuoteById(id);
    if (!quote) return;
    const settings = DB.getSettings();

    let itemsText = '';
    (quote.items || []).forEach(item => {
      itemsText += `• *${item.quantity}x* ${item.recipeName} 👉 ${Calculator.formatCurrency(item.subtotal)}\n`;
    });

    let msg = `🧁 *PRESUPUESTO - ${settings.businessName || 'Pastelería'}*\n`;
    msg += `📄 *Folio:* ${quote.code}\n`;
    msg += `👤 *Cliente:* ${quote.customerName}\n`;
    if (quote.eventName) msg += `🎉 *Evento:* ${quote.eventName}\n`;
    if (quote.eventDate) msg += `📅 *Fecha:* ${quote.eventDate}\n`;
    msg += `\n🛒 *Detalle del Pedido:*\n${itemsText}\n`;
    msg += `-----------------------------\n`;
    msg += `💰 *Subtotal:* ${Calculator.formatCurrency(quote.subtotal)}\n`;
    if (quote.discountAmount > 0) {
      msg += `🏷️ *Descuento (${quote.discountPercent}%):* -${Calculator.formatCurrency(quote.discountAmount)}\n`;
    }
    msg += `✨ *TOTAL A PAGAR:* ${Calculator.formatCurrency(quote.total)}\n\n`;
    msg += `📌 *Abono para reservar (${quote.depositPercent}%):* ${Calculator.formatCurrency(quote.depositAmount)}\n`;
    msg += `💵 *Saldo pendiente al entregar:* ${Calculator.formatCurrency(quote.remainingBalance)}\n`;
    if (quote.deliveryOption) msg += `🚚 *Entrega:* ${quote.deliveryOption}\n`;
    if (quote.notes) msg += `\n📝 *Condiciones:* ${quote.notes}\n`;
    msg += `\n¡Gracias por preferir nuestro trabajo hecho con amor! 💕🎂`;

    const encodedMsg = encodeURIComponent(msg);
    let url = `https://wa.me/`;
    if (quote.customerPhone) {
      const cleanPhone = quote.customerPhone.replace(/[^0-9]/g, '');
      url += `${cleanPhone}?text=${encodedMsg}`;
    } else {
      url += `?text=${encodedMsg}`;
    }

    window.open(url, '_blank');
  },

  // Vista imprimible / PDF
  viewPrintModal(id) {
    const quote = DB.getQuoteById(id);
    if (!quote) return;
    const settings = DB.getSettings();

    const container = document.getElementById('printable-quote-content');
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Encabezado de la Pastelería -->
        <div class="flex justify-between items-start border-b border-gray-200 pb-5">
          <div>
            <div class="text-2xl font-black text-pink-600 flex items-center gap-2">
              <span>🍰</span> ${settings.businessName || 'Mi Pastelería'}
            </div>
            <p class="text-xs text-gray-500 mt-1">${settings.businessInstagram || ''} · ${settings.businessPhone || ''}</p>
            <p class="text-xs text-gray-500">${settings.businessEmail || ''}</p>
          </div>
          <div class="text-right">
            <span class="text-xs uppercase font-bold text-gray-400 tracking-wider">Presupuesto</span>
            <h2 class="text-xl font-black text-gray-900 font-mono">${quote.code}</h2>
            <span class="text-xs text-gray-500">Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-CL')}</span>
          </div>
        </div>

        <!-- Info Cliente -->
        <div class="grid grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-2xl border border-pink-100 text-xs">
          <div>
            <span class="text-gray-400 font-semibold uppercase text-[10px] block">Cliente:</span>
            <span class="font-bold text-gray-900 text-sm">${quote.customerName}</span>
            <p class="text-gray-600 mt-0.5">${quote.customerPhone || 'Sin teléfono'}</p>
          </div>
          <div class="text-right">
            <span class="text-gray-400 font-semibold uppercase text-[10px] block">Evento / Fecha:</span>
            <span class="font-bold text-gray-900">${quote.eventName || 'Evento especial'}</span>
            <p class="text-gray-600 mt-0.5">📅 ${quote.eventDate || 'A coordinar'}</p>
          </div>
        </div>

        <!-- Tabla de Productos -->
        <div>
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <th class="p-2.5 rounded-l-lg">Descripción del Producto</th>
                <th class="p-2.5 text-center">Cant.</th>
                <th class="p-2.5 text-right">Precio Unit.</th>
                <th class="p-2.5 text-right rounded-r-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${(quote.items || []).map(item => `
                <tr>
                  <td class="p-2.5 font-semibold text-gray-900">${item.recipeName}</td>
                  <td class="p-2.5 text-center font-medium text-gray-700">${item.quantity}</td>
                  <td class="p-2.5 text-right text-gray-700">${Calculator.formatCurrency(item.unitPrice)}</td>
                  <td class="p-2.5 text-right font-bold text-gray-900">${Calculator.formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="flex justify-end pt-2">
          <div class="w-64 space-y-2 text-xs">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span class="font-semibold text-gray-900">${Calculator.formatCurrency(quote.subtotal)}</span>
            </div>
            ${quote.discountAmount > 0 ? `
              <div class="flex justify-between text-rose-600">
                <span>Descuento (${quote.discountPercent}%):</span>
                <span class="font-semibold">-${Calculator.formatCurrency(quote.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>TOTAL:</span>
              <span class="text-pink-600">${Calculator.formatCurrency(quote.total)}</span>
            </div>
            <div class="flex justify-between text-emerald-800 font-bold bg-emerald-50 p-2 rounded-xl text-xs">
              <span>Abono para Reserva (${quote.depositPercent}%):</span>
              <span>${Calculator.formatCurrency(quote.depositAmount)}</span>
            </div>
            <div class="flex justify-between text-gray-600 text-xs px-2">
              <span>Saldo al Entregar:</span>
              <span class="font-semibold">${Calculator.formatCurrency(quote.remainingBalance)}</span>
            </div>
          </div>
        </div>

        <!-- Notas al Pie -->
        <div class="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <p class="font-semibold text-gray-700">Términos y Condiciones:</p>
          <p>${quote.notes || settings.quoteNote}</p>
          <p class="pt-2 text-center text-pink-600 font-semibold text-[11px]">¡Gracias por endulzar tus momentos especiales con nosotros!</p>
        </div>
      </div>
    `;

    document.getElementById('quote-print-modal').classList.remove('hidden');
  },

  closePrintModal() {
    const modal = document.getElementById('quote-print-modal');
    if (modal) modal.classList.add('hidden');
  }
};
