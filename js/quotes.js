// ==========================================
// Cakekulator - Módulo de Presupuestos y Cotizaciones con WhatsApp Personalizado y PDF
// ==========================================

const QuotesModule = {
  searchQuery: '',
  filterStatus: 'all',
  editingQuoteId: null,
  activeWhatsAppQuoteId: null,
  viewingPrintId: null,

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('quotes-view');
    if (!container) return;

    const isLoggedIn = typeof AuthModule !== 'undefined' && AuthModule.currentUser;
    if (!isLoggedIn) {
      container.innerHTML = this.renderLoginGate();
      return;
    }

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
      <!-- Barra Superior de Acciones y Búsqueda -->
      <div class="space-y-2.5 sm:space-y-3 mb-3 sm:mb-5">
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <input 
              type="text" 
              id="quote-search" 
              placeholder="Buscar por cliente, folio o evento..." 
              value="${this.searchQuery}"
              oninput="QuotesModule.onSearch(this.value)"
              class="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white shadow-xs text-xs sm:text-sm"
            />
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-2.5 sm:top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            ${this.searchQuery ? `
              <button onclick="QuotesModule.clearSearch()" class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            ` : ''}
          </div>
          <button onclick="QuotesModule.openEditor()" class="btn-primary shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white font-bold shadow-md shadow-pink-200 transition active:scale-95 text-xs sm:text-sm whitespace-nowrap cursor-pointer">
            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nueva Cotización
          </button>
        </div>

        <!-- Filtros de Estado -->
        <div class="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
          ${[
            { id: 'all', label: '✨ Todas (' + allQuotes.length + ')' },
            { id: 'draft', label: '📝 Borradores' },
            { id: 'sent', label: '📤 Enviadas' },
            { id: 'approved', label: '✅ Aprobadas' },
            { id: 'rejected', label: '❌ Rechazadas' }
          ].map(st => `
            <button 
              onclick="QuotesModule.filterByStatus('${st.id}')"
              class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full whitespace-nowrap transition ${this.filterStatus === st.id ? 'bg-pink-500 text-white shadow-xs font-bold' : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-100'}">
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
              <div onclick="QuotesModule.openEditor('${q.id}')" class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-pink-300 dark:hover:border-pink-500 transition overflow-hidden flex flex-col justify-between group cursor-pointer active:scale-[0.99]">
                <div class="p-4">
                  <!-- Top Bar -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-black text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded-md font-mono">${q.code || 'COT'}</span>
                        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.badgeClass}">${statusInfo.label}</span>
                      </div>
                      <h3 class="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">${q.customerName || 'Cliente sin nombre'}</h3>
                      ${q.customerPhone ? `<p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">📞 ${q.customerPhone}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="event.stopPropagation(); QuotesModule.deleteQuote('${q.id}')" title="Eliminar cotización" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Detalle Evento -->
                  <div class="bg-gray-50/80 dark:bg-slate-800/60 rounded-xl p-2.5 text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-3">
                    ${q.eventName ? `<div class="font-medium text-gray-800 dark:text-gray-200">🎉 ${q.eventName}</div>` : ''}
                    ${q.eventDate ? `<div class="text-gray-500 dark:text-gray-400">📅 Fecha: <span class="font-semibold text-gray-700 dark:text-gray-300">${q.eventDate}</span></div>` : ''}
                    <div class="text-[11px] text-gray-500 dark:text-gray-400">🛒 ${(q.items || []).length} productos en el pedido</div>
                  </div>

                  <!-- Resumen Financiero -->
                  <div class="bg-pink-50/70 dark:bg-slate-800/80 rounded-xl p-3 border border-pink-100 dark:border-slate-700 text-xs space-y-1.5">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-slate-300 font-medium">Total Cotizado:</span>
                      <span class="text-base font-black text-gray-900 dark:text-white">${Calculator.formatCurrency(total)}</span>
                    </div>
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>Abono requerido (${q.depositPercent || 50}%):</span>
                      <span class="font-bold text-emerald-800 dark:text-emerald-300">${Calculator.formatCurrency(deposit)}</span>
                    </div>
                    <div class="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                      <span>Saldo al entregar:</span>
                      <span class="font-semibold text-gray-800 dark:text-slate-200">${Calculator.formatCurrency(balance)}</span>
                    </div>
                  </div>
                </div>

                <!-- Footer Botones de Exportar -->
                <div class="p-3 bg-gray-50/80 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button onclick="event.stopPropagation(); QuotesModule.openWhatsAppModal('${q.id}')" class="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200/80 transition active:scale-95 cursor-pointer">
                    <span>💬</span> WhatsApp & Imagen
                  </button>
                  <button onclick="event.stopPropagation(); QuotesModule.viewPrintModal('${q.id}')" class="py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer">
                    <span>🖼️</span> Ver / Imagen
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
    let modal = document.getElementById('quote-editor-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quote-editor-modal';
      modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs hidden flex items-center justify-center p-2 sm:p-4 overflow-y-auto';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
          <div class="bg-gradient-to-r from-pink-500 to-rose-400 p-4 text-white flex items-center justify-between shrink-0">
            <h3 id="quote-editor-title" class="font-bold text-lg flex items-center gap-2">
              <span>📋</span> Nueva Cotización para Cliente
            </h3>
            <button onclick="QuotesModule.closeEditor()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form id="quote-form" onsubmit="QuotesModule.saveQuoteForm(event)" class="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
            <input type="hidden" id="q-id" value="">
            <input type="hidden" id="q-code" value="">

            <!-- 1. Datos del Cliente -->
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-xs">1</span>
                Datos del Cliente y Evento
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente *</label>
                  <input type="text" id="q-customer-name" required list="customers-list-datalist" oninput="QuotesModule.handleCustomerInput(this.value)" placeholder="Ej. Camila González" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                  <datalist id="customers-list-datalist"></datalist>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Teléfono / WhatsApp</label>
                  <input type="tel" id="q-customer-phone" placeholder="Ej. +56 9 8765 4321" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Motivo / Evento</label>
                  <input type="text" id="q-event-name" placeholder="Ej. Cumpleaños, Baby Shower" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Fecha del Evento</label>
                  <input type="date" id="q-event-date" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Estado</label>
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
            <div class="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
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
            <div class="bg-pink-50/70 dark:bg-slate-800/80 p-4 rounded-2xl border border-pink-100 dark:border-slate-700 space-y-3">
              <h4 class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                <span class="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                Condiciones de Pago & Totales
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Descuento (%)</label>
                  <input type="number" min="0" max="100" id="q-discount-pct" value="0" oninput="QuotesModule.recalculateTotals()" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Abono Requerido (%)</label>
                  <input type="number" min="0" max="100" id="q-deposit-pct" value="50" oninput="QuotesModule.recalculateTotals()" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Entrega</label>
                  <select id="q-delivery" class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white">
                    <option value="Retiro en taller">Retiro en taller</option>
                    <option value="Despacho a domicilio">Despacho a domicilio</option>
                  </select>
                </div>
              </div>

              <!-- Resumen Calculado en Vivo -->
              <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-pink-200 dark:border-slate-700 space-y-2 text-xs">
                <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Subtotal Pedido:</span>
                  <span id="q-live-subtotal" class="font-bold text-gray-800 dark:text-gray-100 text-sm">$ 0</span>
                </div>
                <div class="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>Descuento aplicado:</span>
                  <span id="q-live-discount" class="font-bold">-$ 0</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700 text-base font-black text-gray-900 dark:text-white">
                  <span>TOTAL COTIZACIÓN:</span>
                  <span id="q-live-total" class="text-pink-600 text-lg">$ 0</span>
                </div>
                <div class="flex justify-between items-center pt-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-slate-800 p-2 rounded-xl">
                  <span>Abono para Reserva (50%):</span>
                  <span id="q-live-deposit">$ 0</span>
                </div>
                <div class="flex justify-between items-center text-gray-600 dark:text-gray-400 text-xs px-2">
                  <span>Saldo al momento de entrega:</span>
                  <span id="q-live-balance" class="font-bold">$ 0</span>
                </div>
              </div>
            </div>

            <!-- 4. Notas y Condiciones -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas y Condiciones del Presupuesto</label>
              <textarea id="q-notes" rows="2" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 bg-white"></textarea>
            </div>

            <div class="flex gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
              <button type="button" onclick="QuotesModule.closeEditor()" class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                Cancelar
              </button>
              <button type="submit" class="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 transition">
                Guardar Presupuesto
              </button>
            </div>
          </form>
        </div>
      `;
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
  },

  ensureWhatsAppModal() {
    let modal = document.getElementById('quote-whatsapp-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quote-whatsapp-modal';
      modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs hidden flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
          <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-xs">
                📲
              </div>
              <div>
                <h3 class="font-bold text-base leading-tight">Enviar Cotización por WhatsApp</h3>
                <p class="text-xs text-emerald-100" id="wa-modal-subtitle">Mensaje resumido con imagen formal del presupuesto</p>
              </div>
            </div>
            <button onclick="QuotesModule.closeWhatsAppModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition">✕</button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            <!-- Teléfono Destino -->
            <div class="bg-emerald-50/60 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-1.5">
              <label class="block font-bold text-emerald-900 dark:text-emerald-300">Número de WhatsApp del Cliente:</label>
              <div class="flex items-center gap-2">
                <input 
                  type="tel" 
                  id="wa-recipient-phone" 
                  placeholder="Ej: +56 9 8765 4321" 
                  class="flex-1 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-slate-600 bg-white font-semibold text-gray-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <p class="text-[11px] text-emerald-700 dark:text-emerald-400">Incluye el código de país (ej. +56 para Chile) para enviar directo al chat.</p>
            </div>

            <!-- Previsualización del Mensaje Editable -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <span>💬</span> Texto Resumido del Mensaje:
                </label>
                <button onclick="QuotesModule.copyMessageToClipboard()" class="text-pink-600 dark:text-pink-400 hover:underline font-bold text-[11px] flex items-center gap-1">
                  <span>📋</span> Copiar Texto
                </button>
              </div>
              <textarea 
                id="wa-message-preview" 
                rows="8" 
                class="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-pink-400 focus:bg-white shadow-inner"
              ></textarea>
            </div>

            <!-- Estado del Archivo de Imagen PNG -->
            <div class="bg-pink-50/70 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-pink-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="text-2xl">🖼️</div>
                <div>
                  <span class="font-bold text-gray-900 dark:text-gray-100 block" id="wa-img-filename">Cotizacion.png</span>
                  <span class="text-[11px] text-pink-700 dark:text-pink-400">Imagen PNG formal con logo, desglose y abono</span>
                </div>
              </div>
              <button onclick="QuotesModule.downloadActiveQuoteImage()" class="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-pink-100 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-slate-600 font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer">
                <span>⬇️</span> Descargar PNG
              </button>
            </div>
          </div>

          <!-- Footer Botones de Envío -->
          <div class="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button 
              onclick="QuotesModule.openDirectWhatsApp()" 
              class="w-full sm:w-auto py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-gray-100 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>💬</span> Solo Mensaje WhatsApp
            </button>

            <button 
              onclick="QuotesModule.shareQuoteWithImage()" 
              class="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚀</span> Enviar por WhatsApp con Imagen
            </button>
          </div>
        </div>
      `;
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
  },

  ensurePrintModal() {
    let modal = document.getElementById('quote-print-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quote-print-modal';
      modal.className = 'fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs hidden flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar';
      modal.innerHTML = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] my-auto flex flex-col modal-animate-in border border-pink-100 dark:border-slate-800">
          <div class="bg-gray-900 p-4 text-white flex items-center justify-between shrink-0 no-print">
            <h3 class="font-bold text-base flex items-center gap-2">
              <span>🖼️</span> Vista Previa de Presupuesto
            </h3>
            <div class="flex items-center gap-2">
              <button onclick="QuotesModule.downloadActiveQuoteImage(QuotesModule.viewingPrintId)" class="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>🖼️</span> Descargar PNG
              </button>
              <button onclick="QuotesModule.downloadActiveQuotePDF(QuotesModule.viewingPrintId)" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>📄</span> Descargar PDF
              </button>
              <button onclick="window.print()" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>🖨️</span> Imprimir
              </button>
              <button onclick="QuotesModule.closePrintModal()" class="text-white/80 hover:text-white p-1 rounded-full transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div id="printable-quote-content" class="p-4 sm:p-6 overflow-y-auto bg-white text-gray-900 text-sm print-area flex-1 flex justify-center">
            <!-- Renderizado dinámico del formato formal de presupuesto -->
          </div>
        </div>
      `;
      const root = document.getElementById('modals-root') || document.body;
      root.appendChild(modal);
    }
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

  filterByStatus(status) {
    this.filterStatus = status;
    this.render();
  },

  openEditor(quoteId = null) {
    this.editingQuoteId = quoteId;
    this.ensureEditorModal();
    const modal = document.getElementById('quote-editor-modal');
    if (!modal) return;

    const form = document.getElementById('quote-form');
    const title = document.getElementById('quote-editor-title');
    const itemsTable = document.getElementById('quote-items-table');
    if (!itemsTable || !form || !title) return;

    itemsTable.innerHTML = '';
    form.reset();

    if (quoteId) {
      const quote = DB.getQuoteById(quoteId);
      if (!quote) return;

      title.innerHTML = `<span>📋</span> Editar Cotización <span class="font-mono text-pink-200">#${quote.code}</span>`;
      document.getElementById('q-id').value = quote.id;
      document.getElementById('q-code').value = quote.code;
      document.getElementById('q-customer-name').value = quote.customerName || '';
      document.getElementById('q-customer-phone').value = quote.customerPhone || '';
      document.getElementById('q-event-name').value = quote.eventName || '';
      document.getElementById('q-event-date').value = quote.eventDate || '';
      document.getElementById('q-status').value = quote.status || 'draft';
      document.getElementById('q-discount-pct').value = quote.discountPercent || 0;
      document.getElementById('q-deposit-pct').value = quote.depositPercent || 50;
      document.getElementById('q-delivery').value = quote.deliveryOption || 'Retiro en taller';
      document.getElementById('q-notes').value = quote.notes || '';

      (quote.items || []).forEach(item => {
        this.addItemRow(item.recipeId, item.quantity, item.unitPrice, item.recipeName);
      });
    } else {
      title.innerHTML = `<span>📋</span> Nueva Cotización para Cliente`;
      document.getElementById('q-id').value = '';
      document.getElementById('q-code').value = 'COT-' + (DB.getQuotes().length + 1).toString().padStart(3, '0');
      document.getElementById('q-discount-pct').value = '0';
      document.getElementById('q-deposit-pct').value = '50';
      document.getElementById('q-notes').value = DB.getSettings().quoteNote || 'Para confirmar la fecha se solicita el 50% de abono. Saldo contra entrega.';
      this.addItemRow();
    }

    // Poblar datalist de clientes
    const datalist = document.getElementById('customers-list-datalist');
    if (datalist && typeof DB.getCustomers === 'function') {
      const customers = DB.getCustomers();
      datalist.innerHTML = customers.map(c => `<option value="${c.name}">${c.phone ? `(${c.phone})` : ''}</option>`).join('');
    }

    this.recalculateTotals();
    App.openModal('quote-editor-modal');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  handleCustomerInput(nameVal) {
    if (!nameVal || typeof DB.findCustomerByPhoneOrName !== 'function') return;
    const match = DB.findCustomerByPhoneOrName(null, nameVal);
    if (match) {
      const phoneInput = document.getElementById('q-customer-phone');
      if (phoneInput && !phoneInput.value) {
        phoneInput.value = match.phone || '';
      }
    }
  },

  closeEditor() {
    App.closeModal('quote-editor-modal');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  createFromSimulator(itemData) {
    App.switchTab('quotes');
    this.openEditor();
    const itemsContainer = document.getElementById('quote-items-table');
    if (itemsContainer) itemsContainer.innerHTML = '';
    this.addItemRow(itemData.recipeId || '', itemData.quantity || 1, itemData.unitPrice || 0, itemData.recipeName || '');
    this.recalculateTotals();
    App.showToast(`Producto cargado en nuevo presupuesto 📋`);
  },

  addItemToExistingQuote(quoteId, itemData) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;

    if (!quote.items) quote.items = [];
    const qty = Number(itemData.quantity) || 1;
    const price = Number(itemData.unitPrice) || 0;
    const itemSubtotal = qty * price;

    quote.items.push({
      recipeId: itemData.recipeId || 'custom',
      recipeName: itemData.recipeName || 'Producto',
      quantity: qty,
      unitPrice: price,
      subtotal: itemSubtotal
    });

    // Recalcular montos
    const subtotal = quote.items.reduce((acc, it) => acc + (it.subtotal || it.quantity * it.unitPrice), 0);
    const discountPercent = quote.discountPercent || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = Math.max(0, subtotal - discountAmount);
    const depositPercent = quote.depositPercent || 50;
    const depositAmount = total * (depositPercent / 100);
    const remainingBalance = total - depositAmount;

    quote.subtotal = subtotal;
    quote.discountAmount = discountAmount;
    quote.total = total;
    quote.depositAmount = depositAmount;
    quote.remainingBalance = remainingBalance;

    DB.updateQuote(quoteId, quote);
    this.render();
    App.showToast(`¡Añadido a cotización ${quote.code} (${quote.customerName})! ✨`);
  },

  addItemRow(selectedRecipeId = '', qty = 1, unitPrice = '', customName = '') {
    const container = document.getElementById('quote-items-table');
    const allRecipes = DB.getRecipes();
    const rowId = 'q_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs space-y-2';

    row.innerHTML = `
      <!-- Fila 1: Selector de Producto / Receta -->
      <div class="w-full">
        <select class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-pink-400 q-item-recipe bg-white truncate" onchange="QuotesModule.onRecipeSelect('${rowId}')">
          <option value="">-- Producto Personalizado --</option>
          ${allRecipes.map(r => {
            const costs = Calculator.calculateRecipeFullCosts(r);
            const sugPrice = r.type === 'cake' ? costs.suggestedBatchPrice : costs.suggestedUnitPrice;
            return `
              <option value="${r.id}" data-price="${sugPrice}" ${r.id === selectedRecipeId ? 'selected' : ''}>
                ${r.name} (${Calculator.formatCurrency(sugPrice)})
              </option>
            `;
          }).join('')}
        </select>
        <input type="text" placeholder="Nombre personalizado del producto" value="${customName}" class="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs q-item-custom-name ${selectedRecipeId ? 'hidden' : ''}" oninput="QuotesModule.recalculateTotals()">
      </div>

      <!-- Fila 2: Cantidad, Precio Unitario, Subtotal y Borrar -->
      <div class="flex items-center gap-2 pt-0.5">
        <div class="w-20 shrink-0">
          <input type="number" step="1" min="1" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-center font-bold q-item-qty focus:ring-2 focus:ring-pink-400 bg-gray-50/60" oninput="QuotesModule.recalculateTotals()">
        </div>

        <div class="flex-1 min-w-[90px]">
          <div class="relative">
            <span class="absolute left-2.5 top-1.5 text-gray-400 text-xs">$</span>
            <input type="number" step="100" min="0" placeholder="Precio" value="${unitPrice}" class="w-full pl-5 pr-2.5 py-1.5 rounded-xl border border-gray-200 text-xs text-right font-bold text-gray-800 q-item-price focus:ring-2 focus:ring-pink-400" oninput="QuotesModule.recalculateTotals()">
          </div>
        </div>

        <div class="w-20 text-right px-1 shrink-0">
          <span class="text-xs font-black text-pink-600 q-item-subtotal truncate block">$ 0</span>
        </div>

        <button type="button" onclick="document.getElementById('${rowId}').remove(); QuotesModule.recalculateTotals();" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0" title="Eliminar ítem">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;

    container.appendChild(row);
    if (selectedRecipeId && !unitPrice) {
      this.onRecipeSelect(rowId);
    } else {
      this.recalculateTotals();
    }
  },

  onRecipeSelect(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const select = row.querySelector('.q-item-recipe');
    const customNameInput = row.querySelector('.q-item-custom-name');
    const priceInput = row.querySelector('.q-item-price');

    if (select.value) {
      customNameInput.classList.add('hidden');
      const option = select.selectedOptions[0];
      const price = option.dataset.price || 0;
      priceInput.value = price;
    } else {
      customNameInput.classList.remove('hidden');
    }

    this.recalculateTotals();
  },

  recalculateTotals() {
    let subtotal = 0;
    document.querySelectorAll('#quote-items-table > div').forEach(row => {
      const qty = parseFloat(row.querySelector('.q-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.q-item-price')?.value) || 0;
      const itemSubtotal = qty * price;
      subtotal += itemSubtotal;

      const subtotalEl = row.querySelector('.q-item-subtotal');
      if (subtotalEl) subtotalEl.textContent = Calculator.formatCurrency(itemSubtotal);
    });

    const discountPct = parseFloat(document.getElementById('q-discount-pct')?.value) || 0;
    const depositPct = parseFloat(document.getElementById('q-deposit-pct')?.value) || 50;

    const discountAmount = subtotal * (discountPct / 100);
    const total = Math.max(0, subtotal - discountAmount);
    const depositAmount = total * (depositPct / 100);
    const balance = total - depositAmount;

    const subtotalEl = document.getElementById('q-live-subtotal');
    const discountEl = document.getElementById('q-live-discount');
    const totalEl = document.getElementById('q-live-total');
    const depositEl = document.getElementById('q-live-deposit');
    const balanceEl = document.getElementById('q-live-balance');

    if (subtotalEl) subtotalEl.textContent = Calculator.formatCurrency(subtotal);
    if (discountEl) discountEl.textContent = '-' + Calculator.formatCurrency(discountAmount);
    if (totalEl) totalEl.textContent = Calculator.formatCurrency(total);
    if (depositEl) depositEl.textContent = Calculator.formatCurrency(depositAmount);
    if (balanceEl) balanceEl.textContent = Calculator.formatCurrency(balance);
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

    const items = [];
    let subtotal = 0;

    document.querySelectorAll('#quote-items-table > div').forEach(row => {
      const recipeId = row.querySelector('.q-item-recipe')?.value || null;
      const customName = row.querySelector('.q-item-custom-name')?.value?.trim();
      const qty = parseFloat(row.querySelector('.q-item-qty')?.value) || 0;
      const unitPrice = parseFloat(row.querySelector('.q-item-price')?.value) || 0;

      let recipeName = '';
      if (customName) {
        recipeName = customName;
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

    let savedQuote;
    if (id) {
      savedQuote = DB.updateQuote(id, data);
    } else {
      savedQuote = DB.addQuote(data);
    }

    // Sincronizar o registrar en CRM de Clientes automáticamente
    if (customerName && typeof DB.findCustomerByPhoneOrName === 'function') {
      let cust = DB.findCustomerByPhoneOrName(customerPhone, customerName);
      const itemsSummary = (items || []).map(it => `${it.quantity}x ${it.recipeName}`).join(', ');
      
      if (!cust && customerName.length > 2) {
        cust = DB.addCustomer({
          name: customerName,
          phone: customerPhone,
          email: '',
          address: '',
          isFavorite: false,
          notes: `Registrado desde cotización ${code || 'COT'}.`,
          specialDates: [],
          purchases: []
        });
      }

      if (cust) {
        // Si no tiene esta compra registrada, añadirla al historial del cliente
        const existingPur = (cust.purchases || []).find(p => p.quoteId === (savedQuote?.id || id));
        if (!existingPur) {
          DB.addCustomerPurchase(cust.id, {
            quoteId: savedQuote?.id || id,
            date: eventDate || new Date().toISOString().split('T')[0],
            occasion: eventName || 'Cotización ' + (code || ''),
            items: itemsSummary,
            total,
            status: status === 'approved' ? 'completed' : 'pending',
            notes: notes || ''
          });
        }
      }
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

  // ====================================================
  // Generador de Mensaje Simplificado y Cercano para WhatsApp
  // ====================================================
  buildWhatsAppMessage(quote) {
    const customerFirstName = (quote.customerName || 'Cliente').trim().split(' ')[0];
    const total = quote.total || quote.subtotal || 0;
    const depositPercent = quote.depositPercent || 50;
    const deposit = quote.depositAmount || Math.round(total * (depositPercent / 100));

    // Formatear items con espaciado limpio
    let itemsBlock = '';
    (quote.items || []).forEach(item => {
      itemsBlock += `\n${item.quantity} ${item.recipeName}: ${Calculator.formatCurrency(item.subtotal)}\n`;
      if (item.notes) {
        itemsBlock += `(${item.notes})\n`;
      }
    });

    // Formatear fecha y entrega
    let deliveryInfo = '';
    if (quote.eventDate || quote.deliveryOption) {
      let formattedDate = quote.eventDate || '';
      if (formattedDate.includes('-') && formattedDate.length === 10) {
        try {
          const [year, month, day] = formattedDate.split('-');
          const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          formattedDate = `${parseInt(day)} de ${monthNames[parseInt(month) - 1]}`;
        } catch (e) {}
      }
      
      const optionText = quote.deliveryOption ? ` (${quote.deliveryOption})` : '';
      deliveryInfo = `\n📅 Entrega: ${formattedDate}${optionText}.`;
    }

    let msg = `¡Hola ${customerFirstName}! Te paso el resumen de tu cotización:\n`;
    msg += itemsBlock;
    if (deliveryInfo) {
      msg += `${deliveryInfo}\n`;
    }
    msg += `💰 Total: ${Calculator.formatCurrency(total)} | Reserva (${depositPercent}%): ${Calculator.formatCurrency(deposit)}\n`;
    if (quote.notes) {
      msg += `\n(${quote.notes})\n`;
    }
    msg += `\nTe adjunto también la imagen con el detalle. ¡Quedo atenta/o a tu confirmación para guardar el cupo!`;

    return msg;
  },

  // Modal para Enviar WhatsApp & Imagen
  openWhatsAppModal(quoteId) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;

    this.activeWhatsAppQuoteId = quoteId;
    this.ensureWhatsAppModal();
    const modal = document.getElementById('quote-whatsapp-modal');
    if (!modal) return;

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');
    const imgFilename = document.getElementById('wa-img-filename');
    const subtitle = document.getElementById('wa-modal-subtitle');

    if (phoneInput) phoneInput.value = quote.customerPhone || '';
    if (msgPreview) msgPreview.value = this.buildWhatsAppMessage(quote);
    if (imgFilename) imgFilename.textContent = `Cotizacion_${quote.code}_${(quote.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    if (subtitle) subtitle.textContent = `Presupuesto ${quote.code} para ${quote.customerName || 'Cliente'}`;

    App.openModal('quote-whatsapp-modal');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closeWhatsAppModal() {
    App.closeModal('quote-whatsapp-modal');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  copyMessageToClipboard() {
    const msgPreview = document.getElementById('wa-message-preview');
    if (!msgPreview) return;

    navigator.clipboard.writeText(msgPreview.value).then(() => {
      App.showToast('📋 ¡Mensaje copiado al portapapeles!');
    }).catch(() => {
      msgPreview.select();
      document.execCommand('copy');
      App.showToast('📋 ¡Mensaje copiado!');
    });
  },

  formatPhoneNumberForWhatsApp(rawPhone) {
    if (!rawPhone) return '';
    let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
    // Si tiene 9 dígitos y empieza con 9 (típico móvil en Chile ej. 987654321), anteponer prefijo país 56
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      cleaned = '56' + cleaned;
    } else if (cleaned.length === 8) {
      cleaned = '569' + cleaned;
    }
    return cleaned;
  },

  openDirectWhatsApp() {
    const quote = DB.getQuoteById(this.activeWhatsAppQuoteId);
    if (!quote) return;

    // Cambiar automáticamente a estado "Enviada"
    quote.status = 'sent';
    DB.updateQuote(this.activeWhatsAppQuoteId, { status: 'sent' });
    this.render();

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');

    const rawPhone = phoneInput ? phoneInput.value : quote.customerPhone || '';
    const phone = this.formatPhoneNumberForWhatsApp(rawPhone);
    const message = msgPreview ? msgPreview.value : this.buildWhatsAppMessage(quote);
    const encodedMsg = encodeURIComponent(message);

    let url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(url, '_blank');
    this.closeWhatsAppModal();
    App.showToast(phone ? `📤 Abriendo chat de WhatsApp con +${phone}...` : '📤 Abriendo WhatsApp...');
  },

  // Generador de HTML para Imagen PNG y Documento
  getQuoteHTMLForImage(quote) {
    const settings = DB.getSettings();
    const total = quote.total || quote.subtotal || 0;
    const deposit = quote.depositAmount || (total * 0.5);
    const balance = quote.remainingBalance || (total - deposit);

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 28px; line-height: 1.45; background: #ffffff; width: 620px; box-sizing: border-box; border-radius: 20px; border: 2px solid #fce7f3;">
        
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #fbcfe8; padding-bottom: 16px; margin-bottom: 18px;">
          <tr>
            <td style="vertical-align: middle; width: 65%;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${settings.logoUrl ? `
                  <img src="${settings.logoUrl}" style="width: 52px; height: 52px; object-fit: contain; border-radius: 12px; vertical-align: middle; margin-right: 10px; border: 1px solid #fce7f3;" alt="Logo">
                ` : ''}
                <div style="display: inline-block; vertical-align: middle;">
                  <h1 style="margin: 0; color: #db2777; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                    ${!settings.logoUrl ? '🍰 ' : ''}${settings.businessName || 'Mi Pastelería'}
                  </h1>
                  <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">
                    ${settings.businessInstagram ? `📸 Instagram: <strong style="color: #db2777;">${settings.businessInstagram}</strong> · ` : ''}
                    ${settings.businessPhone ? `📱 WhatsApp: <strong>${settings.businessPhone}</strong>` : ''}
                  </p>
                  ${settings.businessEmail ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">✉️ ${settings.businessEmail}</p>` : ''}
                </div>
              </div>
            </td>
            <td style="vertical-align: middle; text-align: right; width: 35%;">
              <span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 800; letter-spacing: 1px;">PRESUPUESTO</span>
              <h2 style="margin: 2px 0 0 0; font-size: 20px; color: #0f172a; font-family: monospace; font-weight: 900;">${quote.code}</h2>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500;">Fecha: ${new Date(quote.createdAt || Date.now()).toLocaleDateString('es-CL')}</p>
            </td>
          </tr>
        </table>

        <!-- Datos del Cliente y Evento -->
        <table style="width: 100%; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 14px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <span style="font-size: 10px; font-weight: 800; color: #db2777; text-transform: uppercase;">CLIENTE:</span>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${quote.customerName}</div>
              <div style="color: #64748b; font-size: 11px; font-weight: 500;">📞 ${quote.customerPhone || 'Sin teléfono'}</div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <span style="font-size: 10px; font-weight: 800; color: #db2777; text-transform: uppercase;">EVENTO & ENTREGA:</span>
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${quote.eventName || 'Pedido Especial'}</div>
              <div style="color: #64748b; font-size: 11px;">📅 Fecha: <strong style="color: #0f172a;">${quote.eventDate || 'A coordinar'}</strong></div>
              <div style="color: #64748b; font-size: 11px;">🚚 ${quote.deliveryOption || 'Retiro en taller'}</div>
            </td>
          </tr>
        </table>

        <!-- Tabla de Productos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; color: #475569; font-weight: 800; text-align: left;">
              <th style="padding: 10px 12px; border-bottom: 2px solid #e2e8f0; border-top-left-radius: 8px;">Descripción del Producto</th>
              <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Cant.</th>
              <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Precio Unit.</th>
              <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0; border-top-right-radius: 8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(quote.items || []).map((item, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'}; border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 12px; font-weight: 700; color: #1e293b;">${item.recipeName}</td>
                <td style="padding: 9px 12px; text-align: center; font-weight: 800; color: #475569;">${item.quantity}</td>
                <td style="padding: 9px 12px; text-align: right; color: #64748b; font-weight: 600;">${Calculator.formatCurrency(item.unitPrice)}</td>
                <td style="padding: 9px 12px; text-align: right; font-weight: 800; color: #0f172a;">${Calculator.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Desglose de Totales y Abono -->
        <table style="width: 100%; margin-bottom: 16px;">
          <tr>
            <td style="width: 52%; vertical-align: top; font-size: 11px; color: #475569;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px;">
                <strong style="color: #166534; font-size: 12px; display: block; margin-bottom: 4px;">💳 Condiciones de Reserva:</strong>
                <div style="margin-bottom: 3px;">• Se solicita un <strong>abono del ${quote.depositPercent || 50}%</strong> (${Calculator.formatCurrency(deposit)}) para asegurar la fecha.</div>
                <div>• El saldo restante (${Calculator.formatCurrency(balance)}) se cancela contra entrega.</div>
              </div>
            </td>
            <td style="width: 48%; vertical-align: top; padding-left: 10px;">
              <table style="width: 100%; font-size: 12px;">
                <tr>
                  <td style="padding: 3px 8px; color: #64748b; font-weight: 600;">Subtotal:</td>
                  <td style="padding: 3px 8px; text-align: right; font-weight: 700; color: #0f172a;">${Calculator.formatCurrency(quote.subtotal)}</td>
                </tr>
                ${quote.discountAmount > 0 ? `
                  <tr>
                    <td style="padding: 3px 8px; color: #e11d48; font-weight: 600;">Descuento (${quote.discountPercent}%):</td>
                    <td style="padding: 3px 8px; text-align: right; font-weight: 700; color: #e11d48;">-${Calculator.formatCurrency(quote.discountAmount)}</td>
                  </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e2e8f0;">
                  <td style="padding: 7px 8px; font-size: 14px; font-weight: 900; color: #0f172a;">TOTAL:</td>
                  <td style="padding: 7px 8px; text-align: right; font-size: 16px; font-weight: 900; color: #db2777;">${Calculator.formatCurrency(total)}</td>
                </tr>
                <tr style="background: #ecfdf5; border-radius: 6px;">
                  <td style="padding: 5px 8px; font-weight: 700; color: #065f46;">Abono Reserva (${quote.depositPercent || 50}%):</td>
                  <td style="padding: 5px 8px; text-align: right; font-weight: 900; color: #065f46;">${Calculator.formatCurrency(deposit)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 8px; color: #64748b; font-weight: 600;">Saldo al Entregar:</td>
                  <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #0f172a;">${Calculator.formatCurrency(balance)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Notas, Redes y Términos -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b;">
          ${quote.notes || settings.quoteNote ? `
            <div style="margin-bottom: 8px;">
              <strong style="color: #334155;">Nota / Condiciones:</strong>
              <span style="color: #64748b;">${quote.notes || settings.quoteNote}</span>
            </div>
          ` : ''}
          
          <div style="margin-top: 10px; padding: 8px 12px; background: #fff5f9; border-radius: 10px; border: 1px dashed #fbcfe8; text-align: center; color: #be185d; font-weight: 700; font-size: 11px;">
            ¡Gracias por preferir nuestro trabajo artesanal hecho con amor! 💕🎂
          </div>
        </div>

      </div>
    `;
  },

  // Alias para mantener compatibilidad
  getQuoteHTMLForPDF(quote) {
    return this.getQuoteHTMLForImage(quote);
  },

  // Generador de Blob PNG mediante html2canvas
  async generateQuotePNGBlob(quote) {
    const container = document.createElement('div');
    container.id = 'quote-png-render-container';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '620px';
    container.style.maxWidth = '620px';
    container.style.zIndex = '-1000';
    container.style.background = '#ffffff';
    container.innerHTML = this.getQuoteHTMLForImage(quote);
    document.body.appendChild(container);

    try {
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        return new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (container.parentNode) document.body.removeChild(container);
            if (blob) resolve(blob);
            else reject(new Error('No se pudo generar el blob de la imagen'));
          }, 'image/png');
        });
      } else {
        if (container.parentNode) document.body.removeChild(container);
        throw new Error('html2canvas no está disponible');
      }
    } catch (err) {
      if (container.parentNode) document.body.removeChild(container);
      console.error('Error generando imagen PNG:', err);
      throw err;
    }
  },

  // Descarga directa del archivo de Imagen PNG
  async downloadActiveQuoteImage(quoteId = null) {
    const id = quoteId || this.activeWhatsAppQuoteId;
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    const filename = `Cotizacion_${quote.code}_${(quote.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    App.showToast('⏳ Generando imagen PNG de la cotización...');

    try {
      const blob = await this.generateQuotePNGBlob(quote);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      App.showToast(`🖼️ Imagen descargada: ${filename}`);
    } catch (err) {
      console.error('Error descargando imagen:', err);
      App.showToast('⚠️ No se pudo generar la imagen PNG.');
    }
  },

  // Compartir por WhatsApp con Imagen PNG Adjunta (Web Share API nativo / Portapapeles)
  async shareQuoteWithImage() {
    const quote = DB.getQuoteById(this.activeWhatsAppQuoteId);
    if (!quote) return;

    // Marcar automáticamente como enviada
    quote.status = 'sent';
    DB.updateQuote(this.activeWhatsAppQuoteId, { status: 'sent' });
    this.render();

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');
    const rawPhone = phoneInput ? phoneInput.value : quote.customerPhone || '';
    const phone = this.formatPhoneNumberForWhatsApp(rawPhone);
    const message = msgPreview ? msgPreview.value : this.buildWhatsAppMessage(quote);
    const filename = `Cotizacion_${quote.code}_${(quote.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.png`;

    App.showToast('⏳ Preparando imagen de cotización...');

    let sharedNatively = false;
    let imageBlob = null;

    try {
      imageBlob = await this.generateQuotePNGBlob(quote);
      const imageFile = new File([imageBlob], filename, { type: 'image/png' });

      // Si el navegador soporta compartir archivos directamente (móviles Android, iOS, Safari, Chrome)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: `Cotización ${quote.code} - ${quote.customerName || 'Cliente'}`,
          text: message,
          files: [imageFile]
        });
        sharedNatively = true;
        this.closeWhatsAppModal();
        App.showToast('✅ ¡Cotización e imagen enviadas a WhatsApp!');
        return;
      }
    } catch (e) {
      console.warn('WebShare cancelado o no soportado:', e);
      if (e.name === 'AbortError') return; // Usuario canceló el modal nativo
    }

    if (!sharedNatively) {
      // Flujo de alta comodidad para WhatsApp Web / Escritorio:
      // 1. Copiar imagen al portapapeles para poder pegarla con Ctrl+V
      let copiedImage = false;
      if (imageBlob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': imageBlob })
          ]);
          copiedImage = true;
        } catch (clipErr) {
          console.warn('No se pudo copiar imagen al portapapeles:', clipErr);
        }
      }

      // 2. Descargar la imagen PNG automáticamente como archivo
      if (imageBlob) {
        try {
          const url = URL.createObjectURL(imageBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
          console.warn('Descarga automática fallback:', err);
        }
      }

      // 3. Abrir WhatsApp Web con el chat directo del cliente y el mensaje precargado
      const encodedMsg = encodeURIComponent(message);
      let waUrl = phone 
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      window.open(waUrl, '_blank');
      this.closeWhatsAppModal();
      
      if (copiedImage) {
        App.showToast(phone ? `📲 Chat con +${phone} abierto. ¡Pega la imagen con Ctrl+V!` : '📲 WhatsApp abierto. ¡Pega la imagen con Ctrl+V!');
      } else {
        App.showToast(phone ? `📲 Abriendo chat con +${phone}. Imagen descargada para adjuntar.` : '📲 WhatsApp abierto. Imagen descargada.');
      }
    }
  },

  // Descarga directa del archivo PDF (mantenido como opción adicional)
  downloadActiveQuotePDF(quoteId = null) {
    const id = quoteId || this.activeWhatsAppQuoteId;
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    const element = document.createElement('div');
    element.innerHTML = this.getQuoteHTMLForPDF(quote);

    const filename = `Cotizacion_${quote.code}_${(quote.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save();
      App.showToast(`📄 Descargando ${filename}...`);
    } else {
      window.print();
    }
  },

  // Vista imprimible en pantalla
  viewPrintModal(id) {
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    this.viewingPrintId = id;
    this.ensurePrintModal();
    const container = document.getElementById('printable-quote-content');
    if (container) {
      container.innerHTML = this.getQuoteHTMLForPDF(quote);
    }

    App.openModal('quote-print-modal');
    if (typeof App !== 'undefined' && App.lockBodyScroll) App.lockBodyScroll();
  },

  closePrintModal() {
    App.closeModal('quote-print-modal');
    if (typeof App !== 'undefined' && App.unlockBodyScroll) App.unlockBodyScroll();
  },

  renderLoginGate() {
    return `
      <div class="max-w-lg mx-auto mt-12 text-center space-y-5">
        <div class="w-20 h-20 rounded-3xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center mx-auto text-4xl shadow-sm border border-pink-100 dark:border-pink-900">
          📋
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">Presupuestos y Cotizaciones</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
          Inicia sesión con tu cuenta de Google para crear presupuestos formales, compartirlos por WhatsApp con imagen adjunta y llevar el control de tus ventas.
        </p>
        <button onclick="AuthModule.showLoginRequiredModal()" class="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-2xl text-sm shadow-md transition active:scale-95 cursor-pointer inline-flex items-center gap-2">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.11a7.12 7.12 0 0 1 0-4.22V7.05H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.66-2.84.9-.44z"/><path fill="currentColor" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.84c.87-2.6 3.3-4.16 6.16-4.16z"/></svg>
          Iniciar Sesión con Google
        </button>
      </div>
    `;
  }
};

