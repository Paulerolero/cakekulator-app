// ==========================================
// Cakekulator - Capa de Datos para Clientes (User DB)
// ==========================================

const USER_DB_KEYS = {
  PROFILE: 'cakekulator_user_profile',
  FAVORITES: 'cakekulator_user_favorites',
  REQUESTS: 'cakekulator_buyer_requests',
  FLASH_OFFERS: 'cakekulator_flash_offers',
  BAKERIES: 'cakekulator_nearby_bakeries'
};

// Pastelerías y reposteros locales de demostración
const DEFAULT_BAKERIES = [
  {
    id: 'bakery_1',
    name: 'Dulce Arte Pastelería',
    chef: 'Chef Valentina Morales',
    rating: 4.9,
    reviewsCount: 128,
    category: 'Tortas de Diseño & Fina',
    specialties: ['Tortas de Novios', 'Red Velvet', 'Macarons Franceses'],
    address: 'Av. Providencia 1450, Providencia',
    commune: 'Providencia',
    lat: -33.4265,
    lng: -70.6150,
    phone: '+56912345678',
    instagram: '@dulcearte_pasteleria',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60',
    logo: '🎂',
    badges: ['Verificada', 'Entrega Hoy', 'Vegano Opcional'],
    deliveryAvailable: true,
    minLeadTime: '2 horas (en stock) / 24 hrs a pedido'
  },
  {
    id: 'bakery_2',
    name: 'La Petite Pâtisserie & Bakery',
    chef: 'Pierre & Camila',
    rating: 4.8,
    reviewsCount: 94,
    category: 'Bollería & Tartas Gourmet',
    specialties: ['Croissants de Almendra', 'Pie de Limón Merengue', 'Tartaletas'],
    address: 'Av. Italia 1120, Ñuñoa',
    commune: 'Ñuñoa',
    lat: -33.4475,
    lng: -70.6270,
    phone: '+56987654321',
    instagram: '@lapetite_patisserie',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
    logo: '🥐',
    badges: ['Top Ventas', '100% Mantequilla'],
    deliveryAvailable: true,
    minLeadTime: 'Mismo día antes de las 14:00'
  },
  {
    id: 'bakery_3',
    name: 'Verde & Dulce (Sin Azúcar / Vegana)',
    chef: 'Javiera Gómez',
    rating: 5.0,
    reviewsCount: 76,
    category: 'Saludable & Alergias',
    specialties: ['Tortas Sin Azúcar (Alulosa)', 'Sin Gluten / Celíacos', 'Pastelería Vegana'],
    address: 'Alonso de Córdova 3890, Vitacura',
    commune: 'Vitacura',
    lat: -33.3980,
    lng: -70.5890,
    phone: '+56955512345',
    instagram: '@verdeydulce_fit',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=500&auto=format&fit=crop&q=60',
    logo: '🥑',
    badges: ['Keto', 'Sin Azúcar', 'Sin Gluten'],
    deliveryAvailable: true,
    minLeadTime: '24 horas'
  },
  {
    id: 'bakery_4',
    name: 'El Rincón del Cupcake',
    chef: 'Daniela Castro',
    rating: 4.7,
    reviewsCount: 110,
    category: 'Bocaditos & Candy Bar',
    specialties: ['Cupcakes Personalizados', 'Alfajores Artesanales', 'Popcakes'],
    address: 'Av. Las Condes 9200, Las Condes',
    commune: 'Las Condes',
    lat: -33.3850,
    lng: -70.5400,
    phone: '+56977799881',
    instagram: '@rincon_cupcake',
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500&auto=format&fit=crop&q=60',
    logo: '🧁',
    badges: ['Eventos', 'Pack Fiesta'],
    deliveryAvailable: true,
    minLeadTime: '4 horas'
  },
  {
    id: 'bakery_5',
    name: 'Chocolatería & Brownies del Valle',
    chef: 'Esteban Valdés',
    rating: 4.9,
    reviewsCount: 88,
    category: 'Chocolatería & Postres',
    specialties: ['Brownies Melcochosos', 'Volcán de Chocolate', 'Bombones Rellenos'],
    address: 'Huérfanos 850, Santiago Centro',
    commune: 'Santiago Centro',
    lat: -33.4390,
    lng: -70.6480,
    phone: '+56944433221',
    instagram: '@brownies_valle',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    logo: '🍫',
    badges: ['Chocolate Belga', 'Listo para Llevar'],
    deliveryAvailable: true,
    minLeadTime: 'Entrega Inmediata'
  }
];

// Ofertas Flash predeterminadas de ejemplo
const DEFAULT_FLASH_OFFERS = [
  {
    id: 'offer_1',
    bakeryId: 'bakery_1',
    bakeryName: 'Dulce Arte Pastelería',
    bakeryPhone: '+56912345678',
    title: '¡Última Torta Tres Leches Frambuesa (15 porciones)!',
    description: 'Horneada hoy a las 10:00 AM. Decorada con crema chantilly y frambuesas frescas. ¡Lista para retirar o pedir delivery!',
    originalPrice: 28000,
    offerPrice: 17900,
    discountPct: 36,
    stockQty: 1,
    category: 'Tortas',
    expiresInMinutes: 95,
    tag: '⚡ Oferta Flash del Día',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=60',
    dietary: ['Tradicional', 'Frutos Rojos']
  },
  {
    id: 'offer_2',
    bakeryId: 'bakery_2',
    bakeryName: 'La Petite Pâtisserie',
    bakeryPhone: '+56987654321',
    title: 'Pack 6 Croissants Rellenos de Crema Pastelera & Almendras',
    description: 'Recién salidos del horno para la once de hoy. Crocantes, 100% mantequilla de campo.',
    originalPrice: 15000,
    offerPrice: 9900,
    discountPct: 34,
    stockQty: 3,
    category: 'Bollería',
    expiresInMinutes: 140,
    tag: '🔥 Recién Horneado',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60',
    dietary: ['Gourmet', 'Horneado Diario']
  },
  {
    id: 'offer_3',
    bakeryId: 'bakery_4',
    bakeryName: 'El Rincón del Cupcake',
    bakeryPhone: '+56977799881',
    title: 'Caja x12 Cupcakes Surtidos Temáticos',
    description: 'Excedente de pedido corporativo con diseño de flores y chocolate. Sabores: Vainilla-Manjar y Chocolate-Nutella.',
    originalPrice: 22000,
    offerPrice: 12500,
    discountPct: 43,
    stockQty: 2,
    category: 'Cupcakes',
    expiresInMinutes: 60,
    tag: '⏳ Quedan 2 cajas',
    image: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500&auto=format&fit=crop&q=60',
    dietary: ['Surtido', 'Listo Hoy']
  },
  {
    id: 'offer_4',
    bakeryId: 'bakery_3',
    bakeryName: 'Verde & Dulce',
    bakeryPhone: '+56955512345',
    title: 'Pie de Maracuyá Vegano & Sin Azúcar (Endulzado con Alulosa)',
    description: 'Base de almendras y avena, relleno cremoso de maracuyá 100% natural, merengue de aquafaba.',
    originalPrice: 19500,
    offerPrice: 13900,
    discountPct: 29,
    stockQty: 1,
    category: 'Saludable',
    expiresInMinutes: 180,
    tag: '🥑 Apto Diabéticos & Vegano',
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&auto=format&fit=crop&q=60',
    dietary: ['Sin Azúcar', 'Vegano', 'Sin Gluten']
  }
];

// Solicitudes de compra de clientes de ejemplo (Búsquedas Flash)
const DEFAULT_BUYER_REQUESTS = [
  // --- PRODUCTOS (Pastelería / Repostería) ---
  {
    id: 'req_101',
    businessType: 'product',
    userName: 'Carolina Morales',
    userPhone: '+56991122334',
    title: 'Necesito un Pie de Limón para 10 personas hoy',
    description: 'Se nos olvidó el postre para un almuerzo familiar hoy a las 18:00 hrs en Providencia. Pago $12.000 a $15.000 en efectivo o transferencia.',
    budget: 14000,
    category: 'Tartas / Pies',
    commune: 'Providencia',
    lat: -33.4280,
    lng: -70.6120,
    deadline: 'Hoy antes de las 18:00',
    dietaryNotes: 'Tradicional, con harto merengue dorado',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    bids: [
      {
        bakeryId: 'bakery_2',
        bakeryName: 'La Petite Pâtisserie',
        offerPrice: 13500,
        message: '¡Hola Carolina! Tenemos uno recién enfriado listo para entrega a las 17:00 en Providencia.',
        phone: '+56987654321',
        time: 'Hace 25 min'
      }
    ]
  },
  {
    id: 'req_102',
    businessType: 'product',
    userName: 'Matías Silva',
    userPhone: '+56988776655',
    title: 'Torta de Cumpleaños temática Star Wars para mañana',
    description: 'Torta de chocolate o manjar para 20 personas. Busco pastelería en Las Condes o Vitacura que tenga disponibilidad.',
    budget: 35000,
    category: 'Tortas Personalizadas',
    commune: 'Las Condes',
    lat: -33.4020,
    lng: -70.5750,
    deadline: 'Mañana a las 13:00',
    dietaryNotes: 'Sin nueces por alergia',
    status: 'open',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    bids: []
  },
  {
    id: 'req_103',
    businessType: 'product',
    userName: 'Fernanda Ríos',
    userPhone: '+56977665544',
    title: 'Caja de 24 Alfajores artesanales surtidos',
    description: 'Para regalo corporativo. Necesito que vengan en linda caja con cinta.',
    budget: 18000,
    category: 'Bocaditos & Regalos',
    commune: 'Ñuñoa / Santiago',
    lat: -33.4510,
    lng: -70.6020,
    deadline: 'Viernes 16:00',
    dietaryNotes: 'Manjar y Nutella',
    status: 'open',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    bids: []
  },

  // --- SERVICIOS (Estética, Barbería, Spa, Uñas) ---
  {
    id: 'req_201',
    businessType: 'service',
    userName: 'Rodrigo Fuentes',
    userPhone: '+56965432109',
    title: 'Corte Fade Degradé + Perfilado de Barba para hoy',
    description: 'Busco barbero profesional disponible hoy después de las 18:30 hrs en Providencia o Ñuñoa. Corte con máquina y toalla caliente.',
    budget: 18000,
    category: 'Barbería & Cortes',
    commune: 'Providencia',
    lat: -33.4350,
    lng: -70.6180,
    deadline: 'Hoy a las 18:30',
    dietaryNotes: 'Barbería en local o box',
    status: 'open',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    bids: []
  },
  {
    id: 'req_202',
    businessType: 'service',
    userName: 'Camila Valenzuela',
    userPhone: '+56974125896',
    title: 'Esmaltado Permanente con retiro y diseño degradé',
    description: 'Busco manicurista con box en Las Condes o Providencia para esmaltado permanente en tono nude con foil dorado este viernes.',
    budget: 22000,
    category: 'Manicure & Pedicure',
    commune: 'Las Condes',
    lat: -33.3950,
    lng: -70.5600,
    deadline: 'Viernes 17:00',
    dietaryNotes: 'Uñas naturales',
    status: 'open',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    bids: []
  },
  {
    id: 'req_203',
    businessType: 'service',
    userName: 'Ignacio Beltrán',
    userPhone: '+56985236974',
    title: 'Sesión de Masaje Descontracturante 60 min',
    description: 'Para contractura fuerte en espalda alta y cuello. Busco terapeuta con camilla y aceites esenciales en Ñuñoa.',
    budget: 32000,
    category: 'Masajes & Spa',
    commune: 'Ñuñoa',
    lat: -33.4560,
    lng: -70.6150,
    deadline: 'Sábado 11:00',
    dietaryNotes: 'Terapia relajante y descontracturante',
    status: 'open',
    createdAt: new Date(Date.now() - 9000000).toISOString(),
    bids: []
  },
  {
    id: 'req_204',
    businessType: 'service',
    userName: 'Loreto Carrasco',
    userPhone: '+56996325874',
    title: 'Limpieza Facial Profunda con Punta de Diamante',
    description: 'Busco cosmetóloga o centro estético para limpieza facial completa, extracción de impurezas e hidratación antes de un matrimonio.',
    budget: 28000,
    category: 'Estética Facial',
    commune: 'Vitacura',
    lat: -33.3880,
    lng: -70.5820,
    deadline: 'Jueves 16:00',
    dietaryNotes: 'Piel sensible',
    status: 'open',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    bids: []
  },
  {
    id: 'req_205',
    businessType: 'service',
    userName: 'Daniela Soto',
    userPhone: '+56987456123',
    title: 'Lifting de Pestañas + Laminado y Tinte de Cejas',
    description: 'Busco especialista para realizar lifting de pestañas con keratina y diseño con laminado en cejas este sábado en Providencia.',
    budget: 24000,
    category: 'Pestañas & Cejas',
    commune: 'Providencia',
    lat: -33.4240,
    lng: -70.6090,
    deadline: 'Sábado 15:00',
    dietaryNotes: 'Productos hipoalergénicos',
    status: 'open',
    createdAt: new Date(Date.now() - 12600000).toISOString(),
    bids: []
  }
];

// Perfil predeterminado del cliente
const DEFAULT_USER_PROFILE = {
  name: 'Valentina Henríquez',
  email: 'valentina.cliente@gmail.com',
  phone: '+56998877665',
  address: 'Los Leones 1250, Dpto 402',
  commune: 'Providencia',
  lat: -33.4310,
  lng: -70.6080,
  dietaryPreferences: ['Sin Azúcar', 'Frutos Rojos'],
  favoriteFlavors: ['Chocolate Belga', 'Frambuesa', 'Limón Merengue', 'Pistacho'],
  specialDates: [
    { title: 'Cumpleaños de Mamá', date: '2026-10-14', reminderDays: 5 },
    { title: 'Aniversario', date: '2026-11-20', reminderDays: 7 }
  ],
  notificationsEnabled: true,
  avatar: '👩‍🦰'
};

const UserDB = {
  init() {
    if (!localStorage.getItem(USER_DB_KEYS.BAKERIES)) {
      this.saveBakeries(DEFAULT_BAKERIES);
    }
    if (!localStorage.getItem(USER_DB_KEYS.FLASH_OFFERS)) {
      this.saveOffers(DEFAULT_FLASH_OFFERS);
    }
    if (!localStorage.getItem(USER_DB_KEYS.REQUESTS)) {
      this.saveRequests(DEFAULT_BUYER_REQUESTS);
    }
    if (!localStorage.getItem(USER_DB_KEYS.PROFILE)) {
      this.saveProfile(DEFAULT_USER_PROFILE);
    }
    if (!localStorage.getItem(USER_DB_KEYS.FAVORITES)) {
      this.saveFavorites(['bakery_1', 'bakery_2']);
    }
  },

  // Perfil
  getProfile() {
    try {
      const data = localStorage.getItem(USER_DB_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_USER_PROFILE;
    } catch (_) {
      return DEFAULT_USER_PROFILE;
    }
  },

  saveProfile(profile) {
    localStorage.setItem(USER_DB_KEYS.PROFILE, JSON.stringify(profile));
    if (typeof UserAuthModule !== 'undefined' && UserAuthModule.currentUser) {
      UserAuthModule.pushToCloud();
    }
  },

  // Favoritos
  getFavorites() {
    try {
      const data = localStorage.getItem(USER_DB_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  },

  saveFavorites(favorites) {
    localStorage.setItem(USER_DB_KEYS.FAVORITES, JSON.stringify(favorites));
    if (typeof UserAuthModule !== 'undefined' && UserAuthModule.currentUser) {
      UserAuthModule.pushToCloud();
    }
  },

  toggleFavorite(bakeryId) {
    const favs = this.getFavorites();
    const index = favs.indexOf(bakeryId);
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.push(bakeryId);
    }
    this.saveFavorites(favs);
    return favs.includes(bakeryId);
  },

  isFavorite(bakeryId) {
    return this.getFavorites().includes(bakeryId);
  },

  // Pastelerías (Con integración dinámica del taller del vendedor local)
  getBakeries() {
    try {
      const data = localStorage.getItem(USER_DB_KEYS.BAKERIES);
      let list = data ? JSON.parse(data) : DEFAULT_BAKERIES;

      // Integrar datos reales de la app de vendedor si están configurados
      const rawSettings = localStorage.getItem('cakekulator_settings');
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        if (settings.businessName) {
          const myBakery = {
            id: 'bakery_1',
            name: settings.businessName || 'Dulce Arte Pastelería',
            chef: settings.chefName ? `Chef ${settings.chefName}` : 'Chef Pastelero',
            rating: 5.0,
            reviewsCount: 142,
            category: settings.businessMode === 'services' ? 'Servicios & Estética' : 'Pastelería Artesanal & Fina',
            specialties: ['Tortas de Diseño', 'Postres Gourmet', 'Pedidos Personalizados'],
            address: settings.businessAddress || 'Av. Providencia 1450, Providencia',
            commune: settings.businessCommune || 'Providencia',
            lat: parseFloat(settings.businessLat) || -33.4265,
            lng: parseFloat(settings.businessLng) || -70.6150,
            phone: settings.phone || '+56912345678',
            instagram: settings.instagram || '@' + (settings.businessName || 'mi_pasteleria').toLowerCase().replace(/\s+/g, '_'),
            image: settings.logoUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60',
            logo: settings.logoUrl ? '' : '🎂',
            badges: ['⭐ Tu Local', 'Verificado', 'Catálogo Activo'],
            deliveryAvailable: true,
            minLeadTime: '2 horas en stock / 24 hrs a pedido',
            isMyBakery: true
          };

          // Reemplazar o anteponer bakery_1
          list = [myBakery, ...list.filter(b => b.id !== 'bakery_1')];
        }
      }

      return list;
    } catch (_) {
      return DEFAULT_BAKERIES;
    }
  },

  saveBakeries(bakeries) {
    localStorage.setItem(USER_DB_KEYS.BAKERIES, JSON.stringify(bakeries));
  },

  getBakeryById(id) {
    return this.getBakeries().find(b => b.id === id) || null;
  },

  // Ofertas Flash
  getOffers() {
    try {
      const data = localStorage.getItem(USER_DB_KEYS.FLASH_OFFERS);
      return data ? JSON.parse(data) : DEFAULT_FLASH_OFFERS;
    } catch (_) {
      return DEFAULT_FLASH_OFFERS;
    }
  },

  saveOffers(offers) {
    localStorage.setItem(USER_DB_KEYS.FLASH_OFFERS, JSON.stringify(offers));
  },

  // Solicitudes de Compradores (Marketplace / Bids)
  getRequests() {
    try {
      const data = localStorage.getItem(USER_DB_KEYS.REQUESTS);
      return data ? JSON.parse(data) : DEFAULT_BUYER_REQUESTS;
    } catch (_) {
      return DEFAULT_BUYER_REQUESTS;
    }
  },

  saveRequests(requests) {
    localStorage.setItem(USER_DB_KEYS.REQUESTS, JSON.stringify(requests));
    if (typeof UserAuthModule !== 'undefined' && UserAuthModule.currentUser) {
      UserAuthModule.pushToCloud();
    }
  },

  addRequest(newRequest) {
    const requests = this.getRequests();
    const request = {
      id: 'req_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'open',
      bids: [],
      ...newRequest
    };
    requests.unshift(request);
    this.saveRequests(requests);
    return request;
  },

  addBidToRequest(requestId, bid) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (req) {
      if (!req.bids) req.bids = [];
      req.bids.push({
        id: 'bid_' + Date.now(),
        time: 'Ahora',
        ...bid
      });
      this.saveRequests(requests);
      return true;
    }
    return false;
  },

  // Catálogo público de productos por pastelería
  getBakeryCatalog(bakeryId) {
    const bakery = this.getBakeryById(bakeryId);
    
    // Si es la pastelería del vendedor (bakery_1 o isMyBakery)
    if (bakeryId === 'bakery_1' || (bakery && bakery.isMyBakery)) {
      try {
        const rawRecipes = localStorage.getItem('cakekulator_recipes');
        let recipes = rawRecipes ? JSON.parse(rawRecipes) : (typeof DEFAULT_RECIPES !== 'undefined' ? DEFAULT_RECIPES : []);
        
        // Filtrar productos (no servicios) y que estén marcados para catálogo
        const catalogRecipes = recipes.filter(r => 
          (r.itemType || 'product') === 'product' && 
          r.showInCatalog !== false
        );

        if (catalogRecipes.length > 0) {
          return catalogRecipes.map(r => {
            // Estimar precio sugerido si no tiene precio catálogo fijo
            let price = r.catalogPrice || r.suggestedPrice || 0;
            if (!price) {
              const baseCost = Number(r.overheadCost || 1500) + ((Number(r.laborHours) || 1) * (Number(r.laborRatePerHour) || 4000)) + 6000;
              const margin = (Number(r.suggestedMargin) || 45) / 100;
              price = Math.round(baseCost / (1 - margin));
            }

            return {
              id: r.id,
              name: r.name,
              category: r.category || 'Pastelería Fina',
              description: r.description || (r.type === 'cake' ? `Deliciosa torta artesanal para ${r.yieldPortions} porciones.` : `Elaborado artesanalmente en formato de ${r.yieldUnits} ${r.unitName || 'unidades'}.`),
              price: price,
              yieldInfo: r.type === 'cake' ? `${r.yieldPortions} porciones` : `${r.yieldUnits} ${r.unitName || 'un'}`,
              image: r.imageUrl || (r.type === 'cake' ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60' : 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60'),
              badge: r.type === 'cake' ? 'Torta Entera' : 'Pack / Lote',
              isAvailable: true
            };
          });
        }
      } catch (err) {
        console.warn('Error al leer catálogo del pastelero:', err);
      }
    }

    // Catálogos para el resto de pastelerías
    const fallbackCatalogs = {
      bakery_1: [
        {
          id: 'prod_101',
          name: 'Torta Red Velvet Especial',
          category: 'Tortas',
          description: 'Bizcocho terciopelo rojo con suave relleno de frosting de queso crema Philadelphia y frambuesas frescas.',
          price: 28900,
          yieldInfo: '20 porciones',
          image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=500&auto=format&fit=crop&q=60',
          badge: 'Más Vendida',
          isAvailable: true
        },
        {
          id: 'prod_102',
          name: 'Caja x12 Macarons Franceses',
          category: 'Bocaditos',
          description: 'Surtido de sabores finos: Pistacho, Frutos Rojos, Chocolate Belga y Caramelo Salado.',
          price: 16500,
          yieldInfo: '12 unidades',
          image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&auto=format&fit=crop&q=60',
          badge: 'Gourmet',
          isAvailable: true
        },
        {
          id: 'prod_103',
          name: 'Torta Selva Negra Tradicional',
          category: 'Tortas',
          description: 'Bizcocho húmedo de cacao con capas de crema chantilly, cerezas maceradas y virutas de chocolate.',
          price: 26500,
          yieldInfo: '18 porciones',
          image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop&q=60',
          badge: 'Clásica',
          isAvailable: true
        }
      ],
      bakery_2: [
        {
          id: 'prod_201',
          name: 'Pie de Limón con Merengue Suizo Dorado',
          category: 'Pies & Tartas',
          description: 'Cremoso relleno de limón sutil con masa quebrada de mantequilla y merengue suizo horneado.',
          price: 15900,
          yieldInfo: '10-12 porciones',
          image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=500&auto=format&fit=crop&q=60',
          badge: 'Favorito',
          isAvailable: true
        },
        {
          id: 'prod_202',
          name: 'Pack 4 Croissants de Almendras',
          category: 'Bollería',
          description: 'Hojaldre 100% mantequilla relleno con crema frangipane y láminas de almendra tostada.',
          price: 11000,
          yieldInfo: '4 unidades',
          image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60',
          badge: 'Horneado Hoy',
          isAvailable: true
        }
      ],
      bakery_3: [
        {
          id: 'prod_301',
          name: 'Torta Cuatro Leches Sin Azúcar (Keto / Alulosa)',
          category: 'Saludable',
          description: 'Endulzada 100% con alulosa no calórica. Apta para personas con resistencia a la insulina y celíacos.',
          price: 29900,
          yieldInfo: '15 porciones',
          image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=500&auto=format&fit=crop&q=60',
          badge: 'Sin Azúcar',
          isAvailable: true
        },
        {
          id: 'prod_302',
          name: 'Brownie Vegano Sin Gluten de Cacao 70%',
          category: 'Saludable',
          description: 'Elaborado con harina de almendras, aceite de coco virgen y cacao puro.',
          price: 14500,
          yieldInfo: '6 trozos grandes',
          image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
          badge: '100% Vegano',
          isAvailable: true
        }
      ]
    };

    return fallbackCatalogs[bakeryId] || fallbackCatalogs['bakery_1'];
  }
};
