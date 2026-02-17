# 🔌 Extensión Chrome - LicitIA

Capturador universal de productos para tu CRM de licitaciones.

## 🚀 Características

- ✅ **Universal**: Funciona en cualquier e-commerce
- 🎯 **Detección inteligente**: Usa múltiples estrategias
  - Schema.org (JSON-LD)
  - Open Graph Protocol
  - Microdata HTML
  - Selectores CSS comunes
- 🔒 **Seguro**: Autenticación con API Key
- ⚡ **Rápido**: Captura productos con un clic

## 📦 Instalación

### 1. Cargar extensión en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el **"Modo de desarrollador"** (esquina superior derecha)
3. Haz clic en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `chrome-extension`
5. La extensión aparecerá en tu barra de herramientas

### 2. Configurar extensión

1. Haz clic en el ícono de la extensión
2. Configura:
   - **URL de tu CRM**: `http://localhost:3000` (o tu URL de producción)
   - **API Key**: `licitia-dev-key-2024` (o tu key personalizada)
3. Haz clic en **"Guardar Configuración"**

## 🎯 Cómo Usar

1. Navega a cualquier producto en un e-commerce:
   - Lider.cl
   - Jumbo.cl
   - Paris.cl
   - Falabella.com
   - Amazon.com
   - ¡Y muchos más!

2. Si el producto es detectado, verás un botón flotante en la esquina inferior derecha:
   **"⚡ Enviar a LicitIA"**

3. Haz clic en el botón

4. El producto se guardará automáticamente en tu CRM

## 🔍 Sitios Compatibles

La extensión funciona en la mayoría de e-commerce que usen:
- ✅ Schema.org (recomendado para desarrolladores)
- ✅ Open Graph Protocol
- ✅ Microdata HTML5
- ✅ Estructura HTML estándar

### Ejemplos testeados:
- 🇨🇱 Lider.cl, Jumbo.cl, Paris.cl, Falabella.com
- 🌎 Amazon.com, MercadoLibre, AliExpress
- 🏪 Shopify stores
- 🛒 WooCommerce sites

## 🛠️ Desarrollo

### Estructura de archivos

```
chrome-extension/
├── manifest.json          # Configuración de la extensión
├── content.js            # Script de extracción e inyección
├── content.css           # Estilos del botón flotante
├── popup.html            # Interfaz de configuración
├── popup.js              # Lógica del popup
├── background.js         # Service worker
└── icons/                # Iconos de la extensión
```

### Modificar la extensión

1. Edita los archivos necesarios
2. Ve a `chrome://extensions/`
3. Haz clic en el botón de **"Actualizar"** (⟳) en la tarjeta de LicitIA

### Debugging

1. Inspecciona el popup: Click derecho en el ícono → "Inspeccionar"
2. Inspecciona content script: F12 en cualquier página → Console
3. Ve los logs del service worker: `chrome://extensions/` → "Service Worker"

## 🔒 Seguridad

- Las API keys se almacenan localmente usando `chrome.storage.sync`
- La comunicación usa HTTPS en producción
- Las claves nunca se exponen en el DOM

## 📝 Notas Técnicas

### Estrategias de Extracción (en orden de prioridad):

1. **Schema.org (JSON-LD)**: Más confiable
   ```html
   <script type="application/ld+json">
   { "@type": "Product", ... }
   </script>
   ```

2. **Open Graph**: Para compartir en redes
   ```html
   <meta property="og:title" content="..." />
   <meta property="og:price:amount" content="..." />
   ```

3. **Microdata**: HTML5 semántico
   ```html
   <div itemscope itemtype="http://schema.org/Product">
   ```

4. **Selectores CSS**: Fallback para sitios sin datos estructurados

### Datos Capturados:

- ✅ Nombre del producto
- ✅ Precio actual
- ✅ Descripción
- ✅ Imagen principal
- ✅ SKU (si disponible)
- ✅ Marca (si disponible)
- ✅ Categoría (si disponible)
- ✅ URL del producto
- ✅ Sitio de origen

## 🐛 Problemas Comunes

### El botón no aparece

- Verifica que estés en una página de producto
- Abre la consola (F12) y busca errores
- Algunos sitios dinámicos pueden tardar en cargar

### Error de API Key

- Verifica que la API key en el popup coincida con `.env.local`
- Por defecto: `licitia-dev-key-2024`

### Producto no se guarda

- Verifica que el servidor Next.js esté corriendo
- Comprueba la URL del CRM en la configuración
- Revisa la consola del navegador para errores

## 🆘 Soporte

Si encuentras problemas:
1. Verifica la consola del navegador (F12)
2. Revisa los logs del servidor Next.js
3. Asegúrate de que la migración SQL esté ejecutada

## 📚 Recursos

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Schema.org Product](https://schema.org/Product)
- [Open Graph Protocol](https://ogp.me/)
