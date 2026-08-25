// ==========================================
// Cakekulator - Rastreador de Ofertas y Compras (Boletas/Facturas)
// ==========================================

const ReceiptsModule = {
  imageUrl: '',
  ocrText: '',
  items: [],
  progress: '',

  render() {
    const container = document.getElementById('receipts-view');
    if (!container) return;
    container.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🧾</span> Rastreador de Ofertas & Compras
          </h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Captura fotos de boletas, facturas u ofertas de supermercado para actualizar tus insumos al instante.</p>
        </div>
        <button onclick="ReceiptsModule.reset()" class="self-start sm:self-auto px-4 py-2 rounded-2xl border border-pink-200 text-pink-700 font-bold text-xs hover:bg-pink-50 transition active:scale-95 shadow-xs">
          🔄 Nueva Boleta / Oferta
        </button>
      </div>

      <!-- Layout Principal Responsive -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <!-- Columna 1: Captura y OCR -->
        <div class="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-pink-100 shadow-sm space-y-4">
          <div>
            <h3 class="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <span>📸</span> 1. Captura el Documento u Oferta
            </h3>
            <p class="text-xs text-gray-500 mt-1">Toma una foto nítida de la boleta o folleto con precios visibles.</p>
          </div>

          <!-- Zona de Subida / Foto Inline -->
          <label class="block border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50 rounded-3xl p-6 text-center cursor-pointer transition active:scale-98">
            <input type="file" accept="image/*" capture="environment" onchange="ReceiptsModule.processFile(event)" class="hidden">
            <span class="text-4xl block mb-2">📷</span>
            <span class="text-sm font-bold text-pink-700 block">Tomar foto o elegir imagen</span>
            <span class="text-[11px] text-gray-400 block mt-1">Cámara del móvil, JPG, PNG o WEBP</span>
          </label>

          ${this.imageUrl ? `
            <div class="rounded-2xl overflow-hidden border border-pink-100 bg-gray-50 max-h-64 flex items-center justify-center">
              <img src="${this.imageUrl}" alt="Vista previa de la boleta" class="max-h-64 w-auto object-contain">
            </div>
          ` : ''}

          <div id="receipt-progress" class="text-xs font-semibold text-pink-700 min-h-5">${this.progress}</div>

          <!-- Texto Detectado Editable -->
          <div class="space-y-1.5 pt-2 border-t border-gray-100">
            <label class="block text-xs font-bold text-gray-700">Texto detectado por OCR (editable)</label>
            <textarea id="receipt-raw-text" rows="5" oninput="ReceiptsModule.updateRawText(this.value)" placeholder="Pega aquí el texto de la boleta si prefieres escribirlo o editarlo..." class="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-xs font-mono bg-white">${this.escape(this.ocrText)}</textarea>
            <button onclick="ReceiptsModule.parseText()" class="w-full py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs transition">
              🔍 Detectar precios y líneas desde el texto
            </button>
          </div>
        </div>

        <!-- Columna 2: Líneas Detectadas y Actualización -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-pink-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 class="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <span>🛒</span> 2. Líneas Detectadas & Catálogo
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">Asigna cada precio a un insumo existente o agrégalo como nuevo.</p>
            </div>
            <span class="text-[11px] font-bold bg-pink-50 text-pink-700 px-3 py-1 rounded-full shrink-0">
              ${this.items.length} ${this.items.length === 1 ? 'línea' : 'líneas'}
            </span>
          </div>

          <!-- Lista de Items -->
          <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            ${this.items.length ? this.items.map((item, index) => this.renderItem(item, index)).join('') : `
              <div class="rounded-3xl bg-pink-50/40 border border-pink-100/60 p-8 text-center text-xs text-gray-500 space-y-2">
                <div class="text-3xl">🧾</div>
                <p class="font-semibold text-gray-700">Aún no hay productos detectados</p>
                <p>Toma una foto de tu boleta a la izquierda para extraer automáticamente los insumos y precios de compra.</p>
              </div>
            `}
          </div>

          ${this.items.length ? `
            <div class="pt-3 border-t border-gray-100">
              <button onclick="ReceiptsModule.applyItems()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-lg shadow-pink-200 transition active:scale-95 text-sm flex items-center justify-center gap-2">
                <span>💾</span> Actualizar Catálogo de Insumos (${this.items.length})
              </button>
            </div>
          ` : ''}
        </div>
      </div>`;
  },

  renderItem(item, index) {
    const ingredients = DB.getIngredients();
    return `
      <div class="border border-gray-200 bg-gray-50/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5 transition hover:border-pink-200">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-black tracking-wider text-pink-700 bg-pink-100/70 px-2 py-0.5 rounded-md">LÍNEA ${index + 1}</span>
          <button onclick="ReceiptsModule.removeItem(${index})" class="text-xs text-red-500 hover:text-red-700 font-bold hover:underline">
            ✕ Quitar
          </button>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Nombre del Insumo</label>
          <input value="${this.escape(item.name)}" oninput="ReceiptsModule.setItem(${index}, 'name', this.value)" placeholder="Ej. Harina, Mantequilla, Azúcar..." class="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 text-xs font-semibold bg-white">
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Cantidad</label>
            <input type="number" min="0.01" step="any" value="${item.packageQty || 1}" oninput="ReceiptsModule.setItem(${index}, 'packageQty', this.value)" class="w-full px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 text-xs font-semibold bg-white text-center" title="Cantidad">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Unidad</label>
            <select onchange="ReceiptsModule.setItem(${index}, 'packageUnit', this.value)" class="w-full px-2 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 text-xs font-semibold bg-white">
              ${['g', 'kg', 'ml', 'l', 'u'].map(unit => `<option value="${unit}" ${item.packageUnit === unit ? 'selected' : ''}>${unit}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Precio ($)</label>
            <input type="number" min="0" step="any" value="${item.packagePrice || 0}" oninput="ReceiptsModule.setItem(${index}, 'packagePrice', this.value)" class="w-full px-2.5 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 text-xs font-bold text-pink-600 bg-white text-right" title="Precio">
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-600 mb-0.5">Vincular con Insumo de tu Base de Datos</label>
          <select onchange="ReceiptsModule.setItem(${index}, 'matchedId', this.value)" class="w-full px-3 py-2 rounded-xl border ${item.matchedId ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold' : 'border-amber-200 bg-amber-50 text-amber-900 font-semibold'} text-xs">
            <option value="">+ Crear como nuevo insumo</option>
            ${ingredients.map(ing => `<option value="${ing.id}" ${item.matchedId === ing.id ? 'selected' : ''}>Actualizar: ${this.escape(ing.name)} (${ing.packageQty}${ing.packageUnit} - $${ing.packagePrice})</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  },

  async processFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.imageUrl = URL.createObjectURL(file);
    this.progress = 'Preparando OCR...';
    this.render();
    if (!window.Tesseract) { this.progress = 'OCR no disponible sin conexión. Puedes pegar el texto manualmente.'; this.render(); return; }
    try {
      const result = await Tesseract.recognize(file, 'spa', { logger: data => { if (data.status === 'recognizing text') this.progress = `Analizando documento: ${Math.round(data.progress * 100)}%`; else this.progress = data.status; const progress = document.getElementById('receipt-progress'); if (progress) progress.textContent = this.progress; } });
      this.ocrText = result.data.text;
      this.progress = 'Texto detectado. Revisa las líneas antes de aplicar.';
      this.parseText();
    } catch (error) { console.error('Error en OCR:', error); this.progress = 'No se pudo leer la imagen. Pega el texto manualmente y vuelve a intentarlo.'; this.render(); }
  },

  updateRawText(text) { this.ocrText = text; },
  parseText() { const text = document.getElementById('receipt-raw-text')?.value || this.ocrText; this.ocrText = text; const existing = DB.getIngredients(); this.items = text.split('\n').map(line => line.trim()).filter(line => line.length > 2).map(line => this.parseLine(line, existing)).filter(Boolean); this.render(); },
  parseLine(line, existing) {
    const priceMatch = line.match(/(?:\$\s*)?(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2}))\s*$/);
    if (!priceMatch) return null;
    const price = this.toNumber(priceMatch[1]);
    let name = line.slice(0, priceMatch.index).replace(/[|*_]/g, ' ').trim();
    const packageMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo|g|gr|ml|l|litro|un|unidad|u)\b/i);
    const packageQty = packageMatch ? this.toNumber(packageMatch[1]) : 1;
    const packageUnit = packageMatch ? this.normalizeUnit(packageMatch[2]) : 'u';
    if (packageMatch) name = name.replace(packageMatch[0], '').trim();
    if (!name || price <= 0) return null;
    const match = existing.find(ingredient => this.normalize(ingredient.name).includes(this.normalize(name)) || this.normalize(name).includes(this.normalize(ingredient.name)));
    return { name, packageQty, packageUnit, packagePrice: price, matchedId: match?.id || '' };
  },
  setItem(index, field, value) { if (this.items[index]) this.items[index][field] = field === 'name' || field === 'matchedId' ? value : this.toNumber(value); },
  removeItem(index) { this.items.splice(index, 1); this.render(); },
  applyItems() {
    const validItems = this.items.filter(item => item.name.trim() && item.packageQty > 0 && item.packagePrice >= 0);
    if (!validItems.length) return App.showToast('Completa al menos una línea válida');
    validItems.forEach(item => { const data = { name: item.name.trim(), packageQty: item.packageQty, packageUnit: item.packageUnit, packagePrice: item.packagePrice }; if (item.matchedId) DB.updateIngredient(item.matchedId, data); else DB.addIngredient({ ...data, category: 'Otros', yieldWastePercent: 0 }); });
    App.showToast(`${validItems.length} insumo(s) actualizado(s) o agregado(s)`);
    this.reset();
  },
  reset() { this.imageUrl = ''; this.ocrText = ''; this.items = []; this.progress = ''; this.render(); },
  toNumber(value) { return Number(String(value).replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')) || 0; },
  normalizeUnit(unit) { return ({ kilo: 'kg', gr: 'g', litro: 'l', un: 'u', unidad: 'u' })[unit.toLowerCase()] || unit.toLowerCase(); },
  normalize(value) { return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''); },
  escape(value) { return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
};