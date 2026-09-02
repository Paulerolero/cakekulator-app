// ==========================================
// Cakekulator Cliente - Módulo de Perfil y Preferencias
// ==========================================

const UserProfileModule = {
  dietaryOptions: [
    { id: 'sin_azucar', label: 'Sin Azúcar (Diabéticos / Alulosa)', icon: '🚫' },
    { id: 'vegano', label: 'Pastelería Vegana (100% Plant-based)', icon: '🌱' },
    { id: 'sin_gluten', label: 'Celíaco / Sin Gluten', icon: '🌾' },
    { id: 'sin_lactosa', label: 'Sin Lactosa', icon: '🥛' },
    { id: 'keto', label: 'Keto / Low Carb', icon: '🥑' },
    { id: 'frutos_secos', label: 'Alergia a Frutos Secos (Nut-free)', icon: '🥜' }
  ],

  flavorOptions: [
    'Chocolate Belga 70%', 'Manjar / Dulce de Leche', 'Frambuesa Silvestre', 
    'Maracuyá', 'Limón & Merengue', 'Vainilla Francesa', 'Pistacho', 
    'Lúcuma & Nuez', 'Red Velvet & Cream Cheese', 'Nutella & Avellanas'
  ],

  init() {
    this.renderProfileView();
  },

  renderProfileView() {
    const profile = UserDB.getProfile();
    const favorites = UserDB.getFavorites();
    const bakeries = UserDB.getBakeries();

    // Rellenar campos de contacto
    const nameInput = document.getElementById('prof-name');
    const phoneInput = document.getElementById('prof-phone');
    const emailInput = document.getElementById('prof-email');
    const addressInput = document.getElementById('prof-address');
    const communeSelect = document.getElementById('prof-commune');

    if (nameInput) nameInput.value = profile.name || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (addressInput) addressInput.value = profile.address || '';
    if (communeSelect) communeSelect.value = profile.commune || 'Providencia';

    // Renderizar tags de preferencias dietarias
    const dietaryContainer = document.getElementById('prof-dietary-container');
    if (dietaryContainer) {
      dietaryContainer.innerHTML = this.dietaryOptions.map(opt => {
        const isSelected = (profile.dietaryPreferences || []).includes(opt.label) || (profile.dietaryPreferences || []).includes(opt.id);
        return `
          <button type="button" 
                  onclick="UserProfileModule.toggleDietaryPreference('${opt.label}')"
                  class="p-2.5 rounded-2xl border text-xs font-bold text-left flex items-center gap-2 transition cursor-pointer ${
                    isSelected 
                      ? 'bg-pink-50 dark:bg-slate-800 border-pink-400 text-pink-700 dark:text-pink-300 ring-2 ring-pink-400/20' 
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-pink-200'
                  }">
            <span class="text-base">${opt.icon}</span>
            <span class="truncate">${opt.label}</span>
          </button>
        `;
      }).join('');
    }

    // Renderizar tags de sabores favoritos
    const flavorsContainer = document.getElementById('prof-flavors-container');
    if (flavorsContainer) {
      flavorsContainer.innerHTML = this.flavorOptions.map(flavor => {
        const isSelected = (profile.favoriteFlavors || []).includes(flavor);
        return `
          <button type="button" 
                  onclick="UserProfileModule.toggleFavoriteFlavor('${flavor}')"
                  class="px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    isSelected 
                      ? 'bg-pink-600 text-white shadow-xs' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-slate-700'
                  }">
            ${flavor} ${isSelected ? '✓' : '+'}
          </button>
        `;
      }).join('');
    }

    // Renderizar fechas especiales
    const datesContainer = document.getElementById('prof-dates-container');
    if (datesContainer) {
      const dates = profile.specialDates || [];
      datesContainer.innerHTML = dates.map((d, index) => `
        <div class="p-3 bg-pink-50/60 dark:bg-slate-800/80 rounded-2xl border border-pink-100 dark:border-slate-700 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🎂</span>
            <div>
              <span class="font-bold text-xs text-gray-900 dark:text-white block">${d.title}</span>
              <span class="text-[10px] text-gray-500 dark:text-gray-400">📅 ${d.date} • Avisar ${d.reminderDays} días antes</span>
            </div>
          </div>
          <button type="button" onclick="UserProfileModule.removeSpecialDate(${index})" class="text-gray-400 hover:text-rose-500 text-xs p-1">
            ✕
          </button>
        </div>
      `).join('') + `
        <button type="button" onclick="UserProfileModule.showAddDatePrompt()" class="w-full py-2 border-2 border-dashed border-pink-200 dark:border-slate-700 hover:border-pink-400 rounded-2xl text-xs font-bold text-pink-600 dark:text-pink-300 flex items-center justify-center gap-1.5 transition">
          <span>+ Agregar Fecha Especial (Cumpleaños / Aniversario)</span>
        </button>
      `;
    }

    // Renderizar resumen de locales favoritos
    const favsContainer = document.getElementById('prof-favorites-container');
    if (favsContainer) {
      const favBakeries = bakeries.filter(b => favorites.includes(b.id));
      if (favBakeries.length === 0) {
        favsContainer.innerHTML = `
          <p class="text-xs text-gray-400 italic">Aún no has guardado locales favoritos. Explora el mapa y toca el ❤️ para recibir sus ofertas flash.</p>
        `;
      } else {
        favsContainer.innerHTML = favBakeries.map(b => `
          <div class="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${b.logo}</span>
              <div>
                <span class="font-bold text-xs text-gray-900 dark:text-white block">${b.name}</span>
                <span class="text-[10px] text-pink-600">${b.commune} • ⭐ ${b.rating}</span>
              </div>
            </div>
            <button type="button" onclick="UserApp.toggleFavorite('${b.id}')" class="text-rose-500 p-1.5 text-sm hover:scale-110 transition">
              ❤️
            </button>
          </div>
        `).join('');
      }
    }
  },

  toggleDietaryPreference(label) {
    const profile = UserDB.getProfile();
    if (!profile.dietaryPreferences) profile.dietaryPreferences = [];

    const idx = profile.dietaryPreferences.indexOf(label);
    if (idx > -1) {
      profile.dietaryPreferences.splice(idx, 1);
    } else {
      profile.dietaryPreferences.push(label);
    }

    UserDB.saveProfile(profile);
    this.renderProfileView();
    UserApp.showToast('Preferencias alimentarias actualizadas');
  },

  toggleFavoriteFlavor(flavor) {
    const profile = UserDB.getProfile();
    if (!profile.favoriteFlavors) profile.favoriteFlavors = [];

    const idx = profile.favoriteFlavors.indexOf(flavor);
    if (idx > -1) {
      profile.favoriteFlavors.splice(idx, 1);
    } else {
      profile.favoriteFlavors.push(flavor);
    }

    UserDB.saveProfile(profile);
    this.renderProfileView();
  },

  saveContactInfo(e) {
    if (e) e.preventDefault();
    const profile = UserDB.getProfile();

    profile.name = document.getElementById('prof-name').value.trim();
    profile.phone = document.getElementById('prof-phone').value.trim();
    profile.email = document.getElementById('prof-email').value.trim();
    profile.address = document.getElementById('prof-address').value.trim();
    profile.commune = document.getElementById('prof-commune').value;

    UserDB.saveProfile(profile);
    UserApp.showToast('✅ Perfil guardado con éxito');
  },

  showAddDatePrompt() {
    const title = prompt('¿Qué celebras? (ej. Cumpleaños de Sofía, Aniversario)');
    if (!title) return;
    const date = prompt('Fecha (AAAA-MM-DD)', '2026-10-15');
    if (!date) return;

    const profile = UserDB.getProfile();
    if (!profile.specialDates) profile.specialDates = [];
    profile.specialDates.push({ title, date, reminderDays: 5 });
    UserDB.saveProfile(profile);
    this.renderProfileView();
    UserApp.showToast('🎉 Fecha especial añadida a tus recordatorios');
  },

  removeSpecialDate(index) {
    const profile = UserDB.getProfile();
    if (profile.specialDates && profile.specialDates[index]) {
      profile.specialDates.splice(index, 1);
      UserDB.saveProfile(profile);
      this.renderProfileView();
    }
  }
};
