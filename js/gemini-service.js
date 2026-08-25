// ==========================================
// Cakekulator - Servicio de IA con Google Gemini
// ==========================================

const GeminiService = {
  // Clave global por defecto proporcionada para todos los usuarios
  _OBF_KEY: 'QVEuQWI4Uk42SVdzaS1FYUpDbXZ2T2dFekZYbEJuc3VmWlpvckRTNGhNbnBQNUk3ZU9qSWc=',
  DEFAULT_API_KEY: '',

  getApiKey() {
    // 1. Clave en archivo de configuración local (si existe)
    if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.GEMINI_API_KEY) {
      return window.APP_CONFIG.GEMINI_API_KEY.trim();
    }
    // 2. Clave guardada personalizada por el usuario en configuración o localStorage
    const settings = DB.getSettings();
    const userKey = settings.geminiApiKey || localStorage.getItem('cakekulator_gemini_api_key');
    if (userKey && userKey.trim() !== '') {
      return userKey.trim();
    }
    // 3. Clave global integrada de la aplicación
    if (this.DEFAULT_API_KEY && this.DEFAULT_API_KEY.trim() !== '') {
      return this.DEFAULT_API_KEY.trim();
    }
    if (this._OBF_KEY) {
      try {
        return atob(this._OBF_KEY).trim();
      } catch (e) {
        return '';
      }
    }
    return '';
  },

  setApiKey(key) {
    const cleanKey = (key || '').trim();
    const settings = DB.getSettings();
    settings.geminiApiKey = cleanKey;
    DB.saveSettings(settings);
    localStorage.setItem('cakekulator_gemini_api_key', cleanKey);

    // Si hay usuario logueado en Firebase, garantizar respaldo inmediato en Firestore
    if (typeof FirebaseService !== 'undefined' && FirebaseService.isConfigured && typeof AuthModule !== 'undefined' && AuthModule.currentUser) {
      DB.syncDocumentToCloud('settings', settings);
    }
  },

  hasApiKey() {
    return !!this.getApiKey();
  },

  // Modal para solicitar la API Key de Gemini
  promptApiKeyModal(onSuccessCallback) {
    let modal = document.getElementById('gemini-key-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gemini-key-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    const currentKey = this.getApiKey();

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-md">
              ✨
            </div>
            <div>
              <h3 class="font-bold text-gray-900 text-base">Configurar Google Gemini IA</h3>
              <p class="text-xs text-gray-400">Escaneo inteligente con visión artificial</p>
            </div>
          </div>
          <button onclick="GeminiService.closeKeyModal()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition">✕</button>
        </div>

        <div class="space-y-4 text-xs text-gray-600">
          <p>Para escanear boletas y recetas con máxima precisión mediante <b>Google Gemini AI</b>, necesitas una API Key gratuita de Google AI Studio.</p>
          
          <div class="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 text-purple-800 space-y-1">
            <p class="font-bold flex items-center gap-1.5"><span>💡</span> ¿Cómo obtener tu clave gratis?</p>
            <ol class="list-decimal list-inside space-y-0.5 text-[11px] text-purple-700">
              <li>Entra a <a href="https://aistudio.google.com/app/apikey" target="_blank" class="underline font-bold hover:text-purple-900">Google AI Studio (Click aquí)</a>.</li>
              <li>Inicia sesión con tu cuenta de Google.</li>
              <li>Haz clic en <b>"Create API Key"</b> y cópiala aquí.</li>
            </ol>
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1.5">Tu Gemini API Key:</label>
            <input type="password" id="gemini-api-key-input" value="${currentKey}" placeholder="AIzaSy..." class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50/50 font-mono text-xs">
          </div>

          <div class="flex gap-2 pt-2">
            <button onclick="GeminiService.closeKeyModal()" class="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onclick="GeminiService.saveKeyFromModal()" class="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:opacity-90 transition">
              Guardar Clave
            </button>
          </div>
        </div>
      </div>
    `;

    window._geminiKeySuccessCallback = onSuccessCallback;
    modal.classList.remove('hidden');
  },

  closeKeyModal() {
    const modal = document.getElementById('gemini-key-modal');
    if (modal) modal.classList.add('hidden');
  },

  saveKeyFromModal() {
    const input = document.getElementById('gemini-api-key-input');
    const key = input ? input.value.trim() : '';
    if (!key) {
      alert('Por favor ingresa una API Key válida.');
      return;
    }
    this.setApiKey(key);
    this.closeKeyModal();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('✨ Clave de Gemini IA guardada');
    }
    if (window._geminiKeySuccessCallback) {
      window._geminiKeySuccessCallback();
      window._geminiKeySuccessCallback = null;
    }
  },

  // Convierte un archivo File/Blob o dataURL en base64 limpio y su MIME type
  async fileToBase64(fileOrDataUrl) {
    if (typeof fileOrDataUrl === 'string') {
      const match = fileOrDataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        return { mimeType: match[1], base64Data: match[2] };
      }
      return { mimeType: 'image/jpeg', base64Data: fileOrDataUrl };
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const match = result.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          resolve({ mimeType: match[1], base64Data: match[2] });
        } else {
          resolve({ mimeType: fileOrDataUrl.type || 'image/jpeg', base64Data: result });
        }
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(fileOrDataUrl);
    });
  },

  // Llamada genérica a Gemini 1.5 Flash / 2.0 Flash con visión o texto
  async generateContent({ prompt, image, jsonSchema = null }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    // Usar gemini-2.5-flash o gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`;

    const parts = [];

    if (image) {
      const { mimeType, base64Data } = await this.fileToBase64(image);
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `Error del servidor de Gemini (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini no devolvió contenido.');
    }

    try {
      return JSON.parse(candidateText);
    } catch (e) {
      // Limpiar backticks por si acaso
      const cleaned = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  },

  // Escanear Boleta con Gemini
  async analyzeReceipt(imageOrText) {
    const isImage = typeof imageOrText !== 'string' || imageOrText.startsWith('data:');

    const prompt = `
Eres un asistente experto para una pastelería artesanal chilena/latinoamericana.
Analiza la siguiente boleta, factura o ticket de compra de insumos de supermercado o tienda de repostería.
Extrae TODOS los productos comprados (ignora subtotales, totales, vueltos, IVA, fecha, etc).

Para cada producto extrae:
- name: Nombre claro y descriptivo del producto (ej: "Harina Selecta Sin Polvos", "Mantequilla Soprole con Sal", "Huevos Extra").
- packageQty: Cantidad del envase según el texto o estimación (ej: si dice 1kg -> 1000, 500g -> 500, 30 un -> 30, 1 L -> 1000, 1 unidad -> 1). Número flotante.
- packageUnit: Unidad de medida estandarizada ("g", "kg", "ml", "l", "u"). (Para sólidos usa g o kg, líquidos ml o l, huevos o bandejas usa u).
- packagePrice: Precio pagado en total por ese ítem (número entero o decimal en moneda local sin símbolos).
- category: Categoría sugerida entre ["Secos", "Lácteos y Grasas", "Huevos", "Chocolates y Coberturas", "Frutas y Rellenos", "Esencias y Colorantes", "Empaques", "Otros"].

Devuelve estrictamente un arreglo JSON con el siguiente formato:
[
  {
    "name": "Harina Selecta",
    "packageQty": 1000,
    "packageUnit": "g",
    "packagePrice": 1490,
    "category": "Secos"
  }
]
`;

    if (isImage) {
      return await this.generateContent({ prompt, image: imageOrText });
    } else {
      return await this.generateContent({ prompt: `${prompt}\n\nTexto de la boleta:\n${imageOrText}` });
    }
  },

  // Escanear Receta con Gemini
  async analyzeRecipe(imageOrText) {
    const isImage = typeof imageOrText !== 'string' || imageOrText.startsWith('data:');

    const prompt = `
Eres un chef pastelero experto y asistente de costos.
Analiza la imagen o texto de la receta adjunta.
Extrae la información estructurada de la receta.

Devuelve estrictamente un objeto JSON con el siguiente esquema:
{
  "name": "Nombre de la Receta (ej: Torta Selva Negra)",
  "category": "Categoría (Tortas, Alfajores, Galletas, Cupcakes, Tartaletas, Postres, Panadería)",
  "type": "cake" o "units" (usa "cake" si es una torta/kuchen completo, "units" si se vende por unidades como alfajores o galletas),
  "servings": Número de porciones o unidades que rinde la receta (ej: 15 para torta de 15 porciones o 24 para 24 alfajores),
  "prepTimeMin": Tiempo de preparación en minutos estimado,
  "bakeTimeMin": Tiempo de horneado en minutos estimado,
  "notes": "Instrucciones breves o notas relevantes",
  "ingredients": [
    {
      "name": "Nombre del ingrediente (ej: Harina sin polvos, Azúcar, Huevos)",
      "quantity": Cantidad requerida numérica (ej: 250, 4, 150),
      "unit": "g" o "kg" o "ml" o "l" o "u" o "cda" o "cdta" o "taza"
    }
  ]
}
`;

    if (isImage) {
      return await this.generateContent({ prompt, image: imageOrText });
    } else {
      return await this.generateContent({ prompt: `${prompt}\n\nTexto de la receta:\n${imageOrText}` });
    }
  }
};
