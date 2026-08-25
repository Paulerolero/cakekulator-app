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
          <p class="text-sm text-gray-500">Crea cotizaciones profesionales, calcula abonos y envíalas directo a WhatsApp con PDF adjunto y botones de respuesta.</p>
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
                  <button onclick="QuotesModule.openWhatsAppModal('${q.id}')" class="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200 transition active:scale-95">
                    <span>💬</span> WhatsApp & PDF
                  </button>
                  <button onclick="QuotesModule.viewPrintModal('${q.id}')" class="py-2 px-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                    <span>📄</span> Ver / PDF
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

      <!-- Modal de Envío WhatsApp & PDF Personalizado -->
      <div id="quote-whatsapp-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-2 sm:p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 p-4 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-xs">
                📲
              </div>
              <div>
                <h3 class="font-bold text-base leading-tight">Enviar Cotización por WhatsApp & PDF</h3>
                <p class="text-xs text-emerald-100" id="wa-modal-subtitle">Mensaje personalizado con PDF formal adjunto</p>
              </div>
            </div>
            <button onclick="QuotesModule.closeWhatsAppModal()" class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10">✕</button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
            <!-- Teléfono Destino -->
            <div class="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 space-y-1.5">
              <label class="block font-bold text-emerald-900">Número de WhatsApp del Cliente:</label>
              <div class="flex items-center gap-2">
                <input 
                  type="tel" 
                  id="wa-recipient-phone" 
                  placeholder="Ej: +56 9 8765 4321" 
                  class="flex-1 px-3.5 py-2 rounded-xl border border-emerald-200 bg-white font-semibold text-gray-800 text-sm focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <p class="text-[11px] text-emerald-700">Incluye el código de país (ej. +56 para Chile) para enviar directo al chat.</p>
            </div>

            <!-- Previsualización del Mensaje Editable -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-gray-800 flex items-center gap-1.5">
                  <span>💬</span> Texto Personalizado del Mensaje:
                </label>
                <button onclick="QuotesModule.copyMessageToClipboard()" class="text-pink-600 hover:text-pink-700 font-bold text-[11px] flex items-center gap-1">
                  <span>📋</span> Copiar Texto
                </button>
              </div>
              <textarea 
                id="wa-message-preview" 
                rows="11" 
                class="w-full p-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-pink-400 focus:bg-white shadow-inner"
              ></textarea>
            </div>

            <!-- Estado del Archivo PDF -->
            <div class="bg-pink-50/70 p-3.5 rounded-2xl border border-pink-100 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="text-2xl">📄</div>
                <div>
                  <span class="font-bold text-gray-900 block" id="wa-pdf-filename">Cotizacion.pdf</span>
                  <span class="text-[11px] text-pink-700">Resumen en PDF con logo, desglose y términos</span>
                </div>
              </div>
              <button onclick="QuotesModule.downloadActiveQuotePDF()" class="px-3 py-1.5 bg-white hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer">
                <span>⬇️</span> Descargar PDF
              </button>
            </div>
          </div>

          <!-- Footer Botones de Envío -->
          <div class="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button 
              onclick="QuotesModule.openDirectWhatsApp()" 
              class="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>💬</span> Solo Mensaje WhatsApp
            </button>

            <button 
              onclick="QuotesModule.shareQuoteWithPDF()" 
              class="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-200 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚀</span> Enviar por WhatsApp con PDF Adjunto
            </button>
          </div>
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
              <button onclick="QuotesModule.downloadActiveQuotePDF(QuotesModule.viewingPrintId)" class="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>⬇️</span> Descargar PDF
              </button>
              <button onclick="window.print()" class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1">
                <span>🖨️</span> Imprimir
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

  filterByStatus(status) {
    this.filterStatus = status;
    this.render();
  },

  openEditor(quoteId = null) {
    this.editingQuoteId = quoteId;
    const modal = document.getElementById('quote-editor-modal');
    const form = document.getElementById('quote-form');
    const title = document.getElementById('quote-editor-title');
    const itemsTable = document.getElementById('quote-items-table');

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

    this.recalculateTotals();
    modal.classList.remove('hidden');
  },

  closeEditor() {
    const modal = document.getElementById('quote-editor-modal');
    if (modal) modal.classList.add('hidden');
  },

  addItemRow(selectedRecipeId = '', qty = 1, unitPrice = '', customName = '') {
    const container = document.getElementById('quote-items-table');
    const allRecipes = DB.getRecipes();
    const rowId = 'q_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs';

    row.innerHTML = `
      <div class="col-span-5">
        <select class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:ring-1 focus:ring-pink-400 q-item-recipe bg-white" onchange="QuotesModule.onRecipeSelect('${rowId}')">
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
        <input type="text" placeholder="Nombre personalizado" value="${customName}" class="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-[11px] q-item-custom-name ${selectedRecipeId ? 'hidden' : ''}" oninput="QuotesModule.recalculateTotals()">
      </div>

      <div class="col-span-2">
        <input type="number" step="1" min="1" placeholder="Cant." value="${qty}" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-center font-bold q-item-qty focus:ring-1 focus:ring-pink-400" oninput="QuotesModule.recalculateTotals()">
      </div>

      <div class="col-span-3">
        <div class="relative">
          <span class="absolute left-2 top-1.5 text-gray-400 text-xs">$</span>
          <input type="number" step="100" min="0" placeholder="Precio" value="${unitPrice}" class="w-full pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs text-right font-bold text-gray-800 q-item-price focus:ring-1 focus:ring-pink-400" oninput="QuotesModule.recalculateTotals()">
        </div>
      </div>

      <div class="col-span-2 flex items-center justify-between pl-1">
        <span class="text-[11px] font-black text-pink-600 q-item-subtotal truncate">$ 0</span>
        <button type="button" onclick="document.getElementById('${rowId}').remove(); QuotesModule.recalculateTotals();" class="text-gray-300 hover:text-red-500 p-1">
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

  // ====================================================
  // Generador de Mensaje Personalizado para WhatsApp
  // ====================================================
  buildWhatsAppMessage(quote) {
    const settings = DB.getSettings();
    const customerFirstName = (quote.customerName || 'Cliente').trim().split(' ')[0];
    const businessName = settings.businessName || 'Mi Pastelería';

    let itemsText = '';
    (quote.items || []).forEach(item => {
      itemsText += `  🧁 *${item.quantity}x* ${item.recipeName} (${Calculator.formatCurrency(item.unitPrice)} c/u) ➔ *${Calculator.formatCurrency(item.subtotal)}*\n`;
    });

    let msg = `✨ *COTIZACIÓN FORMAL - ${businessName.toUpperCase()}* ✨\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👋 ¡Hola *${customerFirstName}*! Qué gusto saludarte.\n\n`;
    msg += `Te comparto el detalle de tu presupuesto personalizado${quote.eventName ? ` para *${quote.eventName}*` : ''}:\n\n`;
    msg += `📄 *Folio:* \`${quote.code}\`\n`;
    msg += `👤 *Cliente:* ${quote.customerName}\n`;
    if (quote.eventDate) msg += `📅 *Fecha de Entrega:* ${quote.eventDate}\n`;
    if (quote.deliveryOption) msg += `🚚 *Modalidad:* ${quote.deliveryOption}\n`;
    msg += `\n🛒 *DETALLE DE TU PEDIDO:*\n${itemsText}`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Subtotal:* ${Calculator.formatCurrency(quote.subtotal)}\n`;
    if (quote.discountAmount > 0) {
      msg += `🏷️ *Descuento Especial (${quote.discountPercent}%):* -${Calculator.formatCurrency(quote.discountAmount)}\n`;
    }
    msg += `🌟 *TOTAL A PAGAR:* *${Calculator.formatCurrency(quote.total)}*\n\n`;
    msg += `💳 *CONDICIONES DE RESERVA:*\n`;
    msg += `• *Abono de Reserva (${quote.depositPercent}%):* *${Calculator.formatCurrency(quote.depositAmount)}*\n`;
    msg += `• *Saldo Restante contra Entrega:* *${Calculator.formatCurrency(quote.remainingBalance)}*\n`;
    if (quote.notes) {
      msg += `\n📝 *Condiciones y Notas:* ${quote.notes}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📎 *Te adjunto el presupuesto formal en PDF con el desglose completo y datos de transferencia.* 📄\n\n`;
    msg += `Quedo muy atenta/o a tus consultas para agendar tu fecha. ¡Gracias por confiar en nuestro trabajo artesanal! 💕🎂`;

    return msg;
  },

  // Modal para Enviar WhatsApp & PDF
  openWhatsAppModal(quoteId) {
    const quote = DB.getQuoteById(quoteId);
    if (!quote) return;

    this.activeWhatsAppQuoteId = quoteId;
    const modal = document.getElementById('quote-whatsapp-modal');
    if (!modal) return;

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');
    const pdfFilename = document.getElementById('wa-pdf-filename');
    const subtitle = document.getElementById('wa-modal-subtitle');

    if (phoneInput) phoneInput.value = quote.customerPhone || '';
    if (msgPreview) msgPreview.value = this.buildWhatsAppMessage(quote);
    if (pdfFilename) pdfFilename.textContent = `Cotizacion_${quote.code}_${quote.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    if (subtitle) subtitle.textContent = `Presupuesto ${quote.code} para ${quote.customerName}`;

    modal.classList.remove('hidden');
  },

  closeWhatsAppModal() {
    const modal = document.getElementById('quote-whatsapp-modal');
    if (modal) modal.classList.add('hidden');
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

  openDirectWhatsApp() {
    const quote = DB.getQuoteById(this.activeWhatsAppQuoteId);
    if (!quote) return;

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');

    const phone = (phoneInput ? phoneInput.value : quote.customerPhone || '').replace(/[^0-9]/g, '');
    const message = msgPreview ? msgPreview.value : this.buildWhatsAppMessage(quote);
    const encodedMsg = encodeURIComponent(message);

    let url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(url, '_blank');
    this.closeWhatsAppModal();
  },

  // Generador de HTML para PDF de alta fidelidad
  getQuoteHTMLForPDF(quote) {
    const settings = DB.getSettings();
    const total = quote.total || quote.subtotal || 0;
    const deposit = quote.depositAmount || (total * 0.5);
    const balance = quote.remainingBalance || (total - deposit);

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #333; padding: 25px; line-height: 1.5; background: #ffffff; width: 100%; box-sizing: border-box;">
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #fbcfe8; padding-bottom: 15px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: middle; width: 65%;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${settings.logoUrl ? `
                  <img src="${settings.logoUrl}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px; vertical-align: middle; margin-right: 10px;" alt="Logo">
                ` : ''}
                <div style="display: inline-block; vertical-align: middle;">
                  <h1 style="margin: 0; color: #db2777; font-size: 22px; font-weight: 800;">
                    ${!settings.logoUrl ? '🍰 ' : ''}${settings.businessName || 'Mi Pastelería'}
                  </h1>
                  <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">
                    ${settings.businessInstagram ? `Instagram: ${settings.businessInstagram} · ` : ''}
                    ${settings.businessPhone ? `Tel: ${settings.businessPhone}` : ''}
                  </p>
                  ${settings.businessEmail ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">${settings.businessEmail}</p>` : ''}
                </div>
              </div>
            </td>
            <td style="vertical-align: middle; text-align: right; width: 35%;">
              <span style="font-size: 10px; text-transform: uppercase; color: #999; font-weight: 700; letter-spacing: 1px;">PRESUPUESTO FORMAL</span>
              <h2 style="margin: 2px 0 0 0; font-size: 20px; color: #111; font-family: monospace; font-weight: 800;">${quote.code}</h2>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">Fecha: ${new Date(quote.createdAt || Date.now()).toLocaleDateString('es-CL')}</p>
            </td>
          </tr>
        </table>

        <!-- Datos del Cliente y Evento -->
        <table style="width: 100%; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 12px; margin-bottom: 20px; font-size: 12px;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <span style="font-size: 10px; font-weight: bold; color: #db2777; text-transform: uppercase;">CLIENTE:</span>
              <div style="font-size: 14px; font-weight: bold; color: #111; margin-top: 2px;">${quote.customerName}</div>
              <div style="color: #666; font-size: 11px;">📞 ${quote.customerPhone || 'Sin teléfono'}</div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <span style="font-size: 10px; font-weight: bold; color: #db2777; text-transform: uppercase;">EVENTO & ENTREGA:</span>
              <div style="font-size: 13px; font-weight: bold; color: #111; margin-top: 2px;">${quote.eventName || 'Pedido Especial'}</div>
              <div style="color: #666; font-size: 11px;">📅 Fecha: <strong>${quote.eventDate || 'A coordinar'}</strong></div>
              <div style="color: #666; font-size: 11px;">🚚 ${quote.deliveryOption || 'Retiro en taller'}</div>
            </td>
          </tr>
        </table>

        <!-- Tabla de Productos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background: #f3f4f6; color: #374151; font-weight: bold; text-align: left;">
              <th style="padding: 10px 12px; border-bottom: 2px solid #e5e7eb;">Descripción del Producto</th>
              <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Cant.</th>
              <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Precio Unit.</th>
              <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(quote.items || []).map((item, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'}; border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 12px; font-weight: 600; color: #1f2937;">${item.recipeName}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: bold; color: #4b5563;">${item.quantity}</td>
                <td style="padding: 10px 12px; text-align: right; color: #4b5563;">${Calculator.formatCurrency(item.unitPrice)}</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #111;">${Calculator.formatCurrency(item.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Desglose de Totales y Abono -->
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; vertical-align: top; font-size: 11px; color: #666;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px;">
                <strong style="color: #166534; font-size: 12px; display: block; margin-bottom: 4px;">💳 Condiciones de Reserva:</strong>
                <div style="margin-bottom: 2px;">• Para agendar y reservar tu fecha se requiere un <strong>abono del ${quote.depositPercent || 50}%</strong> (${Calculator.formatCurrency(deposit)}).</div>
                <div>• El saldo restante (${Calculator.formatCurrency(balance)}) se cancela al momento de la entrega.</div>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <table style="width: 100%; font-size: 12px;">
                <tr>
                  <td style="padding: 4px 10px; color: #666;">Subtotal:</td>
                  <td style="padding: 4px 10px; text-align: right; font-weight: bold; color: #111;">${Calculator.formatCurrency(quote.subtotal)}</td>
                </tr>
                ${quote.discountAmount > 0 ? `
                  <tr>
                    <td style="padding: 4px 10px; color: #e11d48;">Descuento (${quote.discountPercent}%):</td>
                    <td style="padding: 4px 10px; text-align: right; font-weight: bold; color: #e11d48;">-${Calculator.formatCurrency(quote.discountAmount)}</td>
                  </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 8px 10px; font-size: 15px; font-weight: 800; color: #111;">TOTAL:</td>
                  <td style="padding: 8px 10px; text-align: right; font-size: 16px; font-weight: 800; color: #db2777;">${Calculator.formatCurrency(total)}</td>
                </tr>
                <tr style="background: #ecfdf5; border-radius: 8px;">
                  <td style="padding: 6px 10px; font-weight: bold; color: #065f46;">Abono Reserva (${quote.depositPercent || 50}%):</td>
                  <td style="padding: 6px 10px; text-align: right; font-weight: 800; color: #065f46;">${Calculator.formatCurrency(deposit)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; color: #666;">Saldo al Entregar:</td>
                  <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: #111;">${Calculator.formatCurrency(balance)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Notas y Términos -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #666;">
          <strong style="color: #374151;">Términos & Condiciones:</strong>
          <p style="margin: 4px 0;">${quote.notes || settings.quoteNote || 'Los pedidos se confirman con comprobante de transferencia bancaria. Cambios sujetos a disponibilidad.'}</p>
          <p style="text-align: center; color: #db2777; font-weight: bold; margin-top: 15px; font-size: 12px;">
            ¡Gracias por preferir nuestro trabajo hecho con amor y dedicación! 💕🎂
          </p>
        </div>
      </div>
    `;
  },

  // Descarga directa del archivo PDF
  downloadActiveQuotePDF(quoteId = null) {
    const id = quoteId || this.activeWhatsAppQuoteId;
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    const element = document.createElement('div');
    element.innerHTML = this.getQuoteHTMLForPDF(quote);

    const filename = `Cotizacion_${quote.code}_${quote.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

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

  // Compartir por WhatsApp con PDF Adjunto
  async shareQuoteWithPDF() {
    const quote = DB.getQuoteById(this.activeWhatsAppQuoteId);
    if (!quote) return;

    const phoneInput = document.getElementById('wa-recipient-phone');
    const msgPreview = document.getElementById('wa-message-preview');
    const phone = (phoneInput ? phoneInput.value : quote.customerPhone || '').replace(/[^0-9]/g, '');
    const message = msgPreview ? msgPreview.value : this.buildWhatsAppMessage(quote);
    const filename = `Cotizacion_${quote.code}_${quote.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const element = document.createElement('div');
    element.innerHTML = this.getQuoteHTMLForPDF(quote);

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    App.showToast('⏳ Preparando documento PDF para WhatsApp...');

    try {
      if (typeof html2pdf !== 'undefined') {
        // Generar Blob del PDF
        const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

        // Intentar compartir de forma nativa con PDF adjunto (Móviles Android / iOS / Navegadores modernos)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            title: `Cotización ${quote.code} - ${quote.customerName}`,
            text: message,
            files: [pdfFile]
          });
          this.closeWhatsAppModal();
          App.showToast('✅ ¡Cotización y PDF compartidos con éxito!');
          return;
        }
      }
    } catch (e) {
      console.warn('WebShare con archivos no soportado o cancelado por usuario:', e);
    }

    // Flujo universal alternativo (Desktop / Navegadores sin WebShare de archivos):
    // 1. Descargar el archivo PDF automáticamente al dispositivo
    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save();
    }

    // 2. Copiar el texto completo del mensaje al portapapeles
    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {}

    // 3. Abrir WhatsApp directamente con el chat del cliente y el mensaje precargado
    const encodedMsg = encodeURIComponent(message);
    let waUrl = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
    this.closeWhatsAppModal();
    App.showToast('📲 WhatsApp abierto con mensaje listo y PDF descargado para adjuntar.');
  },

  // Vista imprimible en pantalla
  viewPrintModal(id) {
    const quote = DB.getQuoteById(id);
    if (!quote) return;

    this.viewingPrintId = id;
    const container = document.getElementById('printable-quote-content');
    container.innerHTML = this.getQuoteHTMLForPDF(quote);

    document.getElementById('quote-print-modal').classList.remove('hidden');
  },

  closePrintModal() {
    const modal = document.getElementById('quote-print-modal');
    if (modal) modal.classList.add('hidden');
  }
};
