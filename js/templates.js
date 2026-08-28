// ==========================================
// Cakekulator - Plantillas de Datos Iniciales
// ==========================================

const DEFAULT_SETTINGS = {
  currencySymbol: '$',
  currencyCode: 'CLP',
  defaultHourlyRate: 4000,
  defaultTargetMargin: 40,
  defaultPaymentCommission: 3.19, // Transbank / POS común
  businessName: 'Mi Pastelería Artesanal',
  businessPhone: '+56 9 1234 5678',
  businessEmail: 'contacto@mipasteleria.cl',
  businessInstagram: '@mipasteleria',
  logoUrl: '',
  quoteNote: 'Presupuesto válido por 15 días. Para reservar se solicita abono del 50%.',
  defaultDepositPercent: 50
};

const DEFAULT_INGREDIENTS = [
  // Harinas y Secos
  { id: 'ing_1', name: 'Harina sin polvos', category: 'Secos', packageQty: 1000, packageUnit: 'g', packagePrice: 1200, yieldWastePercent: 0 },
  { id: 'ing_2', name: 'Harina con polvos', category: 'Secos', packageQty: 1000, packageUnit: 'g', packagePrice: 1350, yieldWastePercent: 0 },
  { id: 'ing_3', name: 'Azúcar granulada', category: 'Secos', packageQty: 1000, packageUnit: 'g', packagePrice: 1100, yieldWastePercent: 0 },
  { id: 'ing_4', name: 'Azúcar flor / glas', category: 'Secos', packageQty: 1000, packageUnit: 'g', packagePrice: 1800, yieldWastePercent: 0 },
  { id: 'ing_5', name: 'Maicena / Fécula de maíz', category: 'Secos', packageQty: 500, packageUnit: 'g', packagePrice: 1600, yieldWastePercent: 0 },
  { id: 'ing_6', name: 'Cacao amargo en polvo', category: 'Secos', packageQty: 250, packageUnit: 'g', packagePrice: 3100, yieldWastePercent: 0 },
  { id: 'ing_7', name: 'Polvos de hornear', category: 'Secos', packageQty: 100, packageUnit: 'g', packagePrice: 990, yieldWastePercent: 0 },
  { id: 'ing_8', name: 'Bicarbonato de sodio', category: 'Secos', packageQty: 100, packageUnit: 'g', packagePrice: 850, yieldWastePercent: 0 },
  { id: 'ing_9', name: 'Sal fina', category: 'Secos', packageQty: 1000, packageUnit: 'g', packagePrice: 700, yieldWastePercent: 0 },
  
  // Lácteos y Grasas
  { id: 'ing_10', name: 'Mantequilla sin sal', category: 'Lácteos y Grasas', packageQty: 250, packageUnit: 'g', packagePrice: 2500, yieldWastePercent: 0 },
  { id: 'ing_11', name: 'Margarina repostería', category: 'Lácteos y Grasas', packageQty: 1000, packageUnit: 'g', packagePrice: 3200, yieldWastePercent: 0 },
  { id: 'ing_12', name: 'Huevos (Bandeja 30u)', category: 'Huevos', packageQty: 30, packageUnit: 'u', packagePrice: 6500, yieldWastePercent: 0 },
  { id: 'ing_13', name: 'Leche entera', category: 'Lácteos y Grasas', packageQty: 1000, packageUnit: 'ml', packagePrice: 1050, yieldWastePercent: 0 },
  { id: 'ing_14', name: 'Crema para batir (35% grasa)', category: 'Lácteos y Grasas', packageQty: 1000, packageUnit: 'ml', packagePrice: 4600, yieldWastePercent: 0 },
  { id: 'ing_15', name: 'Queso crema (Cream Cheese)', category: 'Lácteos y Grasas', packageQty: 227, packageUnit: 'g', packagePrice: 2600, yieldWastePercent: 0 },
  { id: 'ing_16', name: 'Leche condensada', category: 'Lácteos y Grasas', packageQty: 397, packageUnit: 'g', packagePrice: 1650, yieldWastePercent: 0 },
  { id: 'ing_17', name: 'Aceite vegetal', category: 'Lácteos y Grasas', packageQty: 1000, packageUnit: 'ml', packagePrice: 2200, yieldWastePercent: 0 },

  // Rellenos, Chocolates y Coberturas
  { id: 'ing_18', name: 'Manjar / Dulce de leche repostero', category: 'Rellenos', packageQty: 1000, packageUnit: 'g', packagePrice: 3800, yieldWastePercent: 0 },
  { id: 'ing_19', name: 'Cobertura chocolate semiamargo', category: 'Chocolates', packageQty: 1000, packageUnit: 'g', packagePrice: 6900, yieldWastePercent: 0 },
  { id: 'ing_20', name: 'Cobertura chocolate blanco', category: 'Chocolates', packageQty: 1000, packageUnit: 'g', packagePrice: 7200, yieldWastePercent: 0 },
  { id: 'ing_21', name: 'Chips de chocolate horneables', category: 'Chocolates', packageQty: 500, packageUnit: 'g', packagePrice: 3900, yieldWastePercent: 0 },
  { id: 'ing_22', name: 'Nutella / Crema de avellanas', category: 'Rellenos', packageQty: 750, packageUnit: 'g', packagePrice: 7500, yieldWastePercent: 0 },
  { id: 'ing_23', name: 'Coco rallado', category: 'Decoración', packageQty: 200, packageUnit: 'g', packagePrice: 1400, yieldWastePercent: 0 },
  { id: 'ing_24', name: 'Esencia de Vainilla', category: 'Esencias', packageQty: 100, packageUnit: 'ml', packagePrice: 1200, yieldWastePercent: 0 },
  { id: 'ing_25', name: 'Frutillas / Fresas frescas', category: 'Frutas', packageQty: 1000, packageUnit: 'g', packagePrice: 3500, yieldWastePercent: 10 },

  // Empaque y Presentación
  { id: 'ing_26', name: 'Caja para torta (25x25cm)', category: 'Empaque', packageQty: 1, packageUnit: 'u', packagePrice: 1200, yieldWastePercent: 0 },
  { id: 'ing_27', name: 'Base de cartón dorada para torta', category: 'Empaque', packageQty: 1, packageUnit: 'u', packagePrice: 850, yieldWastePercent: 0 },
  { id: 'ing_28', name: 'Caja con visor para 6 cupcakes', category: 'Empaque', packageQty: 1, packageUnit: 'u', packagePrice: 900, yieldWastePercent: 0 },
  { id: 'ing_29', name: 'Bolsitas celofán para galletas/alfajores', category: 'Empaque', packageQty: 100, packageUnit: 'u', packagePrice: 2500, yieldWastePercent: 0 },
  { id: 'ing_30', name: 'Pirotines / Cápsulas para cupcakes', category: 'Empaque', packageQty: 100, packageUnit: 'u', packagePrice: 1800, yieldWastePercent: 0 },
  { id: 'ing_31', name: 'Cinta de raso y sticker con logo', category: 'Empaque', packageQty: 1, packageUnit: 'u', packagePrice: 150, yieldWastePercent: 0 }
];

const DEFAULT_RECIPES = [
  {
    id: 'rec_1',
    name: 'Alfajores de Maicena Tradicionales',
    category: 'Alfajores',
    type: 'units', // 'units' | 'cake'
    yieldUnits: 24, // 24 alfajores
    yieldPortions: 24,
    unitName: 'alfajor',
    description: 'Deliciosos alfajores de maicena rellenos de manjar artesanal y rodados en coco rallado.',
    prepTimeMinutes: 60,
    bakeTimeMinutes: 20,
    laborHours: 1.5, // 1h 30m
    laborRatePerHour: 4000,
    overheadCost: 1200, // Gas, luz, agua
    suggestedMargin: 45, // 45% margen
    ingredients: [
      { ingredientId: 'ing_1', quantity: 150, unit: 'g' },   // Harina sin polvos
      { ingredientId: 'ing_5', quantity: 200, unit: 'g' },   // Maicena
      { ingredientId: 'ing_10', quantity: 150, unit: 'g' },  // Mantequilla
      { ingredientId: 'ing_4', quantity: 100, unit: 'g' },   // Azúcar flor
      { ingredientId: 'ing_12', quantity: 2, unit: 'u' },     // Huevos (yemas)
      { ingredientId: 'ing_7', quantity: 10, unit: 'g' },    // Polvos de hornear
      { ingredientId: 'ing_24', quantity: 5, unit: 'ml' },   // Vainilla
      { ingredientId: 'ing_18', quantity: 400, unit: 'g' },  // Manjar
      { ingredientId: 'ing_23', quantity: 60, unit: 'g' }    // Coco rallado
    ],
    packaging: [
      { ingredientId: 'ing_29', quantity: 24, unit: 'u' },   // 24 bolsitas
      { ingredientId: 'ing_31', quantity: 24, unit: 'u' }    // 24 stickers/cintas
    ],
    notes: 'Temperatura de horneado a 160°C por 10 a 12 min. No dorar.'
  },
  {
    id: 'rec_2',
    name: 'Profiteroles con Chantilly y Cobertura',
    category: 'Profiteroles',
    type: 'units',
    yieldUnits: 30, // 30 profiteroles
    yieldPortions: 30,
    unitName: 'profiterol',
    description: 'Masa choux aireada rellena con crema chantilly de vainilla y bañados con ganache de chocolate.',
    prepTimeMinutes: 75,
    bakeTimeMinutes: 30,
    laborHours: 1.75,
    laborRatePerHour: 4000,
    overheadCost: 1500,
    suggestedMargin: 50,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 150, unit: 'g' },   // Harina
      { ingredientId: 'ing_10', quantity: 100, unit: 'g' },  // Mantequilla
      { ingredientId: 'ing_13', quantity: 250, unit: 'ml' }, // Leche
      { ingredientId: 'ing_12', quantity: 4, unit: 'u' },    // Huevos
      { ingredientId: 'ing_3', quantity: 10, unit: 'g' },    // Azúcar
      { ingredientId: 'ing_9', quantity: 3, unit: 'g' },     // Sal
      { ingredientId: 'ing_14', quantity: 450, unit: 'ml' }, // Crema para batir
      { ingredientId: 'ing_4', quantity: 70, unit: 'g' },    // Azúcar flor
      { ingredientId: 'ing_24', quantity: 5, unit: 'ml' },   // Vainilla
      { ingredientId: 'ing_19', quantity: 180, unit: 'g' }   // Chocolate semiamargo
    ],
    packaging: [
      { ingredientId: 'ing_26', quantity: 1, unit: 'u' },   // 1 Caja grande de presentación
      { ingredientId: 'ing_31', quantity: 1, unit: 'u' }    // Cinta y logo
    ],
    notes: 'Hornear a 200°C por 15 min y luego bajar a 180°C por 15 min sin abrir el horno.'
  },
  {
    id: 'rec_3',
    name: 'Galletas Clásicas con Chispas de Chocolate',
    category: 'Galletas',
    type: 'units',
    yieldUnits: 20, // 20 galletas grandes
    yieldPortions: 20,
    unitName: 'galleta',
    description: 'Galletas estilo americano crujientes por fuera y suaves por dentro con chispas de chocolate.',
    prepTimeMinutes: 45,
    bakeTimeMinutes: 15,
    laborHours: 1.0,
    laborRatePerHour: 4000,
    overheadCost: 1000,
    suggestedMargin: 45,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 280, unit: 'g' },   // Harina
      { ingredientId: 'ing_10', quantity: 170, unit: 'g' },  // Mantequilla
      { ingredientId: 'ing_3', quantity: 160, unit: 'g' },   // Azúcar
      { ingredientId: 'ing_12', quantity: 1, unit: 'u' },    // Huevo
      { ingredientId: 'ing_21', quantity: 200, unit: 'g' },  // Chips de chocolate
      { ingredientId: 'ing_24', quantity: 5, unit: 'ml' },   // Vainilla
      { ingredientId: 'ing_7', quantity: 6, unit: 'g' },     // Polvos
      { ingredientId: 'ing_9', quantity: 3, unit: 'g' }      // Sal
    ],
    packaging: [
      { ingredientId: 'ing_29', quantity: 20, unit: 'u' },  // 20 bolsitas celofán
      { ingredientId: 'ing_31', quantity: 20, unit: 'u' }   // 20 stickers
    ],
    notes: 'Refrigerar la masa 30 minutos antes de formar bolitas y hornear a 180°C por 12-14 min.'
  },
  {
    id: 'rec_4',
    name: 'Torta Húmeda de Chocolate (16 Porciones)',
    category: 'Tortas',
    type: 'cake',
    yieldUnits: 1, // 1 Torta
    yieldPortions: 16, // 16 Porciones
    unitName: 'torta (16 porciones)',
    description: 'Bizcochuelo húmedo de cacao relleno de manjar y crema de chocolate con cobertura de ganache.',
    prepTimeMinutes: 120,
    bakeTimeMinutes: 45,
    laborHours: 3.0,
    laborRatePerHour: 4000,
    overheadCost: 2500,
    suggestedMargin: 45,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 300, unit: 'g' },   // Harina
      { ingredientId: 'ing_6', quantity: 90, unit: 'g' },    // Cacao amargo
      { ingredientId: 'ing_3', quantity: 350, unit: 'g' },   // Azúcar
      { ingredientId: 'ing_12', quantity: 3, unit: 'u' },    // Huevos
      { ingredientId: 'ing_13', quantity: 250, unit: 'ml' }, // Leche
      { ingredientId: 'ing_17', quantity: 120, unit: 'ml' }, // Aceite
      { ingredientId: 'ing_7', quantity: 12, unit: 'g' },    // Polvos
      { ingredientId: 'ing_24', quantity: 10, unit: 'ml' },  // Vainilla
      { ingredientId: 'ing_18', quantity: 350, unit: 'g' },  // Manjar relleno
      { ingredientId: 'ing_14', quantity: 400, unit: 'ml' }, // Crema para ganache
      { ingredientId: 'ing_19', quantity: 400, unit: 'g' },  // Cobertura semiamargo
      { ingredientId: 'ing_25', quantity: 200, unit: 'g' }   // Frutillas decoración
    ],
    packaging: [
      { ingredientId: 'ing_26', quantity: 1, unit: 'u' },   // Caja para torta
      { ingredientId: 'ing_27', quantity: 1, unit: 'u' },   // Base dorada
      { ingredientId: 'ing_31', quantity: 1, unit: 'u' }    // Cinta y logo
    ],
    notes: 'Diámetro de molde 20-22cm en 3 capas. Mantener refrigerada.'
  },
  {
    id: 'rec_5',
    name: 'Cupcakes de Vainilla con Frosting de Queso Crema',
    category: 'Cupcakes',
    type: 'units',
    yieldUnits: 12, // 12 Cupcakes
    yieldPortions: 12,
    unitName: 'cupcake',
    description: 'Bizcochitos esponjosos aromatizados con vainilla natural coronados con frosting cremoso.',
    prepTimeMinutes: 60,
    bakeTimeMinutes: 20,
    laborHours: 1.5,
    laborRatePerHour: 4000,
    overheadCost: 1200,
    suggestedMargin: 45,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 200, unit: 'g' },   // Harina
      { ingredientId: 'ing_10', quantity: 120, unit: 'g' },  // Mantequilla masa
      { ingredientId: 'ing_3', quantity: 180, unit: 'g' },   // Azúcar
      { ingredientId: 'ing_12', quantity: 2, unit: 'u' },    // Huevos
      { ingredientId: 'ing_13', quantity: 120, unit: 'ml' }, // Leche
      { ingredientId: 'ing_7', quantity: 8, unit: 'g' },     // Polvos
      { ingredientId: 'ing_24', quantity: 10, unit: 'ml' },  // Vainilla
      { ingredientId: 'ing_15', quantity: 227, unit: 'g' },  // Queso crema frosting
      { ingredientId: 'ing_10', quantity: 100, unit: 'g' },  // Mantequilla frosting
      { ingredientId: 'ing_4', quantity: 200, unit: 'g' }    // Azúcar flor frosting
    ],
    packaging: [
      { ingredientId: 'ing_30', quantity: 12, unit: 'u' },  // 12 pirotines
      { ingredientId: 'ing_28', quantity: 2, unit: 'u' },   // 2 cajas de 6 cupcakes
      { ingredientId: 'ing_31', quantity: 2, unit: 'u' }    // 2 stickers/cintas
    ],
    notes: 'Hornear a 175°C por 18-20 min. Dejar enfriar completamente antes de decorar.'
  }
];

const DEFAULT_QUOTES = [
  {
    id: 'quote_1',
    code: 'COT-001',
    customerName: 'Camila González',
    customerPhone: '+56 9 8765 4321',
    eventDate: '2026-09-15',
    eventName: 'Cumpleaños Infantil',
    createdAt: new Date().toISOString(),
    status: 'sent', // 'draft' | 'sent' | 'approved' | 'rejected'
    items: [
      { recipeId: 'rec_4', recipeName: 'Torta Húmeda de Chocolate (16 Porciones)', quantity: 1, unitPrice: 32000, subtotal: 32000 },
      { recipeId: 'rec_1', recipeName: 'Alfajores de Maicena Tradicionales (x12)', quantity: 2, unitPrice: 12000, subtotal: 24000 },
      { recipeId: 'rec_5', recipeName: 'Cupcakes de Vainilla con Frosting (x6)', quantity: 2, unitPrice: 11000, subtotal: 22000 }
    ],
    subtotal: 78000,
    discountPercent: 5,
    discountAmount: 3900,
    total: 74100,
    depositPercent: 50,
    depositAmount: 37050,
    remainingBalance: 37050,
    deliveryOption: 'Retiro en taller',
    notes: 'Decoración temática colores pastel. Entregar a las 11:00 AM.'
  }
];

const DEFAULT_MARKET_STORES = [
  // --- PRINCIPALES SUPERMERCADOS EN CHILE ---
  {
    id: 'store_lider',
    name: 'Líder',
    category: 'Supermercados',
    icon: '🛒',
    description: 'Gran presencia nacional y precios bajos.',
    portalUrl: 'https://www.lider.cl/supermercado',
    searchUrl: 'https://www.lider.cl/supermercado/search?query=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_jumbo',
    name: 'Jumbo',
    category: 'Supermercados',
    icon: '🐘',
    description: 'Excelente variedad de productos gourmet y repostería fina.',
    portalUrl: 'https://www.jumbo.cl',
    searchUrl: 'https://www.jumbo.cl/busca?ft=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_tottus',
    name: 'Tottus',
    category: 'Supermercados',
    icon: '🟢',
    description: 'Oferta equilibrada en pasillos de repostería y abarrotes.',
    portalUrl: 'https://www.tottus.cl',
    searchUrl: 'https://www.tottus.cl/tottus-cl/search?Ntt=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_unimarc',
    name: 'Unimarc',
    category: 'Supermercados',
    icon: '🔴',
    description: 'Cobertura amplia en barrios y regiones.',
    portalUrl: 'https://www.unimarc.cl',
    searchUrl: 'https://www.unimarc.cl/search?q=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_santaisabel',
    name: 'Santa Isabel',
    category: 'Supermercados',
    icon: '🏪',
    description: 'Alternativa económica y accesible de Cencosud.',
    portalUrl: 'https://www.santaisabel.cl',
    searchUrl: 'https://www.santaisabel.cl/busca?ft=',
    enabled: true,
    isDefault: true
  },

  // --- TIENDAS Y DISTRIBUIDORAS DE INSUMOS DE PASTELERÍA ---
  {
    id: 'store_clubrepostero',
    name: 'Club Repostero',
    category: 'Distribuidoras de Pastelería',
    icon: '🎂',
    description: 'Especialistas en moldes, chocolates, fondant y colorantes.',
    portalUrl: 'https://clubrepostero.cl/',
    searchUrl: 'https://clubrepostero.cl/?s=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_laoferta',
    name: 'La Oferta',
    category: 'Distribuidoras de Pastelería',
    icon: '🏷️',
    description: 'Múltiples sucursales en Santiago (La Florida, Cerrillos) con gran variedad.',
    portalUrl: 'https://laoferta.cl/',
    searchUrl: 'https://laoferta.cl/?s=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_centroabasto',
    name: 'Centro Abasto',
    category: 'Distribuidoras de Pastelería',
    icon: '🏢',
    description: 'Venta de cremas para batir, coberturas y premezclas.',
    portalUrl: 'https://centroabasto.cl/',
    searchUrl: 'https://centroabasto.cl/?s=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_franklin',
    name: 'Distribuidoras Franklin',
    category: 'Distribuidoras de Pastelería',
    icon: '📦',
    description: 'Insumos por mayor y detalle en el centro de Santiago.',
    portalUrl: 'https://distribuidorasfranklin.com/',
    searchUrl: 'https://distribuidorasfranklin.com/?s=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_leehebo',
    name: 'Leehebo Oficial',
    category: 'Distribuidoras de Pastelería',
    icon: '🎀',
    description: 'Proveedor muy concurrido en Meiggs y La Vega para moldes, cajas y bases.',
    portalUrl: 'https://leehebo.cl/',
    searchUrl: 'https://leehebo.cl/?s=',
    enabled: true,
    isDefault: true
  },
  {
    id: 'store_duce',
    name: 'Repostería Duce',
    category: 'Distribuidoras de Pastelería',
    icon: '🧁',
    description: 'Proveedor en sector de Meiggs y La Vega para moldes, cajas y bases.',
    portalUrl: 'https://www.instagram.com/reposteriaduce/',
    searchUrl: 'https://www.google.com/search?q=reposteria+duce+chile+',
    enabled: true,
    isDefault: true
  }
];

const DEFAULT_CUSTOMERS = [
  {
    id: 'cust_1',
    name: 'Camila González',
    phone: '+56 9 8765 4321',
    email: 'camila.gonzalez@gmail.com',
    address: 'Av. Las Condes 1024, Depto 402, Las Condes',
    isFavorite: true,
    notes: 'Prefiere tortas húmedas de chocolate y temáticas infantiles. Hija alérgica al maní.',
    createdAt: new Date().toISOString(),
    specialDates: [
      {
        id: 'sd_1',
        type: 'child_birthday',
        title: 'Cumpleaños de Sofía (Hija)',
        day: 15,
        month: 9,
        year: 2021,
        advanceNoticeDays: 15,
        notes: 'Le encantan las tortas temáticas con figuritas de azúcar.'
      },
      {
        id: 'sd_2',
        type: 'anniversary',
        title: 'Aniversario de Matrimonio',
        day: 28,
        month: 11,
        year: 2019,
        advanceNoticeDays: 7,
        notes: 'Suele pedir cajas de alfajores finos y macarons.'
      }
    ],
    purchases: [
      {
        id: 'pur_1',
        quoteId: 'quote_1',
        date: '2026-09-15',
        occasion: 'Cumpleaños Infantil 5 Años',
        items: 'Torta Húmeda de Chocolate (16 Porciones) + 24 Alfajores + 12 Cupcakes',
        total: 74100,
        status: 'completed',
        notes: 'Cliente muy satisfecha, felicitó la suavidad de la crema.'
      }
    ]
  },
  {
    id: 'cust_2',
    name: 'Matías Silva',
    phone: '+56 9 9123 4567',
    email: 'matias.silva.val@gmail.com',
    address: 'Calle Los Alerces 450, Providencia',
    isFavorite: true,
    notes: 'Fanático de los profiteroles y postres individuales. Pide habitualmente para eventos de oficina.',
    createdAt: new Date().toISOString(),
    specialDates: [
      {
        id: 'sd_3',
        type: 'birthday',
        title: 'Cumpleaños de Matías',
        day: 10,
        month: 9,
        year: 1990,
        advanceNoticeDays: 7,
        notes: 'Le gusta festejar con torres de profiteroles y ganache.'
      }
    ],
    purchases: [
      {
        id: 'pur_2',
        quoteId: null,
        date: '2026-07-20',
        occasion: 'Reunión de Equipo Corporativa',
        items: '60 Profiteroles con Chantilly y Cobertura',
        total: 58000,
        status: 'completed',
        notes: 'Pago puntual por transferencia.'
      }
    ]
  },
  {
    id: 'cust_3',
    name: 'Valentina Morales',
    phone: '+56 9 7654 3210',
    email: 'vale.morales.pasteleria@outlook.com',
    address: 'Pasaje El Roble 12, Ñuñoa',
    isFavorite: false,
    notes: 'Pide postres sin azúcar refinada cuando es posible. Muy detallista con la puntualidad.',
    createdAt: new Date().toISOString(),
    specialDates: [
      {
        id: 'sd_4',
        type: 'birthday',
        title: 'Cumpleaños de Valentina',
        day: 5,
        month: 10,
        year: 1994,
        advanceNoticeDays: 10,
        notes: 'Prefiere sabores frutales como frambuesa y maracuyá.'
      }
    ],
    purchases: [
      {
        id: 'pur_3',
        quoteId: null,
        date: '2026-06-12',
        occasion: 'Día de la Madre Familiar',
        items: '1 Torta de Frutilla y Crema (12 Porciones)',
        total: 28000,
        status: 'completed',
        notes: 'Excelente feedback.'
      }
    ]
  }
];

