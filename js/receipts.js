// ==========================================
// Cakekulator - Importación de boletas y facturas
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div><h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2"><span>🧾</span> Actualizar compras</h2><p class="text-sm text-gray-500">Escanea una boleta o factura, revisa sus líneas y actualiza tu catálogo.</p></div>
        <button onclick="ReceiptsModule.reset()" class="px-4 py-2.5 rounded-xl border border-pink-200 text-pink-700 font-semibold text-sm hover:bg-pink-50">Nueva boleta</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-5">
        <div class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm space-y-4">
          <div><h3 class="font-bold text-gray-800">1. Captura el documento</h3><p class="text-xs text-gray-500 mt-1">Usa una foto clara, con buena luz y todos los productos visibles.</p></div>
          <label class="block border-2 border-dashed border-pink-200 rounded-2xl p-5 text-center cursor-pointer hover:bg-pink-50 transition">
            <input type="file" accept="image/*" capture="environment" onchange="ReceiptsModule.processFile(event)" class="hidden">
            <span class="text-4xl block mb-2">📷</span><span class="text-sm font-bold text-pink-700">Tomar foto o elegir imagen</span><span class="text-xs text-gray-400 block mt-1">JPG, PNG o WEBP</span>
          </label>
          ${this.imageUrl ? `<img src="${this.imageUrl}" alt="Vista previa de la boleta" class="w-full max-h-72 object-contain rounded-xl bg-gray-50 border border-gray-100">` : ''}
          <div id="receipt-progress" class="text-xs text-gray-500 min-h-5">${this.progress}</div>
          <div><label class="block text-xs font-semibold text-gray-700 mb-1">Texto detectado (editable)</label><textarea id="receipt-raw-text" rows="7" oninput="ReceiptsModule.updateRawText(this.value)" placeholder="Si el OCR no está disponible, pega aquí el texto de la boleta..." class="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-400 text-xs">${this.escape(this.ocrText)}</textarea><button onclick="ReceiptsModule.parseText()" class="mt-2 w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs">Detectar productos desde el texto</button></div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
          <div class="flex items-start justify-between gap-3 mb-3"><div><h3 class="font-bold text-gray-800">2. Revisa y aplica</h3><p class="text-xs text-gray-500 mt-1">Cada línea debe tener nombre, formato y precio.</p></div><span class="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">Revisión manual</span></div>
          <div class="space-y-3">${this.items.length ? this.items.map((item, index) => this.renderItem(item, index)).join('') : `<div class="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">Todavía no hay productos detectados.</div>`}</div>
          ${this.items.length ? `<button onclick="ReceiptsModule.applyItems()" class="w-full mt-5 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-md shadow-pink-200">Actualizar catálogo</button>` : ''}
        </div>
      </div>`;
  },

  renderItem(item, index) {
    const ingredients = DB.getIngredients();
    return `<div class="border border-gray-100 rounded-xl p-3 space-y-2"><div class="flex items-center justify-between gap-2"><span class="text-[11px] font-bold text-gray-400">LÍNEA ${index + 1}</span><button onclick="ReceiptsModule.removeItem(${index})" class="text-xs text-red-500 hover:underline">Quitar</button></div><input value="${this.escape(item.name)}" oninput="ReceiptsModule.setItem(${index}, 'name', this.value)" placeholder="Nombre del insumo" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"><div class="grid grid-cols-3 gap-2"><input type="number" min="0.01" step="any" value="${item.packageQty || 1}" oninput="ReceiptsModule.setItem(${index}, 'packageQty', this.value)" class="px-2 py-2 rounded-lg border border-gray-200 text-sm" title="Cantidad"><select onchange="ReceiptsModule.setItem(${index}, 'packageUnit', this.value)" class="px-2 py-2 rounded-lg border border-gray-200 text-sm">${['g', 'kg', 'ml', 'l', 'u'].map(unit => `<option value="${unit}" ${item.packageUnit === unit ? 'selected' : ''}>${unit}</option>`).join('')}</select><input type="number" min="0" step="any" value="${item.packagePrice || 0}" oninput="ReceiptsModule.setItem(${index}, 'packagePrice', this.value)" class="px-2 py-2 rounded-lg border border-gray-200 text-sm" title="Precio"></div><select onchange="ReceiptsModule.setItem(${index}, 'matchedId', this.value)" class="w-full px-3 py-2 rounded-lg border ${item.matchedId ? 'border-emerald-300 bg-emerald-50' : 'border-amber-200 bg-amber-50'} text-xs"><option value="">+ Crear nuevo insumo</option>${ingredients.map(ing => `<option value="${ing.id}" ${item.matchedId === ing.id ? 'selected' : ''}>Actualizar: ${this.escape(ing.name)}</option>`).join('')}</select></div>`;
  },

  async processFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    this.imageUrl = URL.createObjectURL(file);
    this.progress = 'Analizando documento con Google Gemini IA...';
    this.render();

    if (typeof GeminiService !== 'undefined' && !GeminiService.hasApiKey()) {
      GeminiService.promptApiKeyModal(() => {
        this.processFile(event);
      });
      return;
    }

    try {
      const items = await GeminiService.analyzeReceipt(file);
      const existing = DB.getIngredients();
      this.items = items.map(item => {
        const match = existing.find(ing => this.normalize(ing.name).includes(this.normalize(item.name)) || this.normalize(item.name).includes(this.normalize(ing.name)));
        return {
          name: item.name,
          packageQty: item.packageQty || 1,
          packageUnit: item.packageUnit || 'u',
          packagePrice: item.packagePrice || 0,
          matchedId: match?.id || ''
        };
      });
      this.progress = `✨ ¡Listo! Se identificaron ${this.items.length} productos con Gemini IA.`;
      this.render();
    } catch (error) {
      console.error('Error en Gemini Vision:', error);
      this.progress = 'No se pudo leer la imagen con Gemini. Pega el texto manualmente y vuelve a intentarlo.';
      this.render();
    }
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