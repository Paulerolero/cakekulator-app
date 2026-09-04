// ==========================================
// Cakekulator Cliente - Módulo de Solicitudes Flash (Marketplace)
// ==========================================

const UserRequestsModule = {
  init() {
    this.renderRequests();
  },

  renderRequests() {
    const container = document.getElementById('user-requests-list');
    if (!container) return;

    const requests = UserDB.getRequests();

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm space-y-3">
          <span class="text-4xl block">📢</span>
          <h3 class="font-bold text-gray-800 dark:text-gray-100 text-base">No tienes solicitudes activas</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">¿Necesitas un pastel o postre especial? Publica lo que buscas y las pastelerías de tu zona te enviarán sus propuestas.</p>
          <button onclick="UserRequestsModule.showNewRequestModal()" class="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-md hover:from-pink-700 hover:to-rose-600 transition">
            ✨ Publicar Solicitud
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const budgetFormatted = Number(req.budget || 0).toLocaleString('es-CL');
      const bidsCount = (req.bids || []).length;
      const dateAgo = new Date(req.createdAt).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100/80 dark:border-slate-800 p-4 shadow-sm space-y-3 touch-card hover:shadow-md transition">
          <!-- Encabezado de la Solicitud -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full inline-block mb-1">
                ${req.category || 'Pedido Especial'}
              </span>
              <h3 class="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                ${req.title}
              </h3>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] text-gray-400 block">Presupuesto</span>
              <span class="font-black text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                $${budgetFormatted}
              </span>
            </div>
          </div>

          <!-- Descripción y Detalles -->
          <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/70 dark:bg-slate-800/60 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/60">
            "${req.description}"
          </p>

          <!-- Metadatos (Comuna, Entrega, Fecha) -->
          <div class="grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <span>📍</span>
              <span class="truncate"><strong>Zona:</strong> ${req.commune}</span>
            </div>
            <div class="flex items-center gap-1">
              <span>⏰</span>
              <span class="truncate"><strong>Para:</strong> ${req.deadline}</span>
            </div>
          </div>

          ${req.dietaryNotes ? `
            <div class="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <span>⚠️</span>
              <span><strong>Detalle:</strong> ${req.dietaryNotes}</span>
            </div>
          ` : ''}

          <!-- Sección de Ofertas / Propuestas Recibidas de Pasteleros -->
          <div class="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <span>💬 Propuestas Recibidas</span>
                <span class="px-2 py-0.2 text-[10px] font-black rounded-full ${bidsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}">
                  ${bidsCount}
                </span>
              </span>
              <span class="text-[10px] text-gray-400">${dateAgo}</span>
            </div>

            ${bidsCount > 0 ? `
              <div class="space-y-2">
                ${req.bids.map(bid => `
                  <div class="p-3 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-base">👩‍🍳</span>
                        <div>
                          <span class="text-xs font-bold text-gray-900 dark:text-white block leading-tight">${bid.bakeryName}</span>
                          <span class="text-[9px] text-gray-400">${bid.time || 'Reciente'}</span>
                        </div>
                      </div>
                      <span class="text-xs font-black text-emerald-700 dark:text-emerald-300">
                        Oferta: $${Number(bid.offerPrice).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <p class="text-xs text-gray-700 dark:text-gray-300 italic">"${bid.message}"</p>
                    <a href="https://wa.me/${(bid.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola ' + bid.bakeryName + '! Vi tu propuesta para mi pedido en Cakekulator y me interesa.')}" 
                       target="_blank" 
                       class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 transition">
                      <span>💬</span>
                      <span>Aceptar & Contactar por WhatsApp</span>
                    </a>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Esperando que las pastelerías de tu zona revisen tu pedido...</span>
              </div>
            `}
          </div>

        </div>
      `;
    }).join('');
  },

  showNewRequestModal() {
    const profile = UserDB.getProfile();
    const modal = document.getElementById('user-request-modal');
    if (!modal) return;

    document.getElementById('req-title').value = '';
    document.getElementById('req-budget').value = '15000';
    document.getElementById('req-commune').value = profile.commune || 'Providencia';
    document.getElementById('req-deadline').value = 'Hoy antes de las 19:00';
    document.getElementById('req-description').value = '';
    document.getElementById('req-dietary').value = (profile.dietaryPreferences || []).join(', ');

    modal.classList.remove('hidden');
  },

  closeNewRequestModal() {
    const modal = document.getElementById('user-request-modal');
    if (modal) modal.classList.add('hidden');
  },

  onBusinessTypeChange(type) {
    const catSelect = document.getElementById('req-category');
    if (!catSelect) return;

    if (type === 'service') {
      catSelect.innerHTML = `
        <option value="Barbería & Cortes">Barbería & Cortes</option>
        <option value="Manicure & Pedicure">Manicure & Uñas</option>
        <option value="Masajes & Spa">Masajes & Spa</option>
        <option value="Estética Facial">Estética Facial</option>
        <option value="Pestañas & Cejas">Pestañas & Cejas</option>
        <option value="Corporales & Drenaje">Corporales & Drenaje</option>
        <option value="Depilación">Depilación</option>
      `;
      const titleInput = document.getElementById('req-title');
      if (titleInput) titleInput.placeholder = 'ej. Corte Fade degradé + perfilado de barba para hoy';
    } else {
      catSelect.innerHTML = `
        <option value="Tartas / Pies">Tartas & Pies</option>
        <option value="Tortas Personalizadas">Tortas y Pasteles</option>
        <option value="Alfajores & Bocaditos">Alfajores & Bocaditos</option>
        <option value="Galletas & Cupcakes">Galletas & Cupcakes</option>
        <option value="Saludable / Vegano">Saludable / Vegano</option>
      `;
      const titleInput = document.getElementById('req-title');
      if (titleInput) titleInput.placeholder = 'ej. Necesito un pie de limón para 10 personas';
    }
  },

  submitNewRequest(e) {
    if (e) e.preventDefault();

    const businessType = document.getElementById('req-business-type')?.value || 'product';
    const title = document.getElementById('req-title').value.trim();
    const budget = Number(document.getElementById('req-budget').value) || 0;
    const category = document.getElementById('req-category').value;
    const commune = document.getElementById('req-commune').value.trim();
    const deadline = document.getElementById('req-deadline').value.trim();
    const description = document.getElementById('req-description').value.trim();
    const dietaryNotes = document.getElementById('req-dietary').value.trim();

    if (!title || !description || budget <= 0) {
      UserApp.showToast('⚠️ Por favor completa el título, descripción y presupuesto.');
      return;
    }

    const profile = UserDB.getProfile();

    UserDB.addRequest({
      userName: profile.name || 'Cliente Cakekulator',
      userPhone: profile.phone || '+56900000000',
      businessType,
      title,
      budget,
      category,
      commune,
      deadline,
      description,
      dietaryNotes
    });

    this.closeNewRequestModal();
    this.renderRequests();
    if (typeof UserApp.triggerCelebration === 'function') {
      UserApp.triggerCelebration();
    }
    UserApp.showToast('🎉 ¡Tu solicitud fue publicada! Los locales cercanos de este rubro recibirán tu aviso.');
  },

  // Plantillas rápidas para facilitar la creación de solicitudes
  applyTemplate(templateType) {
    if (templateType === 'pie_limon') {
      document.getElementById('req-business-type').value = 'product';
      this.onBusinessTypeChange('product');
      document.getElementById('req-title').value = 'Necesito un Pie de Limón para 8-10 personas';
      document.getElementById('req-budget').value = '12000';
      document.getElementById('req-category').value = 'Tartas / Pies';
      document.getElementById('req-deadline').value = 'Hoy antes de las 18:00';
      document.getElementById('req-description').value = 'Para compartir en una once familiar hoy en la tarde. Busco que tenga buen merengue dorado.';
    } else if (templateType === 'torta_urgente') {
      document.getElementById('req-business-type').value = 'product';
      this.onBusinessTypeChange('product');
      document.getElementById('req-title').value = 'Torta de Cumpleaños para hoy (15-20 personas)';
      document.getElementById('req-budget').value = '25000';
      document.getElementById('req-category').value = 'Tortas Personalizadas';
      document.getElementById('req-deadline').value = 'Hoy antes de las 20:00';
      document.getElementById('req-description').value = 'Sabor tradicional (Tres Leches, Chocolate o Milhojas). Lista para retirar o delivery.';
    } else if (templateType === 'corte_barba') {
      document.getElementById('req-business-type').value = 'service';
      this.onBusinessTypeChange('service');
      document.getElementById('req-title').value = 'Corte Fade Degradé + Perfilado de Barba para hoy';
      document.getElementById('req-budget').value = '18000';
      document.getElementById('req-category').value = 'Barbería & Cortes';
      document.getElementById('req-deadline').value = 'Hoy después de las 18:30';
      document.getElementById('req-description').value = 'Busco barbero profesional con disponibilidad en Providencia o Ñuñoa. Corte con toalla caliente.';
    } else if (templateType === 'manicure_permanente') {
      document.getElementById('req-business-type').value = 'service';
      this.onBusinessTypeChange('service');
      document.getElementById('req-title').value = 'Esmaltado Permanente con retiro y diseño foil';
      document.getElementById('req-budget').value = '22000';
      document.getElementById('req-category').value = 'Manicure & Pedicure';
      document.getElementById('req-deadline').value = 'Viernes en la tarde';
      document.getElementById('req-description').value = 'Esmaltado en tono nude con diseño delicado en uñas naturales.';
    } else if (templateType === 'masaje_relax') {
      document.getElementById('req-business-type').value = 'service';
      this.onBusinessTypeChange('service');
      document.getElementById('req-title').value = 'Sesión de Masaje Descontracturante 60 min';
      document.getElementById('req-budget').value = '30000';
      document.getElementById('req-category').value = 'Masajes & Spa';
      document.getElementById('req-deadline').value = 'Sábado mediodía';
      document.getElementById('req-description').value = 'Para contractura en espalda alta y cuello con aceites esenciales relajantes.';
    }
  }
};
