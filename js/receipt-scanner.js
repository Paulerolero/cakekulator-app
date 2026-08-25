// ==========================================
// Cakekulator - Módulo de Captura y Escaneo de Boletas / Facturas
// ==========================================

const ReceiptScannerModule = {
  scannedItems: [],
  isProcessing: false,

  openModal() {
    let modal = document.getElementById('receipt-scanner-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receipt-scanner-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    this.scannedItems = [];
    this.isProcessing = false;
    this.renderCaptureStep();
    modal.classList.remove('hidden');
  },

  closeModal() {
    const modal = document.getElementById('receipt-scanner-modal');
    if (modal) modal.classList.add('hidden');
  },

  renderCaptureStep() {
    const modal = document.getElementById('receipt-scanner-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-pink-100 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-3.5">
          <div class="flex items-center gap-2 sm:gap-2.5">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-pink-600 text-white flex items-center justify-center text-lg sm:text-xl shadow-xs">
              🧾
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-sm sm:text-base">Escanear Boleta o Factura</h3>
              <p class="text-[11px] sm:text-xs text-gray-400">Actualiza precios o crea nuevos insumos automáticamente</p>
            </div>
          </div>
          <button onclick="ReceiptScannerModule.closeModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        <!-- Opciones de Captura -->
        <div class="space-y-4 overflow-y-auto flex-1 pr-1">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Botón Foto con Cámara -->
            <label class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50 transition cursor-pointer group text-center">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition duration-200">
                📸
              </div>
              <span class="text-xs font-bold text-pink-700">Tomar Foto con Cámara</span>
              <span class="text-[11px] text-gray-400 mt-0.5">Captura la boleta física</span>
              <input type="file" accept="image/*" capture="environment" onchange="ReceiptScannerModule.handleImageFile(event)" class="hidden">
            </label>

            <!-- Botón Subir Archivo -->
            <label class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-pink-400 bg-gray-50/60 hover:bg-pink-50/30 transition cursor-pointer group text-center">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition duration-200">
                🖼️
              </div>
              <span class="text-xs font-bold text-gray-700 group-hover:text-pink-600">Subir Imagen / Factura</span>
              <span class="text-[11px] text-gray-400 mt-0.5">JPG, PNG o foto guardada</span>
              <input type="file" accept="image/*" onchange="ReceiptScannerModule.handleImageFile(event)" class="hidden">
            </label>
          </div>

          <!-- O Pegar Texto Directo -->
          <div class="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>✍️</span> O pega el texto de la boleta / factura electrónica
              </span>
              <button onclick="ReceiptScannerModule.loadSampleText()" class="text-[11px] text-pink-600 font-bold hover:underline">
                Cargar Ejemplo
              </button>
            </div>
            <textarea 
              id="receipt-raw-text" 
              rows="3" 
              placeholder="Ej:&#10;Harina Selecta 1kg $ 1.490&#10;Manjar Colun 1kg $ 4.290&#10;Huevos bandeja 30 un $ 6.990" 
              class="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-pink-400 bg-white"
            ></textarea>
            <button 
              onclick="ReceiptScannerModule.handleTextParse()" 
              class="w-full py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold rounded-xl transition"
            >
              🔍 Procesar Texto de la Boleta
            </button>
          </div>

          <!-- Consejos de Escaneo -->
          <div class="bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
            <span class="text-base">💡</span>
            <div>
              <strong>Consejo para mejor precisión:</strong> Asegúrate de que la foto tenga buena luz y que los nombres de los productos y sus precios se vean nítidos.
            </div>
          </div>
        </div>

      </div>
    `;
  },

  loadSampleText() {
    const el = document.getElementById('receipt-raw-text');
    if (el) {
      el.value = `SUPERMERCADO CENTRAL
RUT: 76.123.456-7
BOLETA ELECTRONICA: 0048291
----------------------------------
1 HARINA SIN POLVOS 1KG    $ 1.590
1 MANJAR ARTESANAL 1KG     $ 4.590
1 HUEVOS BANDEJA 30 UN     $ 7.200
2 LECHE CONDENSADA 397G    $ 3.380
1 CAJA TORTA 26CM 10UN     $ 5.990
1 MANTEQUILLA COLUN 250G   $ 2.450
----------------------------------
TOTAL PAGADO:             $ 25.200`;
    }
  },

  async handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.renderLoading('Analizando boleta con Google Gemini IA...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target.result;
      await this.processImageWithGemini(imageDataUrl);
    };
    reader.readAsDataURL(file);
  },

  renderLoading(message = 'Extrayendo insumos con Google Gemini IA...') {
    const modal = document.getElementById('receipt-scanner-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-pink-100 text-center space-y-4 animate-in fade-in">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-pink-600 flex items-center justify-center mx-auto text-3xl animate-bounce">
          ✨
        </div>
        <div>
          <h3 class="font-bold text-gray-900 text-base">Escaneando Boleta</h3>
          <p id="ocr-status-text" class="text-xs text-purple-600 font-semibold mt-1">${message}</p>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
          <div id="ocr-progress-bar" class="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 h-full w-3/4 animate-pulse rounded-full"></div>
        </div>
        <span class="text-[10px] text-gray-400 block">Google Gemini IA identificando productos, cantidades y precios...</span>
      </div>
    `;
  },

  async processImageWithGemini(imageDataUrl) {
    if (typeof GeminiService !== 'undefined' && !GeminiService.hasApiKey()) {
      GeminiService.promptApiKeyModal(() => {
        this.renderLoading('Analizando boleta con Google Gemini IA...');
        this.processImageWithGemini(imageDataUrl);
      });
      return;
    }

    try {
      const rawItems = await GeminiService.analyzeReceipt(imageDataUrl);
      this.processGeminiItems(rawItems);
    } catch (error) {
      console.error('Error durante análisis con Gemini:', error);
      if (error.message === 'MISSING_API_KEY' || error.message.includes('API key')) {
        GeminiService.promptApiKeyModal(() => {
          this.renderLoading('Analizando boleta con Google Gemini IA...');
          this.processImageWithGemini(imageDataUrl);
        });
        return;
      }
      alert(`Hubo un problema al analizar la imagen con Gemini: ${error.message || error}\nPuedes pegar el texto manualmente.`);
      this.renderCaptureStep();
    }
  },

  async handleTextParse() {
    const rawText = document.getElementById('receipt-raw-text')?.value || '';
    if (!rawText.trim()) {
      alert('Por favor ingresa o pega el texto de la boleta.');
      return;
    }

    if (typeof GeminiService !== 'undefined' && !GeminiService.hasApiKey()) {
      GeminiService.promptApiKeyModal(() => {
        this.handleTextParse();
      });
      return;
    }

    this.renderLoading('Analizando texto de boleta con Gemini IA...');

    try {
      const rawItems = await GeminiService.analyzeReceipt(rawText);
      this.processGeminiItems(rawItems);
    } catch (error) {
      console.error('Error al procesar texto con Gemini:', error);
      alert(`Error: ${error.message || error}`);
      this.renderCaptureStep();
    }
  },

  processGeminiItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      alert('No se detectaron productos válidos. Intenta con una imagen más clara.');
      this.renderCaptureStep();
      return;
    }

    const existingIngredients = DB.getIngredients();
    this.scannedItems = items.map(item => {
      const matchedIng = this.findBestIngredientMatch(item.name, existingIngredients);
      return {
        id: 'scanned_' + Math.random().toString(36).substr(2, 6),
        name: matchedIng ? matchedIng.name : this.capitalize(item.name || 'Insumo'),
        rawName: item.name,
        packageQty: parseFloat(item.packageQty) || (matchedIng ? matchedIng.packageQty : 1),
        packageUnit: item.packageUnit || (matchedIng ? matchedIng.packageUnit : 'u'),
        packagePrice: parseFloat(item.packagePrice) || 0,
        matchedIngredientId: matchedIng ? matchedIng.id : null,
        oldPrice: matchedIng ? matchedIng.packagePrice : null,
        category: matchedIng ? matchedIng.category : (item.category || this.guessCategory(item.name)),
        selected: true
      };
    });

    this.renderReviewStep();
  },

  // Motor Inteligente de Extracción y Emparejamiento
  parseReceiptText(text) {
    const lines = text.split('\n');
    const existingIngredients = DB.getIngredients();
    const detectedItems = [];

    // Palabras clave que indican líneas no deseadas (metadata de boleta)
    const ignoreKeywords = [
      'rut:', 'boleta', 'factura', 'ticket', 'fecha:', 'hora:', 'caja:', 'cajero', 
      'subtotal', 'sub-total', 'iva', 'total', 'efectivo', 'tarjeta', 'vuelto',
      'cambio', 'gracias', 'atendido', 'cliente', 'giro:', 'direccion:', 'telefono:',
      'supermercado', 'comercial', 'descuento', 'redcompra', 'debito', 'credito'
    ];

    for (let rawLine of lines) {
      let line = rawLine.trim();
      if (!line || line.length < 4) continue;

      const lowerLine = line.toLowerCase();

      // Ignorar líneas con metadata
      if (ignoreKeywords.some(kw => lowerLine.includes(kw))) {
        continue;
      }

      // Buscar precios en la línea (formatos como $ 1.490, 1.490, 1490, etc.)
      const priceMatches = line.match(/\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{3,6})\b/g);
      if (!priceMatches || priceMatches.length === 0) continue;

      // El último número de la línea suele ser el precio final del ítem
      const rawPriceStr = priceMatches[priceMatches.length - 1].replace(/[^0-9]/g, '');
      const price = parseInt(rawPriceStr, 10);
      if (!price || price < 100 || price > 500000) continue;

      // Limpiar el nombre del producto (remover precio, números iniciales de cantidad y caracteres extra)
      let namePart = line
        .replace(priceMatches[priceMatches.length - 1], '')
        .replace(/^[0-9]+[xX\s*.-]+/, '') // remover "1x", "1 ", "1-", etc.
        .replace(/[$*#_]/g, '')
        .trim();

      if (namePart.length < 3) continue;

      // Detectar cantidad y unidad en el texto (ej: 1kg, 500g, 30 un, 1 lt)
      const unitInfo = this.extractPackageUnitAndQty(namePart);

      // Emparejar con insumos existentes en la base de datos
      const matchedIng = this.findBestIngredientMatch(namePart, existingIngredients);

      detectedItems.push({
        id: 'scanned_' + Math.random().toString(36).substr(2, 6),
        name: matchedIng ? matchedIng.name : this.capitalize(namePart),
        rawName: namePart,
        packageQty: unitInfo.qty || (matchedIng ? matchedIng.packageQty : 1),
        packageUnit: unitInfo.unit || (matchedIng ? matchedIng.packageUnit : 'un'),
        packagePrice: price,
        matchedIngredientId: matchedIng ? matchedIng.id : null,
        oldPrice: matchedIng ? matchedIng.packagePrice : null,
        category: matchedIng ? matchedIng.category : this.guessCategory(namePart),
        selected: true
      });
    }

    if (detectedItems.length === 0) {
      alert('No se detectaron productos con precios claros en el texto. Intenta pegar el texto manualmente o usar una foto más cercana.');
      this.renderCaptureStep();
      return;
    }

    this.scannedItems = detectedItems;
    this.renderReviewStep();
  },

  // Extraer cantidad y unidad (g, kg, ml, l, un)
  extractPackageUnitAndQty(str) {
    const lower = str.toLowerCase();
    
    // Gramos / Kilos
    const kgMatch = lower.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:kg|kilos?|kilo)\b/);
    if (kgMatch) return { qty: parseFloat(kgMatch[1].replace(',', '.')), unit: 'kg' };

    const gMatch = lower.match(/([0-9]{2,4})\s*(?:g|gr|gramos?)\b/);
    if (gMatch) return { qty: parseFloat(gMatch[1]), unit: 'g' };

    // Litros / Mililitros
    const lMatch = lower.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:l|lt|litros?|litro)\b/);
    if (lMatch) return { qty: parseFloat(lMatch[1].replace(',', '.')), unit: 'l' };

    const mlMatch = lower.match(/([0-9]{2,4})\s*(?:ml|cc)\b/);
    if (mlMatch) return { qty: parseFloat(mlMatch[1]), unit: 'ml' };

    // Unidades
    const unMatch = lower.match(/([0-9]+)\s*(?:un|unid|unidades?)\b/);
    if (unMatch) return { qty: parseFloat(unMatch[1]), unit: 'un' };

    return { qty: 1, unit: 'un' };
  },

  // Algoritmo de emparejamiento con insumos existentes
  findBestIngredientMatch(scannedName, ingredients) {
    const clean = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ');
    const scannedClean = clean(scannedName);
    const scannedTokens = scannedClean.split(/\s+/).filter(t => t.length > 2);

    let bestMatch = null;
    let maxScore = 0;

    for (const ing of ingredients) {
      const ingClean = clean(ing.name);
      const ingTokens = ingClean.split(/\s+/).filter(t => t.length > 2);

      // Coincidencia exacta o contenida
      if (scannedClean.includes(ingClean) || ingClean.includes(scannedClean)) {
        return ing;
      }

      // Conteo de tokens coincidentes
      let matchCount = 0;
      for (const token of scannedTokens) {
        if (ingTokens.includes(token)) {
          matchCount++;
        }
      }

      const score = matchCount / Math.max(scannedTokens.length, ingTokens.length);
      if (score > 0.4 && score > maxScore) {
        maxScore = score;
        bestMatch = ing;
      }
    }

    return bestMatch;
  },

  guessCategory(name) {
    const lower = name.toLowerCase();
    if (lower.includes('harina') || lower.includes('polvo') || lower.includes('maicena') || lower.includes('levadura')) return 'Harinas y Polvos';
    if (lower.includes('leche') || lower.includes('manjar') || lower.includes('mantequilla') || lower.includes('crema') || lower.includes('queso')) return 'Lácteos';
    if (lower.includes('chocolate') || lower.includes('cacao') || lower.includes('cobertura') || lower.includes('nutella')) return 'Chocolates & Cremas';
    if (lower.includes('huevo')) return 'Huevos & Frescos';
    if (lower.includes('caja') || lower.includes('blister') || lower.includes('bolsa') || lower.includes('blonda') || lower.includes('cinta')) return 'Empaques';
    if (lower.includes('azucar') || lower.includes('endulzante') || lower.includes('tagatosa')) return 'Azúcares & Endulzantes';
    return 'General';
  },

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Vista de Revisión y Confirmación de Cambios
  renderReviewStep() {
    const modal = document.getElementById('receipt-scanner-modal');
    if (!modal) return;

    const allIngredients = DB.getIngredients();
    const toUpdateCount = this.scannedItems.filter(i => i.selected && i.matchedIngredientId).length;
    const toCreateCount = this.scannedItems.filter(i => i.selected && !i.matchedIngredientId).length;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-pink-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div>
            <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
              <span>🧾</span> Insumos Detectados en la Boleta
            </h3>
            <p class="text-xs text-gray-500">Revisa los precios antes de aplicarlos a tu catálogo</p>
          </div>
          <button onclick="ReceiptScannerModule.closeModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        <!-- Barra de Resumen de Acciones -->
        <div class="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 p-3 rounded-2xl border border-pink-100 flex items-center justify-between text-xs mb-3">
          <div class="flex items-center gap-3">
            <span class="font-bold text-emerald-700 flex items-center gap-1">
              <span>🔄</span> ${toUpdateCount} para actualizar
            </span>
            <span class="font-bold text-blue-700 flex items-center gap-1">
              <span>➕</span> ${toCreateCount} nuevos
            </span>
          </div>
          <button onclick="ReceiptScannerModule.toggleSelectAll()" class="text-pink-600 font-bold hover:underline">
            Seleccionar Todos
          </button>
        </div>

        <!-- Lista de Insumos Extraídos -->
        <div class="overflow-y-auto flex-1 space-y-2.5 pr-1 mb-4">
          ${this.scannedItems.map((item, index) => {
            const isMatch = Boolean(item.matchedIngredientId);
            const priceDiff = isMatch ? item.packagePrice - item.oldPrice : 0;
            const pctDiff = isMatch && item.oldPrice > 0 ? ((priceDiff / item.oldPrice) * 100).toFixed(0) : null;

            return `
              <div class="p-3.5 rounded-2xl border ${item.selected ? (isMatch ? 'border-emerald-200 bg-emerald-50/20' : 'border-blue-200 bg-blue-50/20') : 'border-gray-100 bg-gray-50 opacity-60'} transition space-y-2">
                
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5 flex-1">
                    <input 
                      type="checkbox" 
                      ${item.selected ? 'checked' : ''} 
                      onchange="ReceiptScannerModule.toggleItem(${index})"
                      class="w-4 h-4 rounded text-pink-600 focus:ring-pink-400 accent-pink-600 cursor-pointer"
                    >
                    <div class="flex-1">
                      <input 
                        type="text" 
                        value="${item.name}" 
                        oninput="ReceiptScannerModule.updateItemName(${index}, this.value)"
                        class="w-full font-bold text-xs text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-pink-400 focus:outline-none"
                      >
                      <span class="text-[10px] text-gray-400 block truncate">Texto boleta: "${item.rawName}"</span>
                    </div>
                  </div>

                  <!-- Badge de Acción -->
                  <div class="shrink-0">
                    ${isMatch ? `
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span>🔄</span> Actualizar
                      </span>
                    ` : `
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                        <span>➕</span> Nuevo
                      </span>
                    `}
                  </div>
                </div>

                <!-- Campos de Formato y Precio -->
                <div class="grid grid-cols-12 gap-2 items-center text-xs pt-1 border-t border-gray-100/80">
                  
                  <!-- Formato / Cantidad -->
                  <div class="col-span-4 flex items-center gap-1">
                    <input 
                      type="number" 
                      step="any"
                      min="0.1"
                      value="${item.packageQty}" 
                      oninput="ReceiptScannerModule.updateItemQty(${index}, this.value)"
                      class="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center font-semibold text-xs"
                    >
                    <select 
                      onchange="ReceiptScannerModule.updateItemUnit(${index}, this.value)"
                      class="px-1.5 py-1 rounded-lg border border-gray-200 text-xs bg-white font-medium"
                    >
                      <option value="g" ${item.packageUnit === 'g' ? 'selected' : ''}>g</option>
                      <option value="kg" ${item.packageUnit === 'kg' ? 'selected' : ''}>kg</option>
                      <option value="ml" ${item.packageUnit === 'ml' ? 'selected' : ''}>ml</option>
                      <option value="l" ${item.packageUnit === 'l' ? 'selected' : ''}>L</option>
                      <option value="un" ${item.packageUnit === 'un' ? 'selected' : ''}>un</option>
                    </select>
                  </div>

                  <!-- Precio de Compra -->
                  <div class="col-span-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <span class="text-gray-400 font-bold">$</span>
                      <input 
                        type="number" 
                        step="any"
                        min="0"
                        value="${item.packagePrice}" 
                        oninput="ReceiptScannerModule.updateItemPrice(${index}, this.value)"
                        class="w-20 px-2 py-1 rounded-lg border border-pink-300 text-right font-black text-gray-900 text-xs"
                      >
                    </div>
                  </div>

                  <!-- Comparación con precio anterior -->
                  <div class="col-span-4 text-right">
                    ${isMatch ? `
                      <span class="text-[11px] block font-medium ${priceDiff > 0 ? 'text-red-500' : (priceDiff < 0 ? 'text-emerald-600' : 'text-gray-400')}">
                        ${priceDiff > 0 ? `▲ +$${priceDiff.toLocaleString('es-CL')} (+${pctDiff}%)` : (priceDiff < 0 ? `▼ -$${Math.abs(priceDiff).toLocaleString('es-CL')} (${pctDiff}%)` : 'Sin cambio')}
                      </span>
                      <span class="text-[9px] text-gray-400 block">Antes: $${item.oldPrice.toLocaleString('es-CL')}</span>
                    ` : `
                      <select 
                        onchange="ReceiptScannerModule.updateItemCategory(${index}, this.value)"
                        class="w-full text-[10px] p-1 rounded-lg border border-gray-200 bg-white"
                      >
                        <option value="Harinas y Polvos" ${item.category === 'Harinas y Polvos' ? 'selected' : ''}>Harinas</option>
                        <option value="Lácteos" ${item.category === 'Lácteos' ? 'selected' : ''}>Lácteos</option>
                        <option value="Chocolates & Cremas" ${item.category === 'Chocolates & Cremas' ? 'selected' : ''}>Chocolates</option>
                        <option value="Huevos & Frescos" ${item.category === 'Huevos & Frescos' ? 'selected' : ''}>Huevos</option>
                        <option value="Empaques" ${item.category === 'Empaques' ? 'selected' : ''}>Empaques</option>
                        <option value="Azúcares & Endulzantes" ${item.category === 'Azúcares & Endulzantes' ? 'selected' : ''}>Azúcares</option>
                        <option value="General" ${item.category === 'General' ? 'selected' : ''}>General</option>
                      </select>
                    `}
                  </div>

                </div>

              </div>
            `;
          }).join('')}
        </div>

        <!-- Botones de Acción Final -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <button 
            type="button" 
            onclick="ReceiptScannerModule.renderCaptureStep()" 
            class="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            ← Reintentar
          </button>
          
          <button 
            type="button" 
            onclick="ReceiptScannerModule.applyChanges()" 
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-pink-200 transition active:scale-95 flex items-center gap-1.5"
          >
            <span>✅</span> Aplicar a Mis Insumos (${this.scannedItems.filter(i => i.selected).length})
          </button>
        </div>

      </div>
    `;
  },

  toggleItem(index) {
    this.scannedItems[index].selected = !this.scannedItems[index].selected;
    this.renderReviewStep();
  },

  toggleSelectAll() {
    const allSelected = this.scannedItems.every(i => i.selected);
    this.scannedItems.forEach(i => i.selected = !allSelected);
    this.renderReviewStep();
  },

  updateItemName(index, val) {
    this.scannedItems[index].name = val;
  },

  updateItemQty(index, val) {
    this.scannedItems[index].packageQty = parseFloat(val) || 1;
  },

  updateItemUnit(index, val) {
    this.scannedItems[index].packageUnit = val;
  },

  updateItemPrice(index, val) {
    this.scannedItems[index].packagePrice = parseFloat(val) || 0;
    this.renderReviewStep();
  },

  updateItemCategory(index, val) {
    this.scannedItems[index].category = val;
  },

  // Guardar cambios en la base de datos e informar al usuario
  applyChanges() {
    const selectedItems = this.scannedItems.filter(i => i.selected);
    if (selectedItems.length === 0) {
      alert('No has seleccionado ningún insumo para guardar.');
      return;
    }

    let updatedCount = 0;
    let createdCount = 0;

    for (const item of selectedItems) {
      if (item.matchedIngredientId) {
        // Actualizar insumo existente
        DB.updateIngredient(item.matchedIngredientId, {
          packagePrice: item.packagePrice,
          packageQty: item.packageQty,
          packageUnit: item.packageUnit,
          lastUpdated: new Date().toISOString()
        });
        updatedCount++;
      } else {
        // Crear nuevo insumo
        DB.addIngredient({
          id: 'ing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: item.name,
          category: item.category || 'General',
          packagePrice: item.packagePrice,
          packageQty: item.packageQty,
          packageUnit: item.packageUnit,
          createdAt: new Date().toISOString()
        });
        createdCount++;
      }
    }

    this.closeModal();

    // Refrescar vistas
    if (typeof IngredientsModule !== 'undefined') {
      IngredientsModule.render();
    }
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🎉 ¡Listo! ${updatedCount} insumo(s) actualizado(s) y ${createdCount} nuevo(s) creado(s).`);
    } else {
      alert(`🎉 ¡Listo! Se actualizaron ${updatedCount} insumos y se crearon ${createdCount} nuevos.`);
    }
  }
};
