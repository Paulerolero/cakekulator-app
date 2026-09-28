// ==========================================
// Cakekulator - Módulo de Tutorial Guiado Interactivo
// ==========================================

const TutorialModule = {
  currentStepIndex: 0,
  isActive: false,
  isMinimized: false,
  STORAGE_KEY: 'cakekulator_tutorial_completed',

  // Definición pedagógica de cada vista y función clave
  baseSteps: [
    {
      id: 'welcome',
      tab: 'dashboard',
      icon: '🧁',
      title: '¡Bienvenido a Cakekulator!',
      subtitle: 'Tu plataforma inteligente de costeo, presupuestos y crecimiento.',
      description: 'Esta aplicación fue diseñada por y para emprendedores del rubro gastronómico y estético. Te ayuda a calcular tus precios con precisión quirúrgica, dejar de perder dinero en mermas o mano de obra, y presentar cotizaciones profesionales que aumentan tus ventas.',
      bullets: [
        { icon: '📊', title: 'Dashboard en Vivo', desc: 'Monitorea tus ingresos del mes, pedidos agendados y métricas clave en un vistazo.' },
        { icon: '🔄', title: 'Doble Ambiente', desc: 'Alterna entre Modo Pastelería 🎂 y Modo Servicios & Spa 💆 según tu tipo de negocio.' }
      ],
      quickTip: '💡 Puedes volver a abrir este tutorial en cualquier momento desde la pestaña Configuración ⚙️.'
    },
    {
      id: 'recipes',
      tab: 'recipes',
      icon: '🎂',
      title: 'Fichas Técnicas & Costeo Inteligente',
      subtitle: 'Calcula costos exactos y define tu margen de ganancia real.',
      description: 'Crea fichas técnicas detalladas donde cada gramo de ingrediente, empaque y minuto de mano de obra se costea automáticamente. Olvídate de multiplicar al ojo por dos o por tres: aquí sabrás exactamente cuánto ganas.',
      bullets: [
        { icon: '📏', title: 'Escalador Inteligente', desc: 'Adapta porciones o diámetros de molde (ej. de 15p a 30p) con ajuste automático de costos.' },
        { icon: '📸', title: 'Escáner de Recetas con IA', desc: 'Toma una foto a tu recetario en papel o cuaderno y la IA extraerá los ingredientes por ti.' },
        { icon: '🛍️', title: 'Catálogo de Clientes', desc: 'Publica productos con un toque para que tus clientes puedan pedirlos en tu catálogo online.' }
      ],
      quickTip: '🎯 Toca el botón "+ Crear Ficha Técnica" para empezar a costear tu primera receta o servicio.'
    },
    {
      id: 'ingredients',
      tab: 'ingredients',
      icon: '📦',
      title: 'Insumos, Paquetes & Mermas',
      subtitle: 'Tu despensa digital con precios desglosados al gramo y al mililitro.',
      description: 'Ingresa tus materias primas con el precio que pagas en el supermercado o distribuidora. La app desglosa el costo unitario por gramo, ml o unidad, calculando además el porcentaje de desperdicio o merma.',
      bullets: [
        { icon: '🧾', title: 'Escáner de Boletas con IA', desc: 'Sube la foto de tu boleta o factura de compra y los insumos se cargarán de inmediato.' },
        { icon: '⚡', title: 'Actualización Global', desc: 'Si el precio de la mantequilla sube, modifícalo aquí y todas tus recetas se actualizarán solas.' }
      ],
      quickTip: '💡 Asigna siempre la merma estimada (ej. 15% para cáscaras de huevo o recortes) para no subestimar costos.'
    },
    {
      id: 'quotes',
      tab: 'quotes',
      icon: '📋',
      title: 'Presupuestos & Cotizaciones por WhatsApp',
      subtitle: 'Cierra pedidos más rápido con presupuestos formales e imágenes elegantes.',
      description: 'Elabora presupuestos en menos de 1 minuto seleccionando tus productos o servicios ya costeados. Define porcentaje de reserva o abono (ej. 50%), saldo restante y fecha del evento.',
      bullets: [
        { icon: '📲', title: 'Envío Directo a WhatsApp', desc: 'Genera un mensaje formal prediseñado listo para enviar al cliente con un solo clic.' },
        { icon: '🖼️', title: 'Tarjeta Visual en Imagen (PNG)', desc: 'Descarga un comprobante gráfico moderno y profesional con tu logo para compartir por chat.' },
        { icon: '👤', title: 'Vinculación de Clientes', desc: 'Guarda clientes nuevos automáticamente al cotizar para recordar sus gustos y compras.' }
      ],
      quickTip: '✨ Puedes cambiar el estado del presupuesto a "Aprobada" para que celebre con confeti y se sume a tus métricas.'
    },
    {
      id: 'customers',
      tab: 'customers',
      icon: '👥',
      title: 'Clientes, Gustos & Recordatorios CRM',
      subtitle: 'Fideliza a tus clientes recordando sus fechas más importantes.',
      description: 'Tu agenda inteligente de clientes: guarda teléfonos, alergias alimentarias, sabores favoritos y el historial acumulado de lo que te han comprado (Lifetime Value).',
      bullets: [
        { icon: '🎂', title: 'Fechas Especiales & Alertas', desc: 'Anota cumpleaños de hijos, aniversarios o eventos. La app te avisará 7 días antes para anticipar su pedido.' },
        { icon: '💬', title: 'Mensajes Inteligentes', desc: 'Plantillas personalizadas de felicitación y recordatorio listas para enviar por WhatsApp.' },
        { icon: '⭐', title: 'Clientes VIP', desc: 'Marca a tus clientes frecuentes como favoritos para priorizar sus consultas.' }
      ],
      quickTip: '🔔 Puedes activar las Notificaciones Web para que la app te avise de cumpleaños incluso con el navegador cerrado.'
    },
    {
      id: 'simulator',
      tab: 'simulator',
      icon: '🧮',
      title: 'Simulador de Precios & Comisiones POS',
      subtitle: 'Comprende la estructura de tus precios y comisiones bancarias.',
      description: 'Experimenta con diferentes precios de venta y visualiza de inmediato qué porcentaje se va en costos directos, cuánto se descuenta por transbank/máquina POS y cuánta ganancia neta te queda en el bolsillo.',
      bullets: [
        { icon: '💳', title: 'Comisiones de Tarjeta', desc: 'Calcula el cobro real deduciendo el 1.5% o 3% de los lectores de tarjetas (Transbank, SumUp).' },
        { icon: '🚀', title: 'Proyección por Volumen', desc: 'Visualiza cuánto ganarás mensualmente si vendes 10, 25, 50 o 100 unidades de tu producto estrella.' },
        { icon: '➕', title: 'Traspaso a Cotización', desc: 'El precio simulado se puede transferir inmediatamente a un presupuesto formal.' }
      ],
      quickTip: '🎯 Un margen saludable para pastelería y repostería artesanal oscila entre el 40% y el 65%.'
    },
    {
      id: 'market-radar',
      tab: 'market-radar',
      icon: '🛒',
      title: 'Radar de Ofertas & Comparador de Precios',
      subtitle: 'Ahorra en tus compras cotizando en los principales supermercados.',
      description: 'Compara precios actualizados de las principales cadenas de Chile (Lider, Jumbo, Santa Isabel, Central Mayorista) para insumos clave como chocolate, crema, mantequilla, manjar y harinas.',
      bullets: [
        { icon: '🔍', title: 'Búsqueda en Vivo', desc: 'Consulta precios y stock de productos en supermercados cercanos.' },
        { icon: '📈', title: 'Evolutivo de Precios', desc: 'Detecta si un insumo ha subido o bajado en las últimas semanas para planificar tus compras.' }
      ],
      quickTip: '🛒 Antes de ir a comprar tus pedidos grandes, revisa el Radar para comprar donde esté más barato.'
    },
    {
      id: 'finance',
      tab: 'finance',
      onlyIfContainerExists: 'finance-view',
      icon: '📈',
      title: 'Finanzas, Gráficos & Punto de Equilibrio',
      subtitle: 'Monitorea la salud financiera y rentabilidad de tu negocio.',
      description: 'Panel avanzado de análisis económico que calcula automáticamente tus costos fijos, margen promedio y cuántas ventas necesitas realizar para alcanzar el punto de equilibrio.',
      bullets: [
        { icon: '📊', title: 'Gráficos de Rentabilidad', desc: 'Evolución mensual de ingresos brutos, costos variables y utilidad neta.' },
        { icon: '⚖️', title: 'Punto de Equilibrio', desc: 'Calcula el volumen exacto de ventas requerido para no operar con pérdidas.' }
      ],
      quickTip: '💼 En la versión de escritorio cuentas con gráficos ampliados para tus balances contables.'
    },
    {
      id: 'quick-action-and-settings',
      tab: 'settings',
      icon: '🚀',
      title: 'Botón Central (+), Gestos & Ajustes',
      subtitle: 'Diseñado para trabajar rápido con una sola mano en tu taller.',
      description: '¡Felicitaciones! Has completado el recorrido. Ya conoces las principales funciones de Cakekulator para hacer crecer tu taller.',
      bullets: [
        { icon: '➕', title: 'Botón Flotante Central (+)', desc: 'Toca el botón central en el dock móvil para crear recetas, insumos, cotizaciones o clientes desde cualquier pantalla.' },
        { icon: '👆', title: 'Gestos de Deslizamiento', desc: 'Desliza horizontalmente la pantalla con el dedo para cambiar de pestaña, o hacia abajo para cerrar cualquier modal.' },
        { icon: '⚙️', title: 'Personaliza tu Marca', desc: 'En esta pantalla de Configuración puedes subir tu logo (con herramienta IA para quitarle el fondo blanco) y conectar tu cuenta de Google.' }
      ],
      quickTip: '🎉 ¡Todo listo! Puedes cargar datos de demostración o empezar creando tu primera receta.'
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
    this.render();

    // Sincronizar la vista activa de la app con el paso del tutorial
    const step = steps[this.currentStepIndex];
    if (step && step.tab && typeof App !== 'undefined' && App.switchTab) {
      App.switchTab(step.tab);
    }
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
    if (step && step.tab && typeof App !== 'undefined' && App.switchTab) {
      App.switchTab(step.tab);
    }
    this.render();
  },

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.render();
  },

  finish(markAsCompleted = true) {
    this.isActive = false;
    this.isMinimized = false;

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
      container.classList.add('modal-closing');
      const dialog = container.querySelector(':scope > div');
      if (dialog) dialog.classList.add('modal-animate-out');
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

    // MODO MINIMIZADO: Pill flotante discreto en la parte superior para explorar la pantalla libremente
    if (this.isMinimized) {
      container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300';
      container.innerHTML = `
        <div class="bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-pink-500/40 backdrop-blur-md flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <span class="text-lg animate-bounce">🎓</span>
          <div class="text-xs">
            <span class="font-bold text-pink-400">Tutorial Guiado (${currentNumber}/${totalSteps}):</span>
            <span class="font-medium text-gray-200 ml-1">${step.title}</span>
          </div>
          <button type="button" onclick="TutorialModule.toggleMinimize()" class="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer active:scale-95 shadow-2xs">
            Reanudar ↗
          </button>
          <button type="button" onclick="TutorialModule.finish(true)" class="text-gray-400 hover:text-white text-xs p-1" title="Cerrar tutorial">
            ✕
          </button>
        </div>
      `;
      return;
    }

    // MODO COMPLETO: Modal interactivo con Spotlight no invasivo
    container.className = 'fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs modal-opening overflow-y-auto';
    container.onclick = (e) => {
      if (e.target === container) {
        // Tocar el fondo minimiza para poder ver la pantalla
        this.toggleMinimize();
      }
    };

    container.innerHTML = `
      <div class="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-pink-200 dark:border-slate-800 flex flex-col overflow-hidden modal-animate-in max-h-[92vh] sm:max-h-[85vh]">
        
        <!-- Barra de Progreso Superior -->
        <div class="w-full bg-gray-100 dark:bg-slate-800 h-1.5 overflow-hidden shrink-0">
          <div class="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-teal-400 transition-all duration-300" style="width: ${progressPct}%;"></div>
        </div>

        <!-- Encabezado del Paso -->
        <div class="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-slate-800/80 flex items-start justify-between gap-3 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-2xl shadow-md shadow-pink-500/20 shrink-0">
              ${step.icon}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                  Paso ${currentNumber} de ${totalSteps}
                </span>
                <span class="text-[11px] text-gray-400 font-semibold hidden sm:inline">
                  ${progressPct}% completado
                </span>
              </div>
              <h3 class="font-black text-base sm:text-lg text-gray-900 dark:text-gray-100 leading-tight truncate">
                ${step.title}
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button 
              type="button" 
              onclick="TutorialModule.toggleMinimize()" 
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-xs flex items-center gap-1"
              title="Minimizar para interactuar con la pantalla"
            >
              <span>👁️</span> <span class="hidden sm:inline text-[11px] font-semibold">Ver pantalla</span>
            </button>
            <button 
              type="button" 
              onclick="TutorialModule.finish(true)" 
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Cerrar tutorial"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Contenido Scrollable -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          
          <div class="space-y-1">
            <p class="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
              ${step.subtitle}
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              ${step.description}
            </p>
          </div>

          <!-- Puntos Clave / Funcionalidades Destacadas -->
          <div class="space-y-2">
            ${step.bullets.map(b => `
              <div class="p-3 rounded-2xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex items-start gap-3">
                <span class="text-xl shrink-0 p-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-2xs">${b.icon}</span>
                <div>
                  <h4 class="font-bold text-xs text-gray-900 dark:text-gray-100 leading-tight">${b.title}</h4>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">${b.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Consejo Rápido (Tip Pro) -->
          <div class="p-3 rounded-2xl bg-pink-50/70 dark:bg-slate-800/80 border border-pink-100 dark:border-slate-700 text-pink-900 dark:text-pink-200 text-xs flex items-center gap-2">
            <span class="leading-relaxed">${step.quickTip}</span>
          </div>

          <!-- Selector Rápido de Pestañas del Tutorial (Dots) -->
          <div class="flex items-center justify-center gap-1.5 pt-1">
            ${steps.map((s, idx) => `
              <button 
                type="button" 
                onclick="TutorialModule.goToStep(${idx})"
                class="h-2 rounded-full transition-all duration-200 cursor-pointer ${idx === this.currentStepIndex ? 'w-6 bg-pink-600' : 'w-2 bg-gray-200 dark:bg-slate-700 hover:bg-pink-300'}"
                title="${s.title}"
              ></button>
            `).join('')}
          </div>
        </div>

        <!-- Footer / Acciones de Navegación -->
        <div class="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          
          <button 
            type="button" 
            onclick="TutorialModule.prev()" 
            class="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
            ${this.currentStepIndex === 0 ? 'disabled' : ''}
          >
            <span>⬅️</span> <span class="hidden sm:inline">Anterior</span>
          </button>

          <div class="flex items-center gap-2">
            <button 
              type="button" 
              onclick="TutorialModule.finish(true)" 
              class="px-3 py-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-semibold text-xs transition cursor-pointer"
            >
              Saltar tutorial
            </button>

            <button 
              type="button" 
              onclick="TutorialModule.next()" 
              class="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-pink-600/25 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>${this.currentStepIndex === totalSteps - 1 ? '¡Listo, Empezar! 🎉' : 'Siguiente ➡️'}</span>
            </button>
          </div>

        </div>

      </div>
    `;
  }
};

window.TutorialModule = TutorialModule;
