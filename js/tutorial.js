// ==========================================
// Cakekulator - Módulo de Tutorial Guiado Interactivo con Spotlight & Foco Visual
// ==========================================

const TutorialModule = {
  currentStepIndex: 0,
  isActive: false,
  isMinimized: false,
  STORAGE_KEY: 'cakekulator_tutorial_completed',
  _scrollResizeHandler: null,

  // Definición detallada de pasos con zonas y botones específicos a iluminar
  baseSteps: [
    {
      id: 'dashboard_quick_actions',
      tab: 'dashboard',
      target: '#dashboard-quick-actions',
      icon: '⚡',
      badge: 'Acceso Inmediato',
      title: 'Barra de Acciones Rápidas',
      subtitle: 'Tus funciones más usadas en un solo toque.',
      description: 'Esta barra superior está siempre disponible al abrir la app. Te permite generar cotizaciones, crear recetas, cargar compras con boletas o registrar nuevos clientes sin navegar por menús.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca cualquiera de los botones de color para lanzar la acción directa, o presiona "⚙️ Personalizar" para elegir qué accesos rápidos deseas mostrar en tu pantalla inicial.',
      quickTip: '💡 Puedes ordenar y cambiar los botones según las tareas que más repitas cada día en tu taller o cabina.',
      preferredPosition: 'bottom'
    },
    {
      id: 'mode_switcher',
      tab: 'settings',
      target: '#settings-mode-card, #sidebar-mode-card',
      icon: '🔄',
      badge: 'Doble Ambiente',
      title: 'Cambio de Modo en Ajustes: Productos ⇄ Servicios',
      subtitle: 'Alterna entre Pastelería y Servicios/Spa fácilmente.',
      description: 'Cakekulator se adapta a tu negocio: Modo Productos 🎂 para pastelería y repostería artesanal (con cálculo de mermas e insumos), o Modo Servicios 💆 para estética, spa, manicure y terapias (con costeo por hora o sesión).',
      highlightText: 'Dónde cambiarlo:',
      highlightDesc: 'Disponible directamente en esta sección de Configuración. Toca el botón "Cambiar Modo" para alternar entre Productos y Servicios cuando lo necesites.',
      quickTip: '✨ Cada modo mantiene su propio inventario y cotizaciones independientes para que no se mezclen.',
      preferredPosition: 'bottom'
    },
    {
      id: 'recipes_new',
      tab: 'recipes',
      target: '#btn-new-recipe',
      icon: '🎂',
      badge: 'Costeo Inteligente',
      title: 'Botón "+ Nueva Receta / Ficha"',
      subtitle: 'Calcula costos exactos y fija tu ganancia real.',
      description: 'El corazón de tu rentabilidad. Aquí registras tus recetas o protocolos sumando ingredientes, empaques, horas de preparación y mermas para saber exactamente cuánto cuesta cada porción.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca el botón principal "+ Nueva Receta" (o "+ Nuevo Servicio") para abrir la ficha técnica donde defines ingredientes, costos fijos y el porcentaje de ganancia deseado.',
      quickTip: '🎯 Olvídate de multiplicar "al ojo por 3". Cakekulator te mostrará el costo real al centavo para no regalar tu trabajo.',
      preferredPosition: 'bottom'
    },
    {
      id: 'recipes_scanner',
      tab: 'recipes',
      target: '#btn-scan-recipe',
      icon: '📸',
      badge: 'Inteligencia Artificial',
      title: 'Escáner de Recetas con IA',
      subtitle: 'Digitaliza recetarios en papel o fotos en segundos.',
      description: '¿Tienes recetas escritas en cuadernos, servilletas o capturas de pantalla de Instagram? Nuestra IA integrada procesa la imagen y extrae automáticamente los ingredientes, medidas y preparación.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca "📸 Escanear Receta" para tomar una foto o subir un archivo. La IA de Google Gemini estructurará la lista completa de insumos lista para costear.',
      quickTip: '⚡ Te ahorrará horas de digitación manual al traspasar tu recetario a formato digital.',
      preferredPosition: 'bottom'
    },
    {
      id: 'ingredients_scanner',
      tab: 'ingredients',
      target: '#btn-scan-receipt',
      icon: '🧾',
      badge: 'Despensa & OCR',
      title: 'Escáner de Boletas de Compra (OCR)',
      subtitle: 'Sube tus boletas de supermercado al instante.',
      description: 'Mantener los precios al día es fundamental para no perder margen. Con esta herramienta puedes fotografiar las boletas de tus compras en Líder, Jumbo, Central Mayorista o distribuidoras.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca "🧾 Agregar Boleta" para procesar el comprobante de compra. El sistema identificará los productos y sus precios para agregarlos a tu despensa o actualizar los ya existentes.',
      quickTip: '🔄 Si el precio de la mantequilla o harina sube en una boleta, todas tus recetas se actualizarán solas.',
      preferredPosition: 'bottom'
    },
    {
      id: 'ingredients_new',
      tab: 'ingredients',
      target: '#btn-new-ingredient',
      icon: '📦',
      badge: 'Materias Primas',
      title: 'Botón "+ Nuevo Insumo"',
      subtitle: 'Ingreso manual con cálculo de mermas y formatos.',
      description: 'Ingresa tus materias primas con el valor comercial que pagas por paquete (ej. 1 kg, 5 litros o paquete de 10 unidades). La app desglosa el costo unitario por gramo, mililitro o unidad de forma automática.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca "+ Nuevo Insumo" para registrar manualmente cualquier ingrediente, caja, cinta decorativa o insumo de cabina.',
      quickTip: '💡 Puedes asignar un % de merma estimado (ej. 12% para cáscaras de huevo o recortes) para no subestimar costos.',
      preferredPosition: 'bottom'
    },
    {
      id: 'quotes_new',
      tab: 'quotes',
      target: '#btn-new-quote',
      icon: '📋',
      badge: 'Ventas Profesionales',
      title: 'Botón "+ Nueva Cotización"',
      subtitle: 'Presupuestos elegantes y envío por WhatsApp en 1 minuto.',
      description: 'Crea propuestas comerciales que dan confianza y profesionalismo a tus clientes. Elige los productos o servicios ya costeados, define abonos de reserva (ej. 50%) y fecha del evento.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca "+ Nueva Cotización" para armar una propuesta. Podrás enviar un mensaje formal prediseñado por WhatsApp o descargar una tarjeta gráfica (PNG) con tu logo.',
      quickTip: '✨ Al marcar una cotización como "Aprobada", se sumará automáticamente a tus ingresos mensuales y a tu calendario.',
      preferredPosition: 'bottom'
    },
    {
      id: 'customers_directory',
      tab: 'customers',
      target: '#btn-new-customer, #btn-customer-notif',
      icon: '👥',
      badge: 'Fidelización CRM',
      title: 'Directorio de Clientes & Alertas de Cumpleaños',
      subtitle: 'Anticípate a los pedidos y cuida a tus clientes VIP.',
      description: 'Tu agenda inteligente de fidelización. Guarda los teléfonos, gustos, alergias alimentarias y las fechas importantes de tus clientes (cumpleaños de sus hijos, aniversarios o eventos).',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Toca "+ Nuevo Cliente" para ingresar un contacto y sus fechas especiales, o usa el botón "🔔 Alertas" para habilitar las notificaciones push en tu dispositivo.',
      quickTip: '🔔 La app te alertará con 7 días de anticipación antes de cada cumpleaños para que les ofrezcas su torta o regalo a tiempo.',
      preferredPosition: 'bottom'
    },
    {
      id: 'simulator_controls',
      tab: 'simulator',
      target: '#sim-recipe-select',
      icon: '🧮',
      badge: 'Márgenes & POS',
      title: 'Simulador de Precios & Comisiones Bancarias',
      subtitle: 'Averigua cuánta ganancia limpia te queda en el bolsillo.',
      description: 'Experimenta con diferentes precios de venta y visualiza en tiempo real qué porcentaje es costo directo, cuánto te descuenta la máquina de tarjetas (Transbank, SumUp, Redelcom) y cuánto ganas tú.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Selecciona una receta del menú desplegable o ingresa un costo manual, y luego desliza la barra de precios para encontrar el margen óptimo (recomendado entre 40% y 65%).',
      quickTip: '💳 Activa la casilla de Comisión POS para calcular el cobro exacto y no asumir tú el costo de la tarjeta.',
      preferredPosition: 'bottom'
    },
    {
      id: 'market_radar_tabs',
      tab: 'market-radar',
      target: '#radar-subtabs',
      icon: '🛒',
      badge: 'Comparador de Precios',
      title: 'Radar de Ofertas en Supermercados Chilenos',
      subtitle: 'Ahorra en tus compras cotizando en Líder, Jumbo y Santa Isabel.',
      description: 'Compara precios actualizados de insumos clave como chocolate, crema vegetal, mantequilla, manjar y harinas entre los principales comercios de Chile.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Usa estas pestañas para alternar entre "Ofertas en Vivo", el gráfico "Evolutivo de Precios" histórico y el capturador web.',
      quickTip: '🛒 Antes de salir a comprar tus pedidos de la semana, consulta el Radar para comprar donde esté más barato.',
      preferredPosition: 'bottom'
    },
    {
      id: 'finance_overview',
      tab: 'finance',
      onlyIfContainerExists: 'finance-view',
      target: '#finance-view',
      icon: '📈',
      badge: 'Gestión Económica',
      title: 'Finanzas, Gráficos & Punto de Equilibrio',
      subtitle: 'La salud económica de tu negocio en gráficos.',
      description: 'Panel avanzado disponible en escritorio que calcula tus costos fijos, rentabilidad mensual y la cantidad mínima de productos que debes vender para no tener pérdidas (punto de equilibrio).',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Revisa las métricas superiores de ticket promedio, tasa de conversión y margen general ponderado de tu taller.',
      quickTip: '💼 Ideal para balances mensuales y presentaciones financieras.',
      preferredPosition: 'bottom'
    },
    {
      id: 'navigation_and_settings',
      tab: 'settings',
      target: '#mobile-bottom-nav, #sidebar-nav-settings',
      icon: '🚀',
      badge: 'Listo para Empezar',
      title: 'Navegación Táctil, Gestos & Configuración',
      subtitle: 'Todo configurado para trabajar con máxima comodidad.',
      description: '¡Felicitaciones! Has completado el recorrido por las principales funciones de Cakekulator. Diseñamos la plataforma para que puedas usarla ágilmente incluso mientras cocinas o atiendes.',
      highlightText: 'Qué debes usar aquí:',
      highlightDesc: 'Navega tocando los accesos inferiores o desliza horizontalmente tu pantalla con el dedo para cambiar de sección. En esta pantalla de Configuración puedes subir tu logo y vincular Google.',
      quickTip: '🎉 ¡Todo listo para triunfar! Puedes volver a abrir este tutorial en cualquier momento desde esta pestaña de Ajustes.',
      preferredPosition: 'top'
    }
  ],

  getSteps() {
    return this.baseSteps.filter(step => {
      if (step.onlyIfContainerExists) {
        return !!document.getElementById(step.onlyIfContainerExists);
      }
      return true;
    });
  },

  init() {
    const completed = localStorage.getItem(this.STORAGE_KEY);
    // Si no ha completado el tutorial y no está en la versión de clientes, lanzarlo automáticamente
    if (!completed && !window.location.pathname.includes('index-user.html')) {
      setTimeout(() => {
        this.start(0);
      }, 700);
    }
    this.bindKeyboardNavigation();
  },

  bindKeyboardNavigation() {
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === 'Escape') {
        this.finish(false);
      }
    });
  },

  start(stepIndex = 0) {
    const steps = this.getSteps();
    this.currentStepIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
    this.isActive = true;
    this.isMinimized = false;

    this.goToStep(this.currentStepIndex);
    this.attachRepositionListeners();
  },

  startForTab(tabName) {
    const steps = this.getSteps();
    const foundIndex = steps.findIndex(s => s.tab === tabName);
    if (foundIndex !== -1) {
      this.start(foundIndex);
    } else {
      if (tabName === 'finance' && typeof App !== 'undefined' && App.showToast) {
        App.showToast('El panel de finanzas está disponible en la versión Web');
      }
      this.start(0);
    }
  },

  next() {
    const steps = this.getSteps();
    if (this.currentStepIndex < steps.length - 1) {
      this.goToStep(this.currentStepIndex + 1);
    } else {
      this.finish(true);
    }
  },

  prev() {
    if (this.currentStepIndex > 0) {
      this.goToStep(this.currentStepIndex - 1);
    }
  },

  goToStep(index) {
    const steps = this.getSteps();
    this.currentStepIndex = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[this.currentStepIndex];

    // 1. Sincronizar la vista activa de la app con el paso del tutorial
    if (step && step.tab && typeof App !== 'undefined' && App.switchTab) {
      App.switchTab(step.tab);
    }

    // 2. Dar un pequeño respiro para que el DOM de la vista se renderice
    setTimeout(() => {
      this.render();
    }, 120);
  },

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.render();
  },

  finish(markAsCompleted = true) {
    this.isActive = false;
    this.isMinimized = false;
    this.detachRepositionListeners();

    if (markAsCompleted) {
      localStorage.setItem(this.STORAGE_KEY, 'true');
      if (typeof App !== 'undefined') {
        if (typeof App.triggerCelebration === 'function') {
          App.triggerCelebration('confetti');
        } else if (typeof App.triggerConfetti === 'function') {
          App.triggerConfetti();
        }
        if (typeof App.showToast === 'function') {
          App.showToast('🎉 ¡Tutorial completado! Puedes volver a abrirlo en Configuración.');
        }
      }
    }

    const container = document.getElementById('tutorial-overlay-container');
    if (container) {
      container.classList.add('opacity-0', 'transition-opacity', 'duration-200');
      setTimeout(() => {
        container.remove();
      }, 200);
    }
  },

  resetTutorialStatus() {
    localStorage.removeItem(this.STORAGE_KEY);
    if (typeof App !== 'undefined' && typeof App.showToast === 'function') {
      App.showToast('🔄 Estado del tutorial reiniciado. Se mostrará en tu próximo inicio.');
    }
  },

  attachRepositionListeners() {
    if (this._scrollResizeHandler) return;
    this._scrollResizeHandler = () => {
      if (!this.isActive || this.isMinimized) return;
      this.updateSpotlightCoordinates();
    };
    window.addEventListener('resize', this._scrollResizeHandler, { passive: true });
    window.addEventListener('scroll', this._scrollResizeHandler, { passive: true, capture: true });
  },

  detachRepositionListeners() {
    if (this._scrollResizeHandler) {
      window.removeEventListener('resize', this._scrollResizeHandler);
      window.removeEventListener('scroll', this._scrollResizeHandler, { capture: true });
      this._scrollResizeHandler = null;
    }
  },

  // Busca el elemento objetivo visible en pantalla
  findTargetElement(selector) {
    if (!selector) return null;
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      // Validar que esté visible en el DOM
      if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
        return el;
      }
    }
    return null;
  },

  render() {
    if (!this.isActive) return;

    let container = document.getElementById('tutorial-overlay-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tutorial-overlay-container';
      document.body.appendChild(container);
    }

    const steps = this.getSteps();
    const step = steps[this.currentStepIndex];
    const totalSteps = steps.length;
    const currentNumber = this.currentStepIndex + 1;
    const progressPct = Math.round((currentNumber / totalSteps) * 100);

    // ==========================================
    // MODO MINIMIZADO: Pill flotante discreto para interactuar con la app
    // ==========================================
    if (this.isMinimized) {
      container.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-300 pointer-events-auto';
      container.innerHTML = `
        <div class="bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-pink-500/50 backdrop-blur-md flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <span class="text-base animate-bounce">🎓</span>
          <div class="text-xs">
            <span class="font-extrabold text-pink-400">Paso ${currentNumber}/${totalSteps}:</span>
            <span class="font-medium text-gray-200 ml-1 truncate max-w-[150px] inline-block align-bottom">${step.title}</span>
          </div>
          <button type="button" onclick="TutorialModule.toggleMinimize()" class="px-2.5 py-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer active:scale-95 shadow-xs">
            Ver Guía ↗
          </button>
          <button type="button" onclick="TutorialModule.finish(true)" class="text-gray-400 hover:text-white text-xs p-1" title="Cerrar tutorial">
            ✕
          </button>
        </div>
      `;
      return;
    }

    // ==========================================
    // MODO SPOTLIGHT INTERACTIVO CON FOCO EN PANTALLA
    // ==========================================
    container.className = 'fixed inset-0 z-[9990] pointer-events-auto overflow-hidden';

    // Buscar el elemento objetivo a iluminar
    const targetEl = this.findTargetElement(step.target);

    // Si encontramos el elemento, hacer scroll suave hacia él antes de calcular coordenadas
    if (targetEl) {
      try {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } catch (e) {
        // Fallback en navegadores antiguos
        targetEl.scrollIntoView(false);
      }
    }

    // Renderizar estructura base del spotlight y popover
    container.innerHTML = `
      <!-- SVG Backdrop con Máscara de Corte para el elemento destacado -->
      <svg id="tutorial-spotlight-svg" class="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tutorial-cutout-mask">
            <!-- Fondo blanco = opaco -->
            <rect width="100%" height="100%" fill="white" />
            <!-- Agujero negro = transparente / iluminado -->
            <rect id="tutorial-mask-cutout" x="0" y="0" width="0" height="0" rx="16" fill="black" />
          </mask>
        </defs>
        <!-- Capa oscura semitransparente con recorte -->
        <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.76)" mask="url(#tutorial-cutout-mask)" />
      </svg>

      <!-- Anillo / Halo de Luz Neón Pulsante alrededor del elemento -->
      <div 
        id="tutorial-spotlight-ring" 
        class="fixed pointer-events-none transition-all duration-300 rounded-2xl ring-4 ring-pink-500/90 shadow-[0_0_35px_rgba(236,72,153,0.8),inset_0_0_20px_rgba(236,72,153,0.3)] animate-pulse z-[9995]"
        style="opacity: 0; transform: scale(0.98);"
      >
        <!-- Insignia puntero visual -->
        <div class="absolute -top-3.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1">
          <span class="animate-bounce">👇</span> 
          <span>Toca / Usa aquí</span>
        </div>
      </div>

      <!-- Tarjeta Flotante Interactiva de Explicación (Popover) -->
      <div 
        id="tutorial-popover-card"
        class="fixed z-[9999] w-[calc(100vw-24px)] max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-pink-200 dark:border-slate-700/80 overflow-hidden transition-all duration-300 flex flex-col"
        style="opacity: 0; transform: translateY(10px);"
      >
        <!-- Barra de Progreso Superior -->
        <div class="w-full bg-gray-100 dark:bg-slate-800 h-1.5 overflow-hidden shrink-0">
          <div class="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-teal-400 transition-all duration-300" style="width: ${progressPct}%;"></div>
        </div>

        <!-- Encabezado de la Tarjeta -->
        <div class="p-3.5 sm:p-4 pb-2 border-b border-gray-100 dark:border-slate-800/80 flex items-start justify-between gap-2 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-xl shadow-md shadow-pink-500/20 shrink-0">
              ${step.icon}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300">
                  ${step.badge || `Paso ${currentNumber} de ${totalSteps}`}
                </span>
                <span class="text-[10px] text-gray-400 font-bold">
                  ${currentNumber}/${totalSteps}
                </span>
              </div>
              <h3 class="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 leading-tight truncate">
                ${step.title}
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button 
              type="button" 
              onclick="TutorialModule.toggleMinimize()" 
              class="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-xs"
              title="Minimizar para interactuar libremente con la pantalla"
            >
              👁️
            </button>
            <button 
              type="button" 
              onclick="TutorialModule.finish(true)" 
              class="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-xs"
              title="Cerrar tutorial"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Contenido Educativo & Foco de Acción -->
        <div class="p-3.5 sm:p-4 space-y-2.5 text-xs overflow-y-auto max-h-[46vh] custom-scrollbar">
          
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            ${step.description}
          </p>

          <!-- Zona Iluminada: Explicación Específica del Botón / Componente -->
          <div class="p-3 rounded-2xl bg-pink-50/90 dark:bg-slate-800/90 border border-pink-200/90 dark:border-pink-900/50 space-y-1">
            <div class="flex items-center gap-1.5 text-pink-700 dark:text-pink-300 font-extrabold text-[11px] uppercase tracking-wider">
              <span>🎯</span>
              <span>${step.highlightText || 'Qué debes hacer:'}</span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
              ${step.highlightDesc}
            </p>
          </div>

          <!-- Consejo Pro -->
          <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 text-gray-600 dark:text-gray-400 text-[11px] flex items-center gap-2">
            <span>${step.quickTip}</span>
          </div>

          <!-- Dots de Navegación Rápida -->
          <div class="flex items-center justify-center gap-1 pt-1">
            ${steps.map((s, idx) => `
              <button 
                type="button" 
                onclick="TutorialModule.goToStep(${idx})"
                class="h-1.5 rounded-full transition-all duration-200 cursor-pointer ${idx === this.currentStepIndex ? 'w-5 bg-pink-600' : 'w-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-pink-300'}"
                title="${s.title}"
              ></button>
            `).join('')}
          </div>
        </div>

        <!-- Barra de Navegación Inferior -->
        <div class="p-3 bg-gray-50 dark:bg-slate-800/90 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          
          <button 
            type="button" 
            onclick="TutorialModule.prev()" 
            class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            ${this.currentStepIndex === 0 ? 'disabled' : ''}
          >
            <span>⬅️</span> <span>Anterior</span>
          </button>

          <div class="flex items-center gap-1.5">
            <button 
              type="button" 
              onclick="TutorialModule.finish(true)" 
              class="px-2.5 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-semibold text-xs transition cursor-pointer"
            >
              Saltar
            </button>

            <button 
              type="button" 
              onclick="TutorialModule.next()" 
              class="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-600/25 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>${this.currentStepIndex === totalSteps - 1 ? '¡Finalizar! 🎉' : 'Siguiente ➡️'}</span>
            </button>
          </div>

        </div>

      </div>
    `;

    // Posicionar spotlight y tarjeta según coordenadas del elemento
    setTimeout(() => {
      this.updateSpotlightCoordinates();
    }, 40);
  },

  updateSpotlightCoordinates() {
    if (!this.isActive || this.isMinimized) return;

    const steps = this.getSteps();
    const step = steps[this.currentStepIndex];
    if (!step) return;

    const targetEl = this.findTargetElement(step.target);
    const maskCutout = document.getElementById('tutorial-mask-cutout');
    const ringEl = document.getElementById('tutorial-spotlight-ring');
    const popoverCard = document.getElementById('tutorial-popover-card');

    if (!popoverCard) return;

    const padding = 8;
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    // Si NO se encuentra el elemento objetivo en la vista actual:
    if (!targetEl) {
      if (maskCutout) {
        maskCutout.setAttribute('width', '0');
        maskCutout.setAttribute('height', '0');
      }
      if (ringEl) {
        ringEl.style.opacity = '0';
      }

      // Centrar tarjeta flotante en pantalla
      popoverCard.style.left = '50%';
      popoverCard.style.top = '50%';
      popoverCard.style.transform = 'translate(-50%, -50%)';
      popoverCard.style.opacity = '1';
      return;
    }

    // Si encontramos el elemento, obtener su BoundingClientRect
    const rect = targetEl.getBoundingClientRect();

    const cutoutX = Math.max(0, rect.left - padding);
    const cutoutY = Math.max(0, rect.top - padding);
    const cutoutW = Math.min(vpWidth - cutoutX, rect.width + (padding * 2));
    const cutoutH = Math.min(vpHeight - cutoutY, rect.height + (padding * 2));

    // 1. Actualizar el recorte SVG
    if (maskCutout) {
      maskCutout.setAttribute('x', cutoutX);
      maskCutout.setAttribute('y', cutoutY);
      maskCutout.setAttribute('width', cutoutW);
      maskCutout.setAttribute('height', cutoutH);
      maskCutout.setAttribute('rx', '18');
    }

    // 2. Posicionar el halo de luz neón
    if (ringEl) {
      ringEl.style.left = `${cutoutX}px`;
      ringEl.style.top = `${cutoutY}px`;
      ringEl.style.width = `${cutoutW}px`;
      ringEl.style.height = `${cutoutH}px`;
      ringEl.style.opacity = '1';
      ringEl.style.transform = 'scale(1)';
    }

    // 3. Posicionar inteligentemente la tarjeta flotante (popover)
    const cardRect = popoverCard.getBoundingClientRect();
    const cardWidth = cardRect.width || 380;
    const cardHeight = cardRect.height || 300;

    let targetLeft = 0;
    let targetTop = 0;

    // Espacio disponible
    const spaceBelow = vpHeight - (rect.bottom + padding + 12);
    const spaceAbove = rect.top - padding - 12;

    // Determinar si colocar arriba o abajo
    const placeBelow = spaceBelow >= Math.min(cardHeight, 260) || spaceBelow >= spaceAbove;

    if (placeBelow) {
      targetTop = rect.bottom + padding + 14;
    } else {
      targetTop = rect.top - padding - cardHeight - 14;
    }

    // Alineación horizontal: centrar respecto al elemento objetivo, sin desbordar bordes de la pantalla
    const elementCenter = rect.left + (rect.width / 2);
    targetLeft = elementCenter - (cardWidth / 2);

    // Ajustar dentro de los límites de la pantalla con margen de 12px
    if (targetLeft < 12) targetLeft = 12;
    if (targetLeft + cardWidth > vpWidth - 12) targetLeft = vpWidth - cardWidth - 12;

    // Ajustar verticalmente si se sale de la pantalla
    if (targetTop < 12) targetTop = 12;
    if (targetTop + cardHeight > vpHeight - 12) targetTop = vpHeight - cardHeight - 12;

    popoverCard.style.left = `${Math.round(targetLeft)}px`;
    popoverCard.style.top = `${Math.round(targetTop)}px`;
    popoverCard.style.transform = 'none';
    popoverCard.style.opacity = '1';
  }
};

window.TutorialModule = TutorialModule;
