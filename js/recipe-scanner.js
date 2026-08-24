// ==========================================
// Cakekulator - Módulo de Escaneo y Reconocimiento Inteligente de Recetas
// ==========================================

const RecipeScannerModule = {
  scannedRecipe: null,
  isProcessing: false,

  openModal() {
    let modal = document.getElementById('recipe-scanner-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'recipe-scanner-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    this.scannedRecipe = null;
    this.isProcessing = false;
    this.renderCaptureStep();
    modal.classList.remove('hidden');
  },

  closeModal() {
    const modal = document.getElementById('recipe-scanner-modal');
    if (modal) modal.classList.add('hidden');
  },

  renderCaptureStep() {
    const modal = document.getElementById('recipe-scanner-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-pink-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white flex items-center justify-center text-xl shadow-md shadow-pink-200">
              📸
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-base">Escanear Receta con Cámara o Foto</h3>
              <p class="text-xs text-gray-400">Captura un cuaderno, libro o captura de pantalla para prellenar la ficha</p>
            </div>
          </div>
          <button onclick="RecipeScannerModule.closeModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        <!-- Opciones de Captura -->
        <div class="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Botón Foto con Cámara -->
            <label class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 transition cursor-pointer group text-center">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition duration-200">
                📷
              </div>
              <span class="text-xs font-bold text-purple-800">Tomar Foto con Cámara</span>
              <span class="text-[11px] text-gray-400 mt-0.5">Apunta a tu cuaderno o libro</span>
              <input type="file" accept="image/*" capture="environment" onchange="RecipeScannerModule.handleImageFile(event)" class="hidden">
            </label>

            <!-- Botón Subir Imagen / Captura -->
            <label class="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/40 hover:bg-pink-50 transition cursor-pointer group text-center">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition duration-200">
                🖼️
              </div>
              <span class="text-xs font-bold text-pink-700">Subir Imagen / Captura</span>
              <span class="text-[11px] text-gray-400 mt-0.5">Captura de Instagram, Pinterest o PDF</span>
              <input type="file" accept="image/*" onchange="RecipeScannerModule.handleImageFile(event)" class="hidden">
            </label>
          </div>

          <!-- O Pegar Texto Directo -->
          <div class="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>✍️</span> O pega el texto de la receta
              </span>
              <button onclick="RecipeScannerModule.loadSampleText()" class="text-[11px] text-purple-600 font-bold hover:underline">
                Cargar Ejemplo
              </button>
            </div>
            <textarea 
              id="recipe-raw-text" 
              rows="4" 
              placeholder="Ej:&#10;Torta de Chocolate Húmeda (16 personas)&#10;300g harina sin polvos&#10;250g azúcar granulada&#10;3 huevos&#10;150ml aceite&#10;80g cacao en polvo&#10;200ml leche entera&#10;1 cda polvo de hornear" 
              class="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-400 bg-white"
            ></textarea>
            <button 
              onclick="RecipeScannerModule.handleTextParse()" 
              class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-200 transition active:scale-95"
            >
              🔍 Analizar Ingredientes de la Receta
            </button>
          </div>

          <!-- Consejos de Escaneo -->
          <div class="bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
            <span class="text-base">💡</span>
            <div>
              <strong>Consejo de Escaneo:</strong> La app detectará automáticamente cantidades en gramos (g), kilos (kg), mililitros (ml), tazas, cucharadas y unidades, y las vinculará con los insumos de tu catálogo.
            </div>
          </div>
        </div>

      </div>
    `;
  },

  loadSampleText() {
    const el = document.getElementById('recipe-raw-text');
    if (el) {
      el.value = `Torta de Chocolate y Manjar (20 Personas)
Preparación: 45 min. Horneado: 35 min.

Ingredientes:
350 g Harina sin polvos
250 g Azúcar granulada
4 u Huevos
150 ml Aceite vegetal
100 g Cacao amargo en polvo
250 ml Leche entera
500 g Manjar artesanal
1 cda Polvo de hornear
1 cdta Esencia de vainilla`;
    }
  },

  async handleImageFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    this.renderProcessingStep('Leyendo imagen con Inteligencia Óptica (OCR)...');

    try {
      if (typeof Tesseract === 'undefined') {
        throw new Error('Módulo OCR no cargado');
      }

      const result = await Tesseract.recognize(
        file,
        'spa',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(m.progress * 100);
              this.updateProcessingProgress(pct, `Analizando texto de la receta (${pct}%)...`);
            }
          }
        }
      );

      const text = result && result.data && result.data.text;
      if (!text || text.trim().length < 10) {
        alert('No se pudo detectar texto legible en la imagen. Por favor intenta con una foto más clara o pega el texto directamente.');
        this.renderCaptureStep();
        return;
      }

      this.parseRecipeText(text);
    } catch (e) {
      console.error('Error en OCR:', e);
      alert('Hubo un inconveniente al procesar la imagen. Puedes pegar el texto de la receta manualmente.');
      this.renderCaptureStep();
    }
  },

  handleTextParse() {
    const textarea = document.getElementById('recipe-raw-text');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) {
      alert('Por favor ingresa o pega el texto de la receta.');
      return;
    }
    this.parseRecipeText(text);
  },

  renderProcessingStep(statusText) {
    const modal = document.getElementById('recipe-scanner-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4 animate-in fade-in">
        <div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
          📸
        </div>
        <h3 class="font-bold text-gray-800 text-lg">Procesando Receta</h3>
        <p id="ocr-status-text" class="text-xs text-gray-500">${statusText}</p>
        
        <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div id="ocr-progress-bar" class="bg-gradient-to-r from-purple-600 to-pink-500 h-3 rounded-full transition-all duration-300 w-1/4"></div>
        </div>

        <p class="text-[11px] text-gray-400">Extrayendo ingredientes, porciones y cantidades...</p>
      </div>
    `;
  },

  updateProcessingProgress(pct, text) {
    const bar = document.getElementById('ocr-progress-bar');
    const status = document.getElementById('ocr-status-text');
    if (bar) bar.style.width = `${pct}%`;
    if (status) status.textContent = text;
  },

  // ====================================================
  // Parser Inteligente de Texto de Recetas
  // ====================================================
  parseRecipeText(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('No se detectó contenido para procesar.');
      this.renderCaptureStep();
      return;
    }

    const allPantryIngredients = DB.getIngredients();
    
    // 1. Detectar Título de la Receta
    let name = 'Receta Escaneada';
    const cakeKeywords = ['torta', 'pastel', 'bizcocho', 'bizcochuelo', 'kuchen', 'pie', 'tartaleta', 'cheesecake', 'galletas', 'alfajores', 'cupcakes', 'muffins', 'brownie', 'panqueque', 'crema'];
    
    for (let i = 0; i < Math.min(4, lines.length); i++) {
      const lineLower = lines[i].toLowerCase();
      if (cakeKeywords.some(k => lineLower.includes(k)) || (!lineLower.includes('ingrediente') && !/\d+\s*(g|kg|ml|taza|cda)/i.test(lineLower))) {
        name = lines[i].replace(/^receta\s*(de|para)?\s*[:=]?\s*/i, '').trim();
        // Limpiar sufijos
        name = name.split(/(\(|\-|\:|\bpara\b)/i)[0].trim();
        if (name.length > 3) break;
      }
    }
    if (!name || name.length < 3) name = 'Nueva Receta Pastelera';

    // 2. Detectar Categoría y Tipo
    let category = 'Tortas';
    let type = 'cake';
    const nameLower = name.toLowerCase();

    if (nameLower.includes('alfajor')) { category = 'Alfajores'; type = 'units'; }
    else if (nameLower.includes('galleta') || nameLower.includes('cookie')) { category = 'Galletas'; type = 'units'; }
    else if (nameLower.includes('cupcake') || nameLower.includes('muffin')) { category = 'Cupcakes'; type = 'units'; }
    else if (nameLower.includes('tartaleta') || nameLower.includes('pie') || nameLower.includes('kuchen')) { category = 'Tartaletas'; type = 'cake'; }
    else if (nameLower.includes('postre') || nameLower.includes('mousse')) { category = 'Postres'; type = 'cake'; }
    else if (nameLower.includes('profiterol') || nameLower.includes('choux')) { category = 'Profiteroles'; type = 'units'; }
    else { category = 'Tortas'; type = 'cake'; }

    // 3. Detectar Rendimiento / Porciones
    let yieldPortions = type === 'cake' ? 16 : 24;
    let yieldUnits = type === 'cake' ? 1 : 24;

    const fullText = rawText.toLowerCase();
    const portionsMatch = fullText.match(/(?:para|rendimiento|rinde|porciones|personas)\s*[:=]?\s*(\d+)/i) ||
                          fullText.match(/\b(\d+)\s*(?:personas|porciones|pers|porc|unidades|un|piezas)\b/i);
    
    if (portionsMatch && portionsMatch[1]) {
      const p = parseInt(portionsMatch[1]);
      if (p > 0 && p < 500) {
        yieldPortions = p;
        yieldUnits = type === 'cake' ? 1 : p;
      }
    } else {
      const moldMatch = fullText.match(/molde\s*(?:de)?\s*(\d+)\s*cm/i);
      if (moldMatch && moldMatch[1]) {
        const d = parseInt(moldMatch[1]);
        yieldPortions = Calculator.estimateCakePortionsByDiameter(d);
      }
    }

    // 4. Detectar Tiempos
    let prepTimeMinutes = 45;
    let bakeTimeMinutes = 30;

    const prepMatch = fullText.match(/prep(?:araci[oó]n)?\s*[:=]?\s*(\d+)\s*min/i);
    if (prepMatch && prepMatch[1]) prepTimeMinutes = parseInt(prepMatch[1]);

    const bakeMatch = fullText.match(/(?:horno|cocci[oó]n|horneado)\s*(?:a\s*\d+[°c]*\s*)?(?:por|:)?\s*(\d+)\s*min/i);
    if (bakeMatch && bakeMatch[1]) bakeTimeMinutes = parseInt(bakeMatch[1]);

    // 5. Parsear Ingredientes Línea por Línea
    const detectedIngredients = [];

    const unitRegex = /^(g|gr|grs|gramos|kg|kilo|kilos|ml|cc|mililitros|l|lt|litro|litros|u|un|unidad|unidades|cda|cdas|cucharada|cucharadas|tbsp|cdta|cdtas|cucharadita|cucharaditas|tsp|taza|tazas|cup|cups|pizca)\b/i;

    lines.forEach(line => {
      // Ignorar encabezados obvios
      const l = line.trim();
      if (/^(ingredientes|preparacion|instrucciones|paso|notas|receta)/i.test(l) && l.length < 25) return;
      if (l.length < 3) return;

      // Intentar extraer cantidad, unidad y nombre
      // Patrones:
      // a) "250 g de harina" o "250g harina"
      // b) "1/2 taza de leche" o "1 1/2 cda polvo"
      // c) "3 huevos" o "4 yemas"
      
      let qty = 0;
      let unit = 'g';
      let cleanIngName = '';

      // Fracciones como 1/2, 1/4, 3/4, 1 1/2
      let processedLine = l.replace(/(\d+)\s+(\d+\/\d+)/, (m, whole, frac) => {
        const parts = frac.split('/');
        return (parseFloat(whole) + parseFloat(parts[0]) / parseFloat(parts[1])).toString();
      }).replace(/(\d+)\/(\d+)/, (m, num, den) => {
        return (parseFloat(num) / parseFloat(den)).toString();
      });

      // Regex para número inicial (ej. 250, 2.5, 2,5)
      const numMatch = processedLine.match(/^([0-9]+(?:[\.,][0-9]+)?)\s*(.*)/);

      if (numMatch) {
        qty = parseFloat(numMatch[1].replace(',', '.'));
        const rest = numMatch[2].trim();

        // Buscar unidad
        const uMatch = rest.match(unitRegex);
        if (uMatch) {
          const rawUnit = uMatch[1].toLowerCase();
          unit = this.normalizeUnit(rawUnit);
          cleanIngName = rest.substring(uMatch[0].length).trim();
        } else {
          // Si no hay unidad explícita, ver si es huevos/unidades
          if (/^(huevos|yemas|claras|limones|naranjas|platanos|plátanos|manzanas|unidades)/i.test(rest)) {
            unit = 'u';
          } else {
            unit = 'g';
          }
          cleanIngName = rest;
        }
      } else {
        // Puede ser "Un poco de sal" o "Harina 200g"
        const endNumMatch = processedLine.match(/(.*?)\s+([0-9]+(?:[\.,][0-9]+)?)\s*(g|gr|kg|ml|l|u|cda|cdta|taza)?$/i);
        if (endNumMatch) {
          cleanIngName = endNumMatch[1];
          qty = parseFloat(endNumMatch[2].replace(',', '.'));
          unit = endNumMatch[3] ? this.normalizeUnit(endNumMatch[3]) : 'g';
        }
      }

      // Limpiar nombre del ingrediente
      cleanIngName = cleanIngName
        .replace(/^(de|del|d)\s+/i, '')
        .replace(/^[\-\•\*\·\–\—\>]\s*/, '')
        .replace(/\s*\([^)]*\)/g, '') // Quitar paréntesis como (a temperatura ambiente)
        .trim();

      // Descartar si no tiene nombre o si es instrucción
      if (!cleanIngName || cleanIngName.length < 2 || qty <= 0) return;
      if (/^(batir|mezclar|hornear|incorporar|dejar|cocinar|llevar)/i.test(cleanIngName)) return;

      // Normalizar unidades de taza / cda a gramos si se desea o mantener unidad
      if (unit === 'taza' || unit === 'cup') unit = 'g'; // Cakekulator soporta g, ml, u, cda, cdta, kg, l
      if (unit === 'pizca') { unit = 'g'; qty = 2; }

      // 6. Vincular con Insumos del Catálogo
      const matchedPantry = this.findBestPantryMatch(cleanIngName, allPantryIngredients);

      detectedIngredients.push({
        name: cleanIngName,
        matchedIngredientId: matchedPantry ? matchedPantry.id : '',
        matchedPantryItem: matchedPantry,
        quantity: qty,
        unit: unit
      });
    });

    if (detectedIngredients.length === 0) {
      alert('No se pudieron identificar ingredientes estructurados en el texto. Puedes agregarlos manualmente.');
      this.renderCaptureStep();
      return;
    }

    this.scannedRecipe = {
      name,
      category,
      type,
      yieldPortions,
      yieldUnits,
      prepTimeMinutes,
      bakeTimeMinutes,
      ingredients: detectedIngredients
    };

    this.renderVerificationStep();
  },

  normalizeUnit(rawUnit) {
    const u = rawUnit.toLowerCase();
    if (['g', 'gr', 'grs', 'gramos'].includes(u)) return 'g';
    if (['kg', 'kilo', 'kilos'].includes(u)) return 'kg';
    if (['ml', 'cc', 'mililitros'].includes(u)) return 'ml';
    if (['l', 'lt', 'litro', 'litros'].includes(u)) return 'l';
    if (['u', 'un', 'unid', 'unidad', 'unidades', 'huevos', 'yemas', 'claras'].includes(u)) return 'u';
    if (['cda', 'cdas', 'cucharada', 'cucharadas', 'tbsp'].includes(u)) return 'tbsp';
    if (['cdta', 'cdtas', 'cucharadita', 'cucharaditas', 'tsp'].includes(u)) return 'tsp';
    if (['taza', 'tazas', 'cup', 'cups'].includes(u)) return 'cup';
    return 'g';
  },

  findBestPantryMatch(searchName, pantryList) {
    if (!searchName || !pantryList || pantryList.length === 0) return null;
    const s = searchName.toLowerCase();

    // 1. Coincidencia exacta o contiene
    let found = pantryList.find(p => p.name.toLowerCase() === s);
    if (found) return found;

    // 2. Palabras clave principales (harina, azucar, mantequilla, chocolate, manjar, huevo, leche, crema, vainilla, polvo de hornear)
    const keywords = ['harina', 'azúcar', 'azucar', 'mantequilla', 'margarina', 'chocolate', 'cacao', 'manjar', 'dulce de leche', 'huevo', 'leche', 'crema', 'vainilla', 'polvo de hornear', 'polvos', 'aceite', 'maicena', 'queso crema', 'frutilla', 'frambuesa', 'nuez', 'almendra'];

    for (const kw of keywords) {
      if (s.includes(kw)) {
        found = pantryList.find(p => p.name.toLowerCase().includes(kw));
        if (found) return found;
      }
    }

    // 3. Contiene subcadena
    found = pantryList.find(p => s.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(s));
    return found || null;
  },

  // ====================================================
  // Paso de Verificación y Ajuste de la Receta Escaneada
  // ====================================================
  renderVerificationStep() {
    const modal = document.getElementById('recipe-scanner-modal');
    if (!modal || !this.scannedRecipe) return;

    const data = this.scannedRecipe;
    const allPantry = DB.getIngredients().filter(i => i.category !== 'Empaque');
    const pantryMap = new Map(allPantry.map(i => [i.id, i]));

    // Calcular costo estimado en vivo
    let estimatedCost = 0;
    data.ingredients.forEach(item => {
      const ing = pantryMap.get(item.matchedIngredientId);
      if (ing) {
        estimatedCost += Calculator.getIngredientItemCost(ing, item.quantity, item.unit);
      }
    });

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-pink-100 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-2xs">
              ✨
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-base">¡Receta Escaneada con Éxito!</h3>
              <p class="text-xs text-gray-400">Revisa los ingredientes detectados antes de guardar la ficha técnica</p>
            </div>
          </div>
          <button onclick="RecipeScannerModule.closeModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        <!-- Formulario Scrollable -->
        <div class="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          
          <!-- Datos Generales -->
          <div class="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div class="sm:col-span-2">
              <label class="block font-bold text-purple-950 mb-1">Nombre de la Receta:</label>
              <input 
                type="text" 
                id="scanned-rec-name" 
                value="${data.name}" 
                class="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-bold text-gray-900 text-xs focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label class="block font-bold text-purple-950 mb-1">Porciones / Personas:</label>
              <div class="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="1" 
                  id="scanned-rec-yield" 
                  value="${data.yieldPortions}" 
                  class="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-black text-purple-700 text-center text-xs focus:ring-2 focus:ring-purple-400"
                />
                <span class="text-gray-500 font-medium">${data.type === 'cake' ? 'pers.' : 'un.'}</span>
              </div>
            </div>
          </div>

          <!-- Tabla de Ingredientes Extraídos -->
          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div class="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span class="font-bold text-gray-800 text-xs">Ingredientes Detectados (${data.ingredients.length})</span>
              <button onclick="RecipeScannerModule.addVerificationRow()" class="px-2.5 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold rounded-lg transition text-[11px]">
                + Insumo
              </button>
            </div>

            <div class="divide-y divide-gray-100 max-h-60 overflow-y-auto" id="scanned-ingredients-list">
              ${data.ingredients.map((item, idx) => {
                const ing = pantryMap.get(item.matchedIngredientId);
                const itemCost = ing ? Calculator.getIngredientItemCost(ing, item.quantity, item.unit) : 0;
                const rowId = `scanned_row_${idx}`;
                return `
                  <div id="${rowId}" class="p-2.5 flex items-center justify-between gap-2 hover:bg-purple-50/30 transition">
                    <div class="flex-1">
                      <select 
                        class="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:ring-1 focus:ring-purple-400 sc-ing-select"
                        onchange="RecipeScannerModule.recalculateVerificationSummary()"
                      >
                        <option value="">-- Vincular con Insumo del Catálogo --</option>
                        ${allPantry.map(p => `
                          <option value="${p.id}" ${p.id === item.matchedIngredientId ? 'selected' : ''}>
                            ${p.name} (${p.packageQty}${p.packageUnit} - ${Calculator.formatCurrency(p.packagePrice)})
                          </option>
                        `).join('')}
                      </select>
                      <span class="text-[10px] text-gray-400 pl-1">Detectado como: "${item.name}"</span>
                    </div>

                    <div class="w-18">
                      <input 
                        type="number" 
                        step="any" 
                        min="0" 
                        value="${item.quantity}" 
                        class="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold text-center sc-ing-qty focus:ring-1 focus:ring-purple-400"
                        oninput="RecipeScannerModule.recalculateVerificationSummary()"
                      />
                    </div>

                    <div class="w-16">
                      <select 
                        class="w-full px-1.5 py-1 rounded-lg border border-gray-200 text-xs sc-ing-unit bg-white focus:ring-1 focus:ring-purple-400"
                        onchange="RecipeScannerModule.recalculateVerificationSummary()"
                      >
                        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
                        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>ml</option>
                        <option value="l" ${item.unit === 'l' ? 'selected' : ''}>L</option>
                        <option value="u" ${item.unit === 'u' ? 'selected' : ''}>u</option>
                        <option value="tbsp" ${item.unit === 'tbsp' ? 'selected' : ''}>cda</option>
                        <option value="tsp" ${item.unit === 'tsp' ? 'selected' : ''}>cdta</option>
                        <option value="cup" ${item.unit === 'cup' ? 'selected' : ''}>taza</option>
                      </select>
                    </div>

                    <div class="w-20 text-right">
                      <span class="text-xs font-bold text-gray-800 block sc-ing-cost">${Calculator.formatCurrency(itemCost)}</span>
                    </div>

                    <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipeScannerModule.recalculateVerificationSummary();" class="text-gray-300 hover:text-red-500 p-1">
                      ✕
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Resumen de Costos Calculados -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-2xl border border-purple-100 flex items-center justify-between">
            <div>
              <span class="text-[11px] text-purple-900 block font-semibold">Costo Total Estimado en Insumos:</span>
              <span class="text-[10px] text-gray-500">Calculado con los precios de tu catálogo</span>
            </div>
            <div class="text-right">
              <span class="text-base font-black text-purple-800" id="scanned-total-cost">
                ${Calculator.formatCurrency(estimatedCost)}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer Acciones -->
        <div class="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button 
            onclick="RecipeScannerModule.renderCaptureStep()" 
            class="w-full sm:w-auto py-2.5 px-3.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl transition"
          >
            ← Volver a Escanear
          </button>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onclick="RecipeScannerModule.saveDirectly()" 
              class="flex-1 sm:flex-none py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              💾 Guardar en Recetas
            </button>
            <button 
              onclick="RecipeScannerModule.openInRecipeEditor()" 
              class="flex-1 sm:flex-none py-2.5 px-5 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-purple-300 transition active:scale-95 cursor-pointer"
            >
              ✨ Abrir en Ficha Técnica Completa
            </button>
          </div>
        </div>

      </div>
    `;
  },

  addVerificationRow() {
    const container = document.getElementById('scanned-ingredients-list');
    if (!container) return;

    const allPantry = DB.getIngredients().filter(i => i.category !== 'Empaque');
    const rowId = 'scanned_row_' + Date.now();

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'p-2.5 flex items-center justify-between gap-2 hover:bg-purple-50/30 transition';
    row.innerHTML = `
      <div class="flex-1">
        <select 
          class="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:ring-1 focus:ring-purple-400 sc-ing-select"
          onchange="RecipeScannerModule.recalculateVerificationSummary()"
        >
          <option value="">-- Seleccionar Insumo --</option>
          ${allPantry.map(p => `
            <option value="${p.id}">
              ${p.name} (${p.packageQty}${p.packageUnit} - ${Calculator.formatCurrency(p.packagePrice)})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="w-18">
        <input 
          type="number" 
          step="any" 
          min="0" 
          value="100" 
          class="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs font-bold text-center sc-ing-qty focus:ring-1 focus:ring-purple-400"
          oninput="RecipeScannerModule.recalculateVerificationSummary()"
        />
      </div>

      <div class="w-16">
        <select 
          class="w-full px-1.5 py-1 rounded-lg border border-gray-200 text-xs sc-ing-unit bg-white focus:ring-1 focus:ring-purple-400"
          onchange="RecipeScannerModule.recalculateVerificationSummary()"
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">L</option>
          <option value="u">u</option>
          <option value="tbsp">cda</option>
          <option value="tsp">cdta</option>
          <option value="cup">taza</option>
        </select>
      </div>

      <div class="w-20 text-right">
        <span class="text-xs font-bold text-gray-800 block sc-ing-cost">$ 0</span>
      </div>

      <button type="button" onclick="document.getElementById('${rowId}').remove(); RecipeScannerModule.recalculateVerificationSummary();" class="text-gray-300 hover:text-red-500 p-1">
        ✕
      </button>
    `;

    container.appendChild(row);
    this.recalculateVerificationSummary();
  },

  recalculateVerificationSummary() {
    const allPantry = DB.getIngredients();
    const pantryMap = new Map(allPantry.map(i => [i.id, i]));
    let total = 0;

    document.querySelectorAll('#scanned-ingredients-list > div').forEach(row => {
      const select = row.querySelector('.sc-ing-select');
      const qtyInput = row.querySelector('.sc-ing-qty');
      const unitSelect = row.querySelector('.sc-ing-unit');
      const costEl = row.querySelector('.sc-ing-cost');

      const ingId = select ? select.value : '';
      const qty = qtyInput ? parseFloat(qtyInput.value) || 0 : 0;
      const unit = unitSelect ? unitSelect.value : 'g';

      const ing = pantryMap.get(ingId);
      const cost = ing ? Calculator.getIngredientItemCost(ing, qty, unit) : 0;
      total += cost;

      if (costEl) costEl.textContent = Calculator.formatCurrency(cost);
    });

    const totalEl = document.getElementById('scanned-total-cost');
    if (totalEl) totalEl.textContent = Calculator.formatCurrency(total);
  },

  collectVerifiedData() {
    const nameInput = document.getElementById('scanned-rec-name');
    const yieldInput = document.getElementById('scanned-rec-yield');

    const name = nameInput ? nameInput.value.trim() : (this.scannedRecipe.name || 'Receta Escaneada');
    const yieldPortions = yieldInput ? parseInt(yieldInput.value) || 16 : 16;
    const yieldUnits = this.scannedRecipe.type === 'cake' ? 1 : yieldPortions;

    const ingredients = [];
    document.querySelectorAll('#scanned-ingredients-list > div').forEach(row => {
      const ingId = row.querySelector('.sc-ing-select')?.value;
      const qty = parseFloat(row.querySelector('.sc-ing-qty')?.value) || 0;
      const unit = row.querySelector('.sc-ing-unit')?.value || 'g';

      if (ingId && qty > 0) {
        ingredients.push({
          ingredientId: ingId,
          quantity: qty,
          unit: unit
        });
      }
    });

    return {
      name,
      category: this.scannedRecipe.category || 'Tortas',
      type: this.scannedRecipe.type || 'cake',
      yieldPortions,
      yieldUnits,
      unitName: this.scannedRecipe.type === 'cake' ? 'porción' : 'unidad',
      prepTimeMinutes: this.scannedRecipe.prepTimeMinutes || 45,
      bakeTimeMinutes: this.scannedRecipe.bakeTimeMinutes || 35,
      laborHours: 1.5,
      laborRatePerHour: DB.getSettings().defaultHourlyRate || 4000,
      overheadCost: 1500,
      suggestedMargin: DB.getSettings().defaultTargetMargin || 40,
      ingredients,
      packaging: [],
      notes: 'Ficha técnica creada automáticamente mediante escaneo de receta.'
    };
  },

  saveDirectly() {
    const data = this.collectVerifiedData();
    if (data.ingredients.length === 0) {
      alert('Debes vincular al menos un ingrediente con tu catálogo de insumos.');
      return;
    }

    const saved = DB.addRecipe(data);
    this.closeModal();
    RecipesModule.render();
    App.showToast(`🎉 ¡Ficha técnica "${saved.name}" guardada con éxito!`);
  },

  openInRecipeEditor() {
    const data = this.collectVerifiedData();
    this.closeModal();
    RecipesModule.openEditorWithData(data);
  }
};
