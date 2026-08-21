# 🧁 Cakekulator - App Móvil de Costeo y Presupuestos para Pastelería

**Cakekulator** es una aplicación móvil moderna, ligera y optimizada para **Android** (funciona como PWA instalable con total soporte offline), diseñada específicamente para pasteleros, reposteros y emprendedores gastronómicos.

---

## 🌟 Características Principales

### 1. 📦 Catálogo de Insumos & Empaques
- Registro de ingredientes con formato de compra (ej. Harina 1 kg a $1.200, Huevos bandeja 30u a $6.500, Mantequilla 250g a $2.500).
- Conversión inteligente de unidades (`g`, `kg`, `ml`, `L`, `u`, cucharadas, tazas).
- Cálculo automático del costo por gramo, mililitro o unidad base.
- Soporte para merma / desperdicio (ej. 10% en cáscaras de frutas).

### 2. 🎂 Fichas Técnicas & Costeo de Recetas
- Modelado para todo tipo de repostería:
  - **Por Unidades:** Alfajores, Profiteroles, Galletas, Cupcakes, Tartaletas.
  - **Por Porciones (Tortas):** Tortas enteras con cálculo automático de costo por porción individual.
- Costeo integral de 4 factores:
  1. **Materia Prima / Insumos.**
  2. **Empaque y Presentación** (cajas, bases doradas, cintas, domos, stickers).
  3. **Mano de Obra** (horas de trabajo dedicadas × tarifa horaria).
  4. **Costos Indirectos** (gas del horno, electricidad, agua, arriendo prorrateado).

### 3. 📊 Simulador Dinámico de Precios y Rentabilidad
- **Slider interactivo de Precio de Venta:** Mueve el precio y mira de inmediato:
  - Ganancia neta de bolsillo en dinero ($).
  - Margen de ganancia sobre venta (%).
  - Markup o sobrecargo sobre costo (%).
  - Multiplicador de costo (ej. 2.5x).
- **Sugeridor de Precio por Margen Meta:** Ingresa tu margen deseado (ej. 40% o 50%) y obtén el precio recomendado al instante.
- **Simulación de Comisiones por Tarjeta / POS:** Evalúa el impacto de cobrar con Transbank, Redelcom o Mercado Pago (ej. 3.19%).
- **Matriz de Proyección de Volumen:** Proyecta tus ingresos si vendes 10, 50, 100 o 250 unidades al mes.

### 4. 📋 Generador de Presupuestos / Cotizaciones
- Genera cotizaciones para clientes con lista de productos, descuentos y notas.
- **Cálculo de Abono para Reserva (50%)** y saldo pendiente al entregar.
- **Botón Enviar a WhatsApp:** Genera un mensaje con formato y emojis listo para enviar.
- **Exportación a PDF / Impresión:** Formato de comprobante limpio con los datos y redes de tu pastelería.

### 5. 📱 Experiencia Android 100% Offline (PWA)
- Funciona sin internet una vez abierta.
- Instalable como App en la pantalla de inicio de Android con icono propio.
- Copias de seguridad en formato `.JSON` para respaldar o transferir tus datos.

---

## 🚀 Cómo Usar e Instalar en Android

### Paso 1: Iniciar el Servidor Local
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
python server.py
```

El servidor te mostrará dos direcciones:
- Para tu computador: `http://localhost:8080`
- Para tu celular Android: `http://<TU_IP_LOCAL>:8080` (ejemplo: `http://192.168.1.15:8080`)

### Paso 2: Abrir e Instalar en tu Celular Android
1. Conecta tu celular a la misma red Wi-Fi que tu computador.
2. Abre **Google Chrome** en Android e ingresa la dirección mostrada (ej. `http://192.168.1.15:8080`).
3. Toca el menú de tres puntos (⋮) en Chrome y selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"** (o presiona el botón **📲 Instalar App** en la barra superior).
4. ¡Listo! La app se instalará en tu celular con icono propio y funcionará incluso sin conexión a internet.

---

## 📂 Estructura de Archivos

```
pasteleria-app/
├── index.html              # Estructura principal de la app (SPA responsive)
├── manifest.json           # Manifiesto PWA para Android
├── sw.js                   # Service Worker para caché offline
├── server.py               # Servidor local de prueba
├── README.md               # Documentación y guía de uso
├── css/
│   └── styles.css          # Estilos y tipografía pastelera
├── js/
│   ├── app.js              # Controlador principal y navegación
│   ├── db.js               # Persistencia LocalStorage y motor de cálculo
│   ├── ingredients.js      # Módulo de catálogo de insumos
│   ├── recipes.js          # Módulo de recetas y fichas técnicas
│   ├── simulator.js        # Módulo de simulación de precios y márgenes
│   ├── quotes.js           # Módulo de presupuestos, WhatsApp y PDF
│   └── templates.js        # Recetas e insumos precargados de ejemplo
└── assets/
    └── icons/              # Iconos de la aplicación Android
```
