import { CONFIG } from './config.js';

export class QuoteBotEngine {
  constructor(firestoreService) {
    this.firestoreService = firestoreService;
  }

  /**
   * Procesa un mensaje entrante de WhatsApp y genera la respuesta inteligente
   */
  async processIncomingMessage({ uid, customerPhone, customerName, messageText }) {
    console.log(`[QuoteBotEngine] 📩 Mensaje entrante para user ${uid} de ${customerName || customerPhone}: "${messageText}"`);

    // 1. Obtener datos del catálogo y configuración del pastelero
    const userData = await this.firestoreService.getUserData(uid);
    const settings = userData.settings || {};
    const recipes = userData.recipes || [];
    const quotes = userData.quotes || [];

    const businessName = settings.businessName || 'Mi Pastelería';
    const depositPercent = settings.defaultDepositPercent || 50;
    const defaultNote = settings.quoteNote || `Para confirmar la fecha se solicita el ${depositPercent}% de abono. Saldo contra entrega.`;
    const businessPhone = settings.businessPhone || '';

    // Preparar catálogo de productos resumido para Gemini
    const catalogSummary = recipes.map(r => {
      // Determinar precio de venta sugerido
      let price = r.sellingPrice || r.suggestedBatchPrice || 0;
      if (!price && r.suggestedUnitPrice) {
        price = r.suggestedUnitPrice;
      }
      return {
        id: r.id,
        name: r.name,
        type: r.type || 'units', // 'cake' o 'units'
        portionsOrUnits: r.yieldPortions || r.yieldUnits || 1,
        price: price,
        pricePerPortion: r.type === 'cake' && r.yieldPortions ? Math.round(price / r.yieldPortions) : null,
        category: r.category || 'General',
        notes: r.notes || ''
      };
    });

    // Preparar resumen de cotizaciones previas recientes
    const recentQuotes = quotes.slice(0, 10).map(q => ({
      code: q.code,
      customerName: q.customerName,
      total: q.total,
      depositAmount: q.depositAmount,
      remainingBalance: q.remainingBalance,
      status: q.status,
      eventDate: q.eventDate,
      items: (q.items || []).map(i => `${i.quantity}x ${i.recipeName}`)
    }));

    // 2. Construir Prompt para Gemini
    const prompt = `
Eres la asistente virtual inteligente y cálida de la pastelería "${businessName}".
Tu objetivo es responder de forma cordial, impecable y profesional por WhatsApp a los clientes que solicitan información, cotizaciones de productos de repostería o consultan el estado de su pedido/folio.

--- CATÁLOGO DE PRODUCTOS DE LA PASTELERÍA ---
${JSON.stringify(catalogSummary, null, 2)}

--- POLÍTICAS DEL NEGOCIO ---
- Abono requerido para reserva de fecha: ${depositPercent}% del total.
- Saldo: se cancela al momento de la entrega o retiro.
- Nota / Condiciones generales: "${defaultNote}"
- Teléfono de contacto de la pastelería: "${businessPhone}"

--- COTIZACIONES PREVIAS REGISTRADAS ---
${JSON.stringify(recentQuotes, null, 2)}

--- MENSAJE RECIBIDO DEL CLIENTE ---
Cliente: "${customerName || 'Cliente'}" (Teléfono: ${customerPhone})
Mensaje: "${messageText}"

--- INSTRUCCIONES DE RESPUESTA ---
1. Analiza el mensaje del cliente:
   A) Si pide cotización de productos del catálogo (ej: "cuánto sale una torta para 20 personas", "precio de alfajores", etc.):
      - Identifica los productos más acordes a su solicitud.
      - Si pide una torta por número de porciones y en el catálogo hay tortas de distinto tamaño, ajusta proporcionalmente o sugiere la más adecuada.
      - Calcula los subtotales, el Total general, el Abono del ${depositPercent}% y el Saldo restante.
      - Estructura una respuesta en formato WhatsApp con emojis atractivos, viñetas claras y despedida cordial.
      - Genera los datos estructurados en "newQuoteData" para guardarla en el sistema.
   B) Si consulta por un folio de cotización previo (ej: "COT-001", "cómo va mi presupuesto"):
      - Busca en las cotizaciones previas y responde con el estado, total, saldo y fecha de entrega.
   C) Si saluda o hace una pregunta general (horarios, qué sabores tienen):
      - Responde amablemente mencionando las opciones disponibles en el catálogo de "${businessName}".
   D) Si solicita un producto que NO está en el catálogo:
      - Explica amablemente los productos que sí elaboran actualmente y ofrece la opción más similar o pide detalles específicos para una consulta personalizada.

--- FORMATO ESTRICTO DE SALIDA ---
Devuelve estrictamente un objeto JSON con la siguiente estructura (sin texto adicional fuera del JSON):
{
  "intent": "quote_request" | "quote_lookup" | "general_inquiry" | "unknown",
  "replyMessage": "Texto formateado en WhatsApp con negritas (*texto*), viñetas y emojis listo para enviar",
  "shouldCreateQuote": true o false,
  "newQuoteData": {
    "customerName": "${customerName || 'Cliente WhatsApp'}",
    "customerPhone": "${customerPhone}",
    "eventName": "Motivo o tipo de pedido inferido",
    "eventDate": "",
    "status": "sent",
    "items": [
      {
        "recipeId": "id_del_catalogo_o_custom",
        "recipeName": "Nombre del producto",
        "quantity": 1,
        "unitPrice": 15000,
        "subtotal": 15000
      }
    ],
    "subtotal": 15000,
    "discountPercent": 0,
    "discountAmount": 0,
    "total": 15000,
    "depositPercent": ${depositPercent},
    "depositAmount": 7500,
    "remainingBalance": 7500,
    "deliveryOption": "Retiro en taller",
    "notes": "${defaultNote}"
  }
}
`;

    try {
      // 3. Llamar a la API de Google Gemini
      const geminiApiKey = settings.geminiApiKey || CONFIG.GEMINI_API_KEY;
      const model = CONFIG.GEMINI_MODEL;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: "application/json"
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[QuoteBotEngine] Error llamando a Gemini (${res.status}):`, errText);
        // Respuesta de respaldo si falla Gemini
        return {
          replyMessage: `¡Hola ${customerName || ''}! 👋 Gracias por comunicarte con *${businessName}* 🧁. Hemos recibido tu mensaje y en breve te atenderemos personalmente con todos los detalles de tu cotización. ¡Muchas gracias por tu preferencia! ✨`,
          savedQuote: null
        };
      }

      const data = await res.json();
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) {
        throw new Error('Gemini no retornó contenido');
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(contentText);
      } catch (e) {
        const cleaned = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedResult = JSON.parse(cleaned);
      }

      let savedQuote = null;

      // 4. Si se generó una nueva cotización y el usuario tiene activado guardar automáticamente
      if (parsedResult.shouldCreateQuote && parsedResult.newQuoteData && parsedResult.newQuoteData.items?.length > 0) {
        const quoteCode = 'COT-' + String(quotes.length + 1).padStart(3, '0');
        const quoteToSave = {
          id: 'quote_wa_' + Date.now(),
          code: quoteCode,
          createdAt: new Date().toISOString(),
          source: 'whatsapp_bot',
          ...parsedResult.newQuoteData
        };

        const saved = await this.firestoreService.saveGeneratedQuote(uid, quoteToSave);
        if (saved) {
          savedQuote = quoteToSave;
        }
      }

      return {
        replyMessage: parsedResult.replyMessage,
        intent: parsedResult.intent,
        savedQuote: savedQuote
      };

    } catch (error) {
      console.error('[QuoteBotEngine] Excepción procesando mensaje:', error);
      return {
        replyMessage: `¡Hola! 👋 Gracias por escribir a *${businessName}* 🎂. En este momento estamos revisando tu solicitud y te enviaremos la cotización detallada a la brevedad. ¡Que tengas un excelente día! ✨`,
        savedQuote: null
      };
    }
  }
}
