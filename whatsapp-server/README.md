# 📲 Cakekulator - Servidor de WhatsApp Bot Multi-Usuario

Servidor backend en Node.js que permite a cada usuario de Cakekulator vincular su propio número de WhatsApp escaneando un código QR desde la aplicación web / PWA y responder cotizaciones de manera 100% automática con **Google Gemini IA** y su catálogo de recetas.

---

## 🌟 Características

1. **Multi-Sesión Aislada por Usuario (`userId`)**:
   - Cada pastelero con cuenta en Cakekulator genera y escanea su propio código QR.
   - Las sesiones y credenciales de autenticación de WhatsApp se guardan en carpetas independientes (`sessions/user_<uid>`).
2. **Cotización Inteligente con Catálogo Propio**:
   - Consulta en tiempo real las recetas, porciones y precios de venta definidos por ese usuario en Firestore.
   - Interpreta consultas en lenguaje natural (ej: *"torta para 20 personas y docena de cupcakes"*).
   - Calcula totales, abono del 50% (o porcentaje configurado) y condiciones de entrega.
3. **Registro Automático de Presupuestos**:
   - Crea automáticamente la cotización en Firestore para que el pastelero la vea en su app.
4. **Panel de Control y Simulador**:
   - Interfaz visual en Cakekulator para pausar/activar auto-respuesta, ver logs en vivo y probar respuestas antes de conectar clientes reales.

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd whatsapp-server
npm install
```

### 2. Configuración (`.env`)
Revisa el archivo `.env`:
```env
PORT=3001
GEMINI_API_KEY=tu_gemini_api_key
GEMINI_MODEL=gemini-3.7-flash
FIREBASE_PROJECT_ID=cakekulator-bd
SESSIONS_DIR=./sessions
```

### 3. Iniciar el servidor
```bash
npm start
```

El servidor quedará escuchando en `http://localhost:3001`.

---

## 📱 Cómo Vincular tu WhatsApp desde Cakekulator

1. Abre **Cakekulator** en tu navegador (`http://localhost:8080`).
2. Inicia sesión con tu cuenta de Google.
3. Dirígete a la pestaña **💬 Bot WA** (o pulsa el banner en Inicio).
4. Haz clic en **⚡ Generar Código QR**.
5. Abre WhatsApp en tu celular > **Dispositivos vinculados** > **Vincular un dispositivo** y escanea el código QR en pantalla.
6. ¡Listo! Tu estado cambiará a `🟢 Conectado (+569...)` y el bot responderá las cotizaciones que te envíen automáticamente.
