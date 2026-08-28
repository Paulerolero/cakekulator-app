// ==========================================
// Cakekulator - Módulo de Gestión de Clientes (CRM Pastelero & Fechas Especiales)
// ==========================================

const CustomersModule = {
  activeFilter: 'all', // 'all' | 'favorites' | 'upcoming' | 'this_month'
  searchQuery: '',
  selectedCustomerId: null,
  activeDetailTab: 'overview', // 'overview' | 'purchases' | 'dates'

  init() {
    this.checkNotificationPermission();
  },

  // ==========================================
  // Renderizado Principal de la Vista
  // ==========================================
  render() {
    const container = document.getElementById('customers-view');
    if (!container) return;

    const customers = DB.getCustomers();
    const upcomingEvents = this.getUpcomingEvents(30);
    const settings = DB.getSettings();

    // Cálculos de métricas
    const totalCustomers = customers.length;
    const favoriteCount = customers.filter(c => c.isFavorite).length;
    const upcomingCount = upcomingEvents.length;
    let totalLtvSum = 0;
    customers.forEach(c => {
      if (Array.isArray(c.purchases)) {
        c.purchases.forEach(p => { totalLtvSum += (Number(p.total) || 0); });
      }
    });

    const filteredCustomers = this.getFilteredCustomers(customers, upcomingEvents);

    container.innerHTML = `
      <!-- Encabezado de Sección con Botones de Acción -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl sm:text-3xl">👥</span>
            <h2 class="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Clientes & Fechas Especiales
            </h2>
          </div>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Fideliza a tus clientes, anticipa sus cumpleaños y envía mensajes por WhatsApp en el momento justo.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button 
            type="button" 
            onclick="CustomersModule.toggleNotificationsPrompt()"
            id="btn-customer-notif"
            class="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Activar o configurar notificaciones de recordatorio"
          >
            <span>🔔</span> <span class="hidden sm:inline">Alertas</span>
          </button>

          <button 
            type="button" 
            onclick="CustomersModule.openCustomerEditor()"
            class="flex-1 sm:flex-none px-4 py-2 bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas Rápidas (KPIs) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4 sm:mb-6">
        <!-- Total Clientes -->
        <div onclick="CustomersModule.setFilter('all')" role="button" class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-pink-100 dark:border-slate-700 shadow-2xs hover:border-pink-300 transition cursor-pointer">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Total Clientes</span>
            <div class="w-7 h-7 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center text-sm">👥</div>
          </div>
          <div class="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">${totalCustomers}</div>
        </div>

        <!-- Clientes VIP / Favoritos -->
        <div onclick="CustomersModule.setFilter('favorites')" role="button" class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-pink-100 dark:border-slate-700 shadow-2xs hover:border-amber-300 transition cursor-pointer">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Favoritos / VIP</span>
            <div class="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-sm">⭐</div>
          </div>
          <div class="text-xl sm:text-2xl font-black text-amber-500 mt-1">${favoriteCount}</div>
        </div>

        <!-- Próximas Fechas (30 días) -->
        <div onclick="CustomersModule.setFilter('upcoming')" role="button" class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-pink-100 dark:border-slate-700 shadow-2xs hover:border-rose-300 transition cursor-pointer ${upcomingCount > 0 ? 'ring-1 ring-rose-400/40' : ''}">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Próximos Eventos</span>
            <div class="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center text-sm">🎂</div>
          </div>
          <div class="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">${upcomingCount}</div>
        </div>

        <!-- Ventas Acumuladas en Clientes -->
        <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-pink-100 dark:border-slate-700 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Ventas Totales</span>
            <div class="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-sm">💰</div>
          </div>
          <div class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            ${Calculator.formatCurrency(totalLtvSum)}
          </div>
        </div>
      </div>

      <!-- Banner de Próximas Fechas Especiales & Alertas de Anticipación -->
      ${upcomingEvents.length > 0 ? `
        <div class="bg-pink-50/90 dark:bg-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-200 dark:border-slate-700 mb-4 sm:mb-6 shadow-xs">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">🎉</span>
              <h3 class="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                Próximas Fechas Especiales (Próximos 30 Días)
              </h3>
            </div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200">
              ${upcomingEvents.length} recordatorio(s)
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            ${upcomingEvents.map(evt => `
              <div class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-pink-100 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs hover:border-pink-300 transition">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-base">${this.getDateTypeIcon(evt.type)}</span>
                    <span class="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">${evt.customerName}</span>
                    ${evt.isFavorite ? '<span class="text-amber-500 text-xs shrink-0" title="Cliente VIP">⭐</span>' : ''}
                  </div>
                  <p class="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 truncate font-medium">
                    ${evt.title} (${evt.formattedDate})
                  </p>
                  <div class="mt-1">
                    ${this.renderDaysLeftBadge(evt.daysLeft)}
                  </div>
                </div>

                <div class="flex flex-col gap-1 shrink-0">
                  <button 
                    type="button"
                    onclick="CustomersModule.openWhatsAppModal('${evt.customerId}', '${evt.id}')"
                    class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    title="Enviar mensaje por WhatsApp anticipando esta fecha"
                  >
                    <span>💬</span> <span class="hidden sm:inline">WhatsApp</span>
                  </button>
                  <button 
                    type="button"
                    onclick="CustomersModule.openCustomerDetail('${evt.customerId}')"
                    class="px-2 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-semibold transition text-center"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Buscador y Filtros Rápidos -->
      <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-pink-100 dark:border-slate-700 mb-4 sm:mb-6 shadow-xs space-y-3">
        <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <!-- Input de Búsqueda -->
          <div class="relative flex-1">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input 
              type="text" 
              id="customer-search-input"
              value="${this.searchQuery}" 
              oninput="CustomersModule.handleSearch(event)" 
              placeholder="Buscar por nombre, teléfono, notas o alérgenos..." 
              class="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none transition"
            >
            ${this.searchQuery ? `
              <button 
                onclick="CustomersModule.clearSearch()" 
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-1"
              >✕</button>
            ` : ''}
          </div>

          <!-- Filtros por Píldoras -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button 
              type="button" 
              onclick="CustomersModule.setFilter('all')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${this.activeFilter === 'all' ? 'bg-pink-600 text-white shadow-2xs' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}"
            >
              Todos (${totalCustomers})
            </button>

            <button 
              type="button" 
              onclick="CustomersModule.setFilter('favorites')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${this.activeFilter === 'favorites' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}"
            >
              <span>⭐</span> Favoritos (${favoriteCount})
            </button>

            <button 
              type="button" 
              onclick="CustomersModule.setFilter('upcoming')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${this.activeFilter === 'upcoming' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}"
            >
              <span>🎂</span> Próximas Fechas (${upcomingCount})
            </button>

            <button 
              type="button" 
              onclick="CustomersModule.setFilter('this_month')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${this.activeFilter === 'this_month' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}"
            >
              <span>📅</span> Este Mes
            </button>
          </div>
        </div>
      </div>

      <!-- Cuadrícula / Listado de Clientes -->
      ${filteredCustomers.length === 0 ? `
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-pink-100 dark:border-slate-700">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center text-3xl mb-3">
            👥
          </div>
          <h3 class="text-base font-bold text-gray-800 dark:text-gray-200">No se encontraron clientes</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
            ${this.searchQuery ? 'Prueba cambiando el término de búsqueda o limpia los filtros activos.' : 'Comienza registrando a tus clientes para no olvidar nunca sus cumpleaños ni pedidos especiales.'}
          </p>
          <button 
            type="button" 
            onclick="CustomersModule.openCustomerEditor()"
            class="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
          >
            <span>+</span> Registrar Primer Cliente
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          ${filteredCustomers.map(cust => this.renderCustomerCard(cust, upcomingEvents)).join('')}
        </div>
      `}
    `;
  },

  // ==========================================
  // Renderizado de Tarjeta Individual de Cliente
  // ==========================================
  renderCustomerCard(customer, upcomingEvents = []) {
    const initials = (customer.name || 'C')
      .split(' ')
      .filter(n => n.length > 0)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');

    const specialDates = customer.specialDates || [];
    const purchases = customer.purchases || [];
    const totalSpent = purchases.reduce((acc, p) => acc + (Number(p.total) || 0), 0);

    // Buscar si este cliente tiene alguna fecha próxima
    const nextEvent = upcomingEvents.find(evt => evt.customerId === customer.id);

    return `
      <div class="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-pink-300 dark:hover:border-pink-500/50 transition-all flex flex-col justify-between group">
        <!-- Parte Superior: Avatar, Nombre, Favorito -->
        <div>
          <div class="flex items-start justify-between gap-2.5 mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black flex items-center justify-center text-sm sm:text-base shrink-0 shadow-2xs">
                ${initials}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3 
                    onclick="CustomersModule.openCustomerDetail('${customer.id}')"
                    class="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight truncate hover:text-pink-600 dark:hover:text-pink-400 cursor-pointer transition"
                  >
                    ${customer.name}
                  </h3>
                </div>
                ${customer.phone ? `
                  <a 
                    href="tel:${customer.phone}" 
                    class="text-xs text-gray-500 dark:text-gray-400 hover:text-pink-600 flex items-center gap-1 mt-0.5 truncate"
                  >
                    📞 ${customer.phone}
                  </a>
                ` : `
                  <span class="text-[11px] text-gray-400 italic">Sin teléfono</span>
                `}
              </div>
            </div>

            <!-- Botón Favorito ⭐ -->
            <button 
              type="button" 
              onclick="CustomersModule.toggleFavorite('${customer.id}')"
              class="w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 ${customer.isFavorite ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/40 hover:scale-110' : 'text-gray-300 dark:text-slate-600 hover:text-amber-400'}"
              title="${customer.isFavorite ? 'Quitar de Favoritos' : 'Marcar como Favorito / VIP'}"
            >
              <span class="text-base">${customer.isFavorite ? '⭐' : '☆'}</span>
            </button>
          </div>

          <!-- Alerta de Evento Próximo Destacado -->
          ${nextEvent ? `
            <div class="bg-rose-50/80 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 mb-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">Próxima fecha:</span>
                <span class="text-xs font-bold text-gray-900 dark:text-gray-100 truncate block">
                  ${this.getDateTypeIcon(nextEvent.type)} ${nextEvent.title}
                </span>
              </div>
              <div class="shrink-0">
                ${this.renderDaysLeftBadge(nextEvent.daysLeft)}
              </div>
            </div>
          ` : ''}

          <!-- Fechas Especiales Registradas (Badges) -->
          <div class="space-y-1.5 mb-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
              Fechas Clave (${specialDates.length})
            </div>
            ${specialDates.length === 0 ? `
              <p class="text-[11px] text-gray-400 italic">Sin fechas especiales registradas</p>
            ` : `
              <div class="flex flex-wrap gap-1">
                ${specialDates.slice(0, 2).map(sd => `
                  <span class="inline-flex items-center gap-1 text-[11px] bg-pink-50 dark:bg-slate-700/80 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-lg font-medium border border-pink-100/80 dark:border-slate-600">
                    <span>${this.getDateTypeIcon(sd.type)}</span>
                    <span class="truncate max-w-[120px]">${sd.title}</span>
                    <span class="text-[10px] text-gray-500 dark:text-gray-400">(${this.formatDayMonth(sd.day, sd.month)})</span>
                  </span>
                `).join('')}
                ${specialDates.length > 2 ? `
                  <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                    +${specialDates.length - 2} más
                  </span>
                ` : ''}
              </div>
            `}
          </div>

          <!-- Notas / Alergias rápidas -->
          ${customer.notes ? `
            <div class="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/80 mb-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              <span class="font-semibold text-gray-800 dark:text-gray-200">📝 Gustos/Alergias:</span> ${customer.notes}
            </div>
          ` : ''}
        </div>

        <!-- Parte Inferior: Métricas de compras y Botones de Acción Rápida -->
        <div class="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-3">
          <!-- Resumen de Pedidos y Total Gastado -->
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-500 dark:text-gray-400">
              🛍️ ${purchases.length} pedido(s)
            </span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">
              ${Calculator.formatCurrency(totalSpent)}
            </span>
          </div>

          <!-- Barra de Botones de Acción -->
          <div class="grid grid-cols-3 gap-1.5">
            <!-- Botón WhatsApp -->
            <button 
              type="button" 
              onclick="CustomersModule.openWhatsAppModal('${customer.id}')"
              class="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
              title="Generar mensaje personalizado de WhatsApp"
            >
              <span>💬</span> <span class="truncate">WhatsApp</span>
            </button>

            <!-- Botón Cotizar -->
            <button 
              type="button" 
              onclick="CustomersModule.createQuoteForCustomer('${customer.id}')"
              class="py-2 px-2 bg-pink-50 dark:bg-slate-700 hover:bg-pink-100 dark:hover:bg-slate-600 text-pink-700 dark:text-pink-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              title="Crear nueva cotización para este cliente"
            >
              <span>📋</span> <span class="truncate">Cotizar</span>
            </button>

            <!-- Botón Ver Perfil Completo -->
            <button 
              type="button" 
              onclick="CustomersModule.openCustomerDetail('${customer.id}')"
              class="py-2 px-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              title="Ver perfil completo, compras y fechas especiales"
            >
              <span>👁️</span> <span class="truncate">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================
  // Modal de Detalle Completo del Cliente
  // ==========================================
  openCustomerDetail(customerId, tab = 'overview') {
    const customer = DB.getCustomerById(customerId);
    if (!customer) return;

    this.selectedCustomerId = customerId;
    this.activeDetailTab = tab;

    const specialDates = customer.specialDates || [];
    const purchases = customer.purchases || [];
    const totalSpent = purchases.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const avgTicket = purchases.length > 0 ? Math.round(totalSpent / purchases.length) : 0;

    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    modalsRoot.innerHTML = `
      <div id="customer-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-pink-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Modal Header -->
          <div class="bg-pink-600 dark:bg-pink-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-2xl bg-white/20 text-white font-black flex items-center justify-center text-lg shrink-0">
                ${(customer.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-black text-base sm:text-lg leading-tight truncate">${customer.name}</h3>
                  ${customer.isFavorite ? '<span class="text-amber-300 text-sm" title="Cliente VIP">⭐</span>' : ''}
                </div>
                <p class="text-xs text-pink-100 mt-0.5 truncate">
                  ${customer.phone || 'Sin teléfono'} ${customer.email ? `• ${customer.email}` : ''}
                </p>
              </div>
            </div>

            <button 
              type="button" 
              onclick="CustomersModule.closeModal('customer-detail-modal')" 
              class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Pestañas internas del Modal -->
          <div class="flex items-center border-b border-gray-100 dark:border-slate-800 bg-pink-50/50 dark:bg-slate-800/60 px-4 pt-2 shrink-0">
            <button 
              type="button" 
              onclick="CustomersModule.switchDetailTab('overview')" 
              class="px-3.5 py-2 text-xs font-bold border-b-2 transition ${this.activeDetailTab === 'overview' ? 'border-pink-600 text-pink-600 dark:text-pink-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}"
            >
              📌 Resumen & Fechas (${specialDates.length})
            </button>
            <button 
              type="button" 
              onclick="CustomersModule.switchDetailTab('purchases')" 
              class="px-3.5 py-2 text-xs font-bold border-b-2 transition ${this.activeDetailTab === 'purchases' ? 'border-pink-600 text-pink-600 dark:text-pink-400' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}"
            >
              🛍️ Historial de Compras (${purchases.length})
            </button>
          </div>

          <!-- Modal Body Scrollable -->
          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
            
            ${this.activeDetailTab === 'overview' ? `
              <!-- DATOS DE CONTACTO Y PREFERENCIAS -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/80">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Información de Contacto</span>
                  <div class="space-y-1.5 text-xs text-gray-700 dark:text-gray-200">
                    <p class="flex items-center gap-1.5 truncate">
                      <span>📞</span> 
                      ${customer.phone ? `<a href="tel:${customer.phone}" class="hover:text-pink-600 font-medium">${customer.phone}</a>` : '<span class="italic text-gray-400">No especificado</span>'}
                    </p>
                    <p class="flex items-center gap-1.5 truncate">
                      <span>📧</span> 
                      ${customer.email ? `<a href="mailto:${customer.email}" class="hover:text-pink-600 font-medium">${customer.email}</a>` : '<span class="italic text-gray-400">No especificado</span>'}
                    </p>
                    <p class="flex items-center gap-1.5 truncate">
                      <span>📍</span> 
                      <span class="font-medium">${customer.address || '<span class="italic text-gray-400">No especificada</span>'}</span>
                    </p>
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/80">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Métricas de Consumo (LTV)</span>
                  <div class="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span class="text-[10px] text-gray-500 dark:text-gray-400 block">Total Comprado</span>
                      <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">${Calculator.formatCurrency(totalSpent)}</span>
                    </div>
                    <div>
                      <span class="text-[10px] text-gray-500 dark:text-gray-400 block">Ticket Promedio</span>
                      <span class="text-sm font-black text-gray-900 dark:text-gray-100">${Calculator.formatCurrency(avgTicket)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PREFERENCIAS, GUSTOS Y ALERGIAS -->
              <div class="bg-pink-50/60 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-pink-100 dark:border-slate-700/80">
                <span class="text-[10px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300 block mb-1">
                  📝 Preferencias, Sabores Favoritos y Alergias
                </span>
                <p class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line">
                  ${customer.notes || 'Sin observaciones registradas todavía.'}
                </p>
              </div>

              <!-- FECHAS ESPECIALES & ANIVERSARIOS -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <span>🎂</span> Fechas Especiales & Recordatorios
                  </h4>
                  <button 
                    type="button" 
                    onclick="CustomersModule.promptAddSpecialDate('${customer.id}')"
                    class="px-2.5 py-1 bg-pink-100 dark:bg-slate-800 hover:bg-pink-200 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Agregar Fecha
                  </button>
                </div>

                ${specialDates.length === 0 ? `
                  <div class="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl text-center border border-dashed border-gray-200 dark:border-slate-700 text-xs text-gray-500">
                    No has registrado fechas especiales para este cliente. Agrega su cumpleaños o aniversario para que la app te avise con anticipación.
                  </div>
                ` : `
                  <div class="space-y-2">
                    ${specialDates.map(sd => {
                      const daysLeft = this.calculateDaysUntil(sd.day, sd.month);
                      return `
                        <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-pink-100 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                          <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                              <span class="text-base">${this.getDateTypeIcon(sd.type)}</span>
                              <span class="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">${sd.title}</span>
                              <span class="text-xs text-pink-600 font-semibold">(${this.formatDayMonth(sd.day, sd.month)}${sd.year ? ` - Año ${sd.year}` : ''})</span>
                            </div>
                            ${sd.notes ? `<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">${sd.notes}</p>` : ''}
                            <div class="mt-1">
                              ${this.renderDaysLeftBadge(daysLeft)}
                              <span class="text-[10px] text-gray-400 ml-1">Avisar ${sd.advanceNoticeDays || 7} días antes</span>
                            </div>
                          </div>

                          <div class="flex items-center gap-1.5 shrink-0">
                            <button 
                              type="button" 
                              onclick="CustomersModule.openWhatsAppModal('${customer.id}', '${sd.id}')"
                              class="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition"
                              title="Enviar mensaje WhatsApp"
                            >
                              💬
                            </button>
                            <button 
                              type="button" 
                              onclick="CustomersModule.deleteSpecialDate('${customer.id}', '${sd.id}')"
                              class="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 dark:bg-slate-700 dark:hover:bg-red-950/40 rounded-xl text-xs transition"
                              title="Eliminar fecha"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            ` : `
              <!-- HISTORIAL DE COMPRAS & PEDIDOS -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <span>🛍️</span> Historial de Pedidos Realizados
                    </h4>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">Total acumulado: ${Calculator.formatCurrency(totalSpent)}</p>
                  </div>
                  <button 
                    type="button" 
                    onclick="CustomersModule.promptAddPurchase('${customer.id}')"
                    class="px-3 py-1.5 bg-pink-100 dark:bg-slate-800 hover:bg-pink-200 dark:hover:bg-slate-700 text-pink-700 dark:text-pink-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Registrar Compra
                  </button>
                </div>

                ${purchases.length === 0 ? `
                  <div class="bg-gray-50 dark:bg-slate-800/40 p-6 rounded-2xl text-center border border-dashed border-gray-200 dark:border-slate-700 text-xs text-gray-500">
                    No hay compras registradas para este cliente aún. Puedes agregar una manualmente o crearle una cotización.
                  </div>
                ` : `
                  <div class="space-y-2.5">
                    ${purchases.map(p => `
                      <div class="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-pink-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <span class="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">${p.occasion || 'Pedido de Pastelería'}</span>
                            <span class="text-[11px] text-gray-400 font-medium">📅 ${p.date || 'Sin fecha'}</span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-300 mt-1">${p.items || 'Detalle no especificado'}</p>
                          ${p.notes ? `<p class="text-[11px] text-gray-500 italic mt-0.5">Nota: ${p.notes}</p>` : ''}
                        </div>

                        <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-700">
                          <span class="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                            ${Calculator.formatCurrency(p.total)}
                          </span>
                          <button 
                            type="button" 
                            onclick="CustomersModule.deletePurchase('${customer.id}', '${p.id}')"
                            class="p-1.5 text-gray-400 hover:text-red-600 transition"
                            title="Eliminar registro de compra"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            `}

          </div>

          <!-- Modal Footer Actions -->
          <div class="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-1.5">
              <button 
                type="button" 
                onclick="CustomersModule.deleteCustomer('${customer.id}')"
                class="px-3 py-2 text-xs font-bold text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition"
              >
                Eliminar Cliente
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button" 
                onclick="CustomersModule.openCustomerEditor('${customer.id}')"
                class="px-3.5 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition"
              >
                ✏️ Editar Datos
              </button>
              <button 
                type="button" 
                onclick="CustomersModule.openWhatsAppModal('${customer.id}')"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
              >
                <span>💬</span> WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  switchDetailTab(tab) {
    this.activeDetailTab = tab;
    if (this.selectedCustomerId) {
      this.openCustomerDetail(this.selectedCustomerId, tab);
    }
  },

  // ==========================================
  // Modal de Creación / Edición de Cliente
  // ==========================================
  openCustomerEditor(customerId = null) {
    const customer = customerId ? DB.getCustomerById(customerId) : null;
    const isEdit = !!customer;

    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    modalsRoot.innerHTML = `
      <div id="customer-editor-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-pink-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <div class="bg-pink-600 dark:bg-pink-700 p-4 text-white flex items-center justify-between shrink-0">
            <h3 class="font-bold text-base flex items-center gap-2">
              <span>👥</span> ${isEdit ? 'Editar Perfil de Cliente' : 'Nuevo Cliente'}
            </h3>
            <button 
              type="button" 
              onclick="CustomersModule.closeModal('customer-editor-modal')" 
              class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>

          <form id="customer-form" onsubmit="CustomersModule.saveCustomerForm(event)" class="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
            <input type="hidden" id="cust-id" value="${customer ? customer.id : ''}">

            <!-- Nombre Completo -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
              <input 
                type="text" 
                id="cust-name" 
                required 
                value="${customer ? (customer.name || '') : ''}" 
                placeholder="Ej. Camila González" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none"
              >
            </div>

            <!-- Teléfono y Correo -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Teléfono / WhatsApp *</label>
                <input 
                  type="tel" 
                  id="cust-phone" 
                  required
                  value="${customer ? (customer.phone || '') : ''}" 
                  placeholder="Ej. +56 9 8765 4321" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                >
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  id="cust-email" 
                  value="${customer ? (customer.email || '') : ''}" 
                  placeholder="cliente@ejemplo.com" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                >
              </div>
            </div>

            <!-- Dirección / Comuna -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Dirección / Comuna de Entrega</label>
              <input 
                type="text" 
                id="cust-address" 
                value="${customer ? (customer.address || '') : ''}" 
                placeholder="Ej. Av. Providencia 1200, Depto 5B" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none"
              >
            </div>

            <!-- Cliente VIP / Favorito -->
            <div class="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
              <div>
                <span class="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  <span>⭐</span> Marcar como Cliente Favorito / VIP
                </span>
                <span class="text-[11px] text-amber-700 dark:text-amber-400 block">
                  Priorizará sus recordatorios y alertas en el inicio.
                </span>
              </div>
              <input 
                type="checkbox" 
                id="cust-is-favorite" 
                ${customer && customer.isFavorite ? 'checked' : ''} 
                class="w-5 h-5 text-amber-500 rounded focus:ring-amber-400 accent-amber-500 cursor-pointer"
              >
            </div>

            <!-- Notas, Alergias y Preferencias -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Preferencias, Sabores Favoritos y Alergias
              </label>
              <textarea 
                id="cust-notes" 
                rows="3" 
                placeholder="Ej. Le gustan las tortas de milhojas con manjar. Hija alérgica a los frutos secos." 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-pink-400 outline-none resize-none"
              >${customer ? (customer.notes || '') : ''}</textarea>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button 
                type="button" 
                onclick="CustomersModule.closeModal('customer-editor-modal')" 
                class="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                class="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                ${isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
              </button>
            </div>
          </form>

        </div>
      </div>
    `;
  },

  saveCustomerForm(e) {
    e.preventDefault();
    const id = document.getElementById('cust-id').value;
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const isFavorite = document.getElementById('cust-is-favorite').checked;
    const notes = document.getElementById('cust-notes').value.trim();

    if (!name || !phone) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Por favor completa el nombre y teléfono del cliente');
      }
      return;
    }

    if (id) {
      DB.updateCustomer(id, { name, phone, email, address, isFavorite, notes });
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('✅ Perfil de cliente actualizado');
      }
    } else {
      DB.addCustomer({
        name,
        phone,
        email,
        address,
        isFavorite,
        notes,
        specialDates: [],
        purchases: []
      });
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('🎉 ¡Nuevo cliente registrado!');
      }
    }

    this.closeModal('customer-editor-modal');
    this.render();
  },

  // ==========================================
  // Modal de Mensajes de WhatsApp Inteligentes con Plantillas
  // ==========================================
  openWhatsAppModal(customerId, specialDateId = null) {
    const customer = DB.getCustomerById(customerId);
    if (!customer) return;

    const settings = DB.getSettings();
    const specialDates = customer.specialDates || [];
    const targetDate = specialDateId ? specialDates.find(sd => sd.id === specialDateId) : specialDates[0];

    this.selectedCustomerId = customerId;

    const modalsRoot = document.getElementById('modals-root');
    if (!modalsRoot) return;

    modalsRoot.innerHTML = `
      <div id="customer-whatsapp-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
        <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-pink-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Header -->
          <div class="bg-emerald-600 p-4 text-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-xl">💬</span>
              <div>
                <h3 class="font-bold text-base leading-tight">Enviar Mensaje a ${customer.name}</h3>
                <span class="text-xs text-emerald-100">${customer.phone || 'Sin número'}</span>
              </div>
            </div>
            <button 
              type="button" 
              onclick="CustomersModule.closeModal('customer-whatsapp-modal')" 
              class="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
            
            <!-- Selector de Plantilla -->
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Selecciona una Plantilla de Mensaje:
              </label>
              <div class="grid grid-cols-2 gap-1.5">
                <button 
                  type="button" 
                  onclick="CustomersModule.applyMessageTemplate('anticipation')"
                  class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-left hover:border-emerald-500 transition text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-400"
                >
                  🎂 Anticipar Cumpleaños
                </button>
                <button 
                  type="button" 
                  onclick="CustomersModule.applyMessageTemplate('anniversary')"
                  class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-left hover:border-emerald-500 transition text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-400"
                >
                  💍 Anticipar Aniversario
                </button>
                <button 
                  type="button" 
                  onclick="CustomersModule.applyMessageTemplate('birthday_today')"
                  class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-left hover:border-emerald-500 transition text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-400"
                >
                  🎁 Saludo de Cumpleaños
                </button>
                <button 
                  type="button" 
                  onclick="CustomersModule.applyMessageTemplate('feedback')"
                  class="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-left hover:border-emerald-500 transition text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-400"
                >
                  💌 Seguimiento Post-Venta
                </button>
              </div>
            </div>

            <!-- Campo de Edición del Mensaje -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Texto del Mensaje (Editable)
                </label>
                <button 
                  type="button" 
                  onclick="CustomersModule.copyMessageToClipboard()" 
                  class="text-xs text-pink-600 dark:text-pink-400 font-bold hover:underline"
                >
                  📋 Copiar Texto
                </button>
              </div>
              <textarea 
                id="whatsapp-message-text" 
                rows="7" 
                class="w-full px-3.5 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 outline-none resize-none leading-relaxed"
              ></textarea>
            </div>

            <!-- Número de Destino -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Número de WhatsApp de Destino
              </label>
              <input 
                type="tel" 
                id="whatsapp-target-phone" 
                value="${customer.phone || ''}" 
                placeholder="+56 9 1234 5678" 
                class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
              >
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <button 
              type="button" 
              onclick="CustomersModule.closeModal('customer-whatsapp-modal')" 
              class="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cerrar
            </button>

            <button 
              type="button" 
              onclick="CustomersModule.sendWhatsAppMessage()" 
              class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>📲</span> Abrir en WhatsApp
            </button>
          </div>

        </div>
      </div>
    `;

    // Cargar plantilla inicial según si había fecha específica o general
    if (targetDate && targetDate.type === 'anniversary') {
      this.applyMessageTemplate('anniversary', targetDate);
    } else {
      this.applyMessageTemplate('anticipation', targetDate);
    }
  },

  applyMessageTemplate(templateKey, specificDate = null) {
    const customer = DB.getCustomerById(this.selectedCustomerId);
    if (!customer) return;

    const settings = DB.getSettings();
    const bizName = settings.businessName || 'Nuestra Pastelería';
    const firstName = (customer.name || 'Cliente').trim().split(' ')[0];

    const specialDates = customer.specialDates || [];
    const dateObj = specificDate || specialDates[0];

    let message = '';

    switch (templateKey) {
      case 'anticipation':
        if (dateObj) {
          const dateStr = this.formatDayMonth(dateObj.day, dateObj.month);
          message = `¡Hola ${firstName}! 👋 Te saludo de ${bizName} 🧁.\n\n` +
            `Nos estamos preparando con tiempo y vimos que se acerca ${dateObj.title} el ${dateStr} 🎉.\n\n` +
            `¿Te gustaría asegurar tu fecha para la torta personalizada o postres para la celebración? ¡Cuéntame y con gusto te preparo una propuesta especial! ✨`;
        } else {
          message = `¡Hola ${firstName}! 👋 Te saludo de ${bizName} 🧁.\n\n` +
            `Queremos acompañarte en tus próximas celebraciones especiales. ¿Tienes algún cumpleaños o evento familiar este mes para reservar tu pedido con anticipación? 🎂✨`;
        }
        break;

      case 'anniversary':
        if (dateObj) {
          const dateStr = this.formatDayMonth(dateObj.day, dateObj.month);
          message = `¡Hola ${firstName}! 👋 Desde ${bizName} esperamos que tengas una excelente semana ✨.\n\n` +
            `Vimos en nuestro calendario que se acerca su ${dateObj.title} el ${dateStr} 🥂.\n\n` +
            `Nos encantaría preparar algo muy especial y dulce para brindar en esa fecha. ¿Te gustaría ver nuestras opciones de tortas y cajas de regalo? 🎁`;
        } else {
          message = `¡Hola ${firstName}! 👋 Te saludo de ${bizName} 🥂.\n\n` +
            `¿Se acerca alguna fecha de aniversario o celebración en pareja? Tenemos opciones exclusivas de tortas y postres finos para sorprender a esa persona especial. 💕`;
        }
        break;

      case 'birthday_today':
        message = `🎂 ¡¡Muy feliz cumpleaños ${firstName}!! 🎉🎈\n\n` +
          `Todo el equipo de ${bizName} te desea un día maravilloso lleno de alegría y momentos dulces.\n\n` +
          `¡Gracias por ser parte de nuestra comunidad pastelera! Que disfrutes mucho tu día. 🎁✨`;
        break;

      case 'feedback':
        message = `¡Hola ${firstName}! 👋 Te saludo de ${bizName} 🧁.\n\n` +
          `¿Cómo estuvo tu celebración y qué tal disfrutaron la torta/postres? 🥰\n\n` +
          `Para nosotros es súper importante tu opinión para seguir mejorando con cada receta. ¡Muchas gracias por tu preferencia! ✨`;
        break;

      default:
        message = `¡Hola ${firstName}! 👋 Te saludo de ${bizName} 🧁. ¿Cómo estás?`;
    }

    const textarea = document.getElementById('whatsapp-message-text');
    if (textarea) {
      textarea.value = message;
    }
  },

  sendWhatsAppMessage() {
    const textEl = document.getElementById('whatsapp-message-text');
    const phoneEl = document.getElementById('whatsapp-target-phone');
    if (!textEl) return;

    const message = textEl.value.trim();
    const rawPhone = phoneEl ? phoneEl.value.trim() : '';

    if (!message) {
      if (typeof App !== 'undefined' && App.showToast) App.showToast('El mensaje no puede estar vacío');
      return;
    }

    // Limpiar formato de teléfono
    let phoneDigits = rawPhone.replace(/\D/g, '');
    if (phoneDigits.startsWith('9') && phoneDigits.length === 9) {
      phoneDigits = '56' + phoneDigits; // Formato chileno por defecto
    }

    const encoded = encodeURIComponent(message);
    const url = phoneDigits 
      ? `https://wa.me/${phoneDigits}?text=${encoded}` 
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🚀 Abriendo WhatsApp con el mensaje...');
    }
  },

  copyMessageToClipboard() {
    const textEl = document.getElementById('whatsapp-message-text');
    if (!textEl) return;

    navigator.clipboard.writeText(textEl.value)
      .then(() => {
        if (typeof App !== 'undefined' && App.showToast) App.showToast('📋 ¡Mensaje copiado al portapapeles!');
      })
      .catch(() => {
        textEl.select();
        document.execCommand('copy');
        if (typeof App !== 'undefined' && App.showToast) App.showToast('📋 ¡Mensaje copiado!');
      });
  },

  // ==========================================
  // Gestión de Fechas Especiales
  // ==========================================
  promptAddSpecialDate(customerId) {
    const title = prompt('Nombre o Motivo de la fecha (Ej: Cumpleaños de Sofía (Hija), Aniversario de Bodas):');
    if (!title || !title.trim()) return;

    const dateInput = prompt('Indica el Día y Mes (en formato DD/MM, ej: 15/09 para 15 de Septiembre):');
    if (!dateInput) return;

    const parts = dateInput.split(/[\/\-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
      alert('Fecha inválida. Usa formato DD/MM (ej: 15/09).');
      return;
    }

    let type = 'birthday';
    const lower = title.toLowerCase();
    if (lower.includes('aniversario') || lower.includes('boda') || lower.includes('matrimonio')) {
      type = 'anniversary';
    } else if (lower.includes('hijo') || lower.includes('hija') || lower.includes('niñ')) {
      type = 'child_birthday';
    }

    DB.addCustomerSpecialDate(customerId, {
      title: title.trim(),
      type,
      day,
      month,
      advanceNoticeDays: 7,
      notes: ''
    });

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('🎉 ¡Fecha especial agregada!');
    }

    this.openCustomerDetail(customerId, 'overview');
    this.render();
  },

  deleteSpecialDate(customerId, specialDateId) {
    if (!confirm('¿Eliminar esta fecha especial?')) return;
    DB.deleteCustomerSpecialDate(customerId, specialDateId);
    if (typeof App !== 'undefined' && App.showToast) App.showToast('Fecha eliminada');
    this.openCustomerDetail(customerId, 'overview');
    this.render();
  },

  // ==========================================
  // Gestión de Compras / Historial
  // ==========================================
  promptAddPurchase(customerId) {
    const occasion = prompt('Motivo del pedido (Ej: Cumpleaños 15 años, Bautizo, Pedido Oficina):');
    if (!occasion || !occasion.trim()) return;

    const items = prompt('Productos entregados (Ej: Torta 20p + 24 alfajores):', 'Torta personalizada');
    const totalStr = prompt('Monto Total ($):', '35000');
    const total = Number(totalStr) || 0;

    DB.addCustomerPurchase(customerId, {
      occasion: occasion.trim(),
      items: items ? items.trim() : '',
      total,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      notes: ''
    });

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('✅ Compra registrada en el perfil del cliente');
    }

    this.openCustomerDetail(customerId, 'purchases');
    this.render();
  },

  deletePurchase(customerId, purchaseId) {
    if (!confirm('¿Eliminar este registro de compra?')) return;
    DB.deleteCustomerPurchase(customerId, purchaseId);
    if (typeof App !== 'undefined' && App.showToast) App.showToast('Registro eliminado');
    this.openCustomerDetail(customerId, 'purchases');
    this.render();
  },

  createQuoteForCustomer(customerId) {
    const customer = DB.getCustomerById(customerId);
    if (!customer) return;

    if (typeof App !== 'undefined' && App.switchTab) {
      App.switchTab('quotes');
      setTimeout(() => {
        if (typeof QuotesModule !== 'undefined' && QuotesModule.openEditor) {
          QuotesModule.openEditor();
          const nameInput = document.getElementById('q-customer-name');
          const phoneInput = document.getElementById('q-customer-phone');
          if (nameInput) nameInput.value = customer.name || '';
          if (phoneInput) phoneInput.value = customer.phone || '';
        }
      }, 150);
    }
  },

  toggleFavorite(customerId) {
    const isFav = DB.toggleCustomerFavorite(customerId);
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(isFav ? '⭐ Cliente marcado como Favorito / VIP' : 'Cliente retirado de Favoritos');
    }
    this.render();
  },

  deleteCustomer(customerId) {
    const customer = DB.getCustomerById(customerId);
    if (!customer) return;

    if (confirm(`¿Estás seguro de eliminar el cliente "${customer.name}" y todo su historial?`)) {
      DB.deleteCustomer(customerId);
      this.closeModal('customer-detail-modal');
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('🗑️ Cliente eliminado');
      }
      this.render();
    }
  },

  // ==========================================
  // Filtros, Búsqueda y Próximos Eventos
  // ==========================================
  setFilter(filterName) {
    this.activeFilter = filterName;
    this.render();
  },

  handleSearch(e) {
    this.searchQuery = e.target.value;
    this.render();
    // Mantener focus en el input
    setTimeout(() => {
      const input = document.getElementById('customer-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 10);
  },

  clearSearch() {
    this.searchQuery = '';
    this.render();
  },

  getFilteredCustomers(customers, upcomingEvents) {
    const query = this.searchQuery.trim().toLowerCase();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    return customers.filter(c => {
      // Filtro de texto de búsqueda
      if (query) {
        const matchName = (c.name || '').toLowerCase().includes(query);
        const matchPhone = (c.phone || '').toLowerCase().includes(query);
        const matchEmail = (c.email || '').toLowerCase().includes(query);
        const matchNotes = (c.notes || '').toLowerCase().includes(query);
        const matchDates = (c.specialDates || []).some(sd => (sd.title || '').toLowerCase().includes(query));
        if (!matchName && !matchPhone && !matchEmail && !matchNotes && !matchDates) return false;
      }

      // Filtro por píldora activa
      if (this.activeFilter === 'favorites') {
        return !!c.isFavorite;
      }
      if (this.activeFilter === 'upcoming') {
        return upcomingEvents.some(evt => evt.customerId === c.id);
      }
      if (this.activeFilter === 'this_month') {
        return (c.specialDates || []).some(sd => Number(sd.month) === currentMonth);
      }

      return true;
    });
  },

  // Calcula todas las fechas especiales de todos los clientes en los próximos X días
  getUpcomingEvents(withinDays = 30) {
    const customers = DB.getCustomers();
    const events = [];

    customers.forEach(cust => {
      if (Array.isArray(cust.specialDates)) {
        cust.specialDates.forEach(sd => {
          const daysLeft = this.calculateDaysUntil(sd.day, sd.month);
          if (daysLeft >= 0 && daysLeft <= withinDays) {
            events.push({
              id: sd.id,
              customerId: cust.id,
              customerName: cust.name,
              customerPhone: cust.phone,
              isFavorite: cust.isFavorite,
              type: sd.type || 'birthday',
              title: sd.title,
              day: sd.day,
              month: sd.month,
              year: sd.year,
              daysLeft,
              formattedDate: this.formatDayMonth(sd.day, sd.month)
            });
          }
        });
      }
    });

    // Ordenar de más cercano a más lejano
    return events.sort((a, b) => a.daysLeft - b.daysLeft);
  },

  calculateDaysUntil(day, month) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const today = new Date(currentYear, now.getMonth(), now.getDate());

    let targetDate = new Date(currentYear, month - 1, day);
    if (targetDate < today) {
      // Ya pasó este año, calcular para el próximo
      targetDate = new Date(currentYear + 1, month - 1, day);
    }

    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  renderDaysLeftBadge(daysLeft) {
    if (daysLeft === 0) {
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">🔥 ¡HOY!</span>`;
    }
    if (daysLeft === 1) {
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">⚡ Mañana</span>`;
    }
    if (daysLeft <= 7) {
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">En ${daysLeft} días</span>`;
    }
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-slate-700 dark:text-pink-300">En ${daysLeft} días</span>`;
  },

  getDateTypeIcon(type) {
    switch (type) {
      case 'birthday': return '🎂';
      case 'child_birthday': return '👶';
      case 'anniversary': return '💍';
      case 'corporate': return '🏢';
      default: return '🎉';
    }
  },

  formatDayMonth(day, month) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mName = months[Number(month) - 1] || month;
    return `${day} ${mName}`;
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  },

  // ==========================================
  // Sistema de Notificaciones Web del Navegador
  // ==========================================
  checkNotificationPermission() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  },

  async toggleNotificationsPrompt() {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones web directas.');
      return;
    }

    if (Notification.permission === 'granted') {
      const upcoming = this.getUpcomingEvents(7);
      if (upcoming.length > 0) {
        new Notification('🎂 Recordatorio de Fechas Especiales Cakekulator', {
          body: `Tienes ${upcoming.length} evento(s) en los próximos 7 días. ¡Revisa tu lista de clientes!`,
          icon: 'assets/icons/icon-192.png'
        });
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('🔔 Notificación de prueba enviada con éxito');
        }
      } else {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('✅ Alertas activadas. No hay eventos en los próximos 7 días.');
        }
      }
    } else if (Notification.permission === 'denied') {
      alert('Las notificaciones están bloqueadas en los permisos de tu navegador. Habilítalas en el candado de la barra de direcciones.');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('🎉 ¡Notificaciones activadas con éxito!');
        }
        this.render();
      }
    }
  }
};
