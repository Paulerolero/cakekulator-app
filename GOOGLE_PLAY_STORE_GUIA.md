# Guía de Publicación en Google Play Store (TWA / PWABuilder)

Cakekulator está configurada con dos aplicaciones web progresivas (PWA) independientes listas para compilarse y publicarse en Google Play Store:

| Aplicación | Nombre en Play Store | URL de Origen | ID de Paquete Sugerido |
| :--- | :--- | :--- | :--- |
| **Vendedor / Admin** | Cakekulator Vendedor | `https://cakekulator-bd.web.app/app` | `cl.cakekulator.admin` |
| **Cliente / Catálogo** | Cakekulator Clientes | `https://cakekulator-bd.web.app/cliente` | `cl.cakekulator.cliente` |

---

## Método Más Rápido y Recomendado: [PWABuilder.com](https://www.pwabuilder.com)

PWABuilder es la herramienta gratuita de Microsoft avalada oficialmente por Google para empaquetar PWAs en archivos `.aab` (Android App Bundle) listos para la Play Store.

### Paso 1: Generar el paquete de Vendedores
1. Abre [https://www.pwabuilder.com](https://www.pwabuilder.com).
2. Ingresa la URL: `https://cakekulator-bd.web.app/app`.
3. Haz clic en **Start** y verifica que la puntuación de PWA sea superior a 100 (ya está 100% optimizada).
4. Haz clic en **Package for Stores** > **Android** > **Generate Package**.
5. Configura los datos:
   - **Package ID**: `cl.cakekulator.admin`
   - **App name**: `Cakekulator Vendedor`
   - **Short name**: `Cake Vendedor`
   - **Display Mode**: `Standalone` o `Fullscreen`
   - **Signing key**: Si es tu primera vez, selecciona *"Generate new key"* y descarga el archivo `.keystore` (¡Guárdalo en un lugar seguro!).
6. Haz clic en **Download Package**. Obtendrás un archivo ZIP que contiene el `.aab` listo para subir a Google Play Console.

### Paso 2: Generar el paquete de Clientes
1. En [PWABuilder.com](https://www.pwabuilder.com), ingresa la URL: `https://cakekulator-bd.web.app/cliente`.
2. Repite el proceso con:
   - **Package ID**: `cl.cakekulator.cliente`
   - **App name**: `Cakekulator Clientes`
   - **Short name**: `Cake Clientes`
3. Descarga el paquete `.aab`.

---

## Paso 3: Vincular el Dominio con Digital Asset Links (Eliminar barra del navegador)

Para que Android abra la app en pantalla completa sin barra de direcciones de Chrome:
1. En el ZIP de PWABuilder viene un archivo llamado `assetlinks.json` con la huella digital SHA-256 de tu clave.
2. Abre el archivo `.well-known/assetlinks.json` en este proyecto y copia dicha huella SHA256 reemplazando `REPLACE_WITH_...`.
3. Despliega con:
   ```bash
   npx firebase-tools deploy --only hosting
   ```
4. Google Play verificará automáticamente que el dominio `https://cakekulator-bd.web.app` te pertenece.

---

## Paso 4: Subir a Google Play Console
1. Ingresa a [Google Play Console](https://play.google.com/console).
2. Haz clic en **Crear App**:
   - Nombre: `Cakekulator Vendedor` (o Clientes).
   - Idioma: Español.
   - Tipo: Aplicación > Gratis.
3. En **Producción** (o Pruebas internas): Sube el archivo `.aab` generado por PWABuilder.
4. Completa la ficha de la tienda:
   - **Ícono**: `assets/icons/icon-512.png` (o `icon-user-512.png`).
   - **Gráfico de funciones**: 1024x500 px.
   - **Capturas de pantalla**: 2 a 4 capturas en resolución de celular.
5. Envía a revisión. ¡Listo!
