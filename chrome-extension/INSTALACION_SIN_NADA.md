# Instalar la extensión sin tener nada instalado

Solo necesitas **Google Chrome**. No hace falta Node.js, npm ni ningún programa adicional.

> **Importante:** La extensión envía los productos a una app (servidor). Hay dos formas de que funcione:
>
> - **App desplegada** (Vercel, etc.): La app está en internet. Nadie necesita tener nada corriendo en su PC.
> - **App en local**: Alguien debe tener el servidor corriendo (`npm run dev`). La extensión apunta a `http://localhost:3000`. Solo funciona en la misma PC donde corre el servidor.

## Paso 1: Obtener la extensión

**Opción A – Desde GitHub (recomendado)**  
1. Ve a https://github.com/Sebv03/Pancho  
2. Haz clic en **Code** → **Download ZIP**  
3. Extrae el ZIP en una carpeta (por ejemplo, `Escritorio\LicitIA`)  
4. Entra en la carpeta `chrome-extension` dentro del proyecto  

**Opción B – Si te envían un ZIP**  
1. Descarga el archivo `albaterra-extension.zip`  
2. Clic derecho → **Extraer todo** (o descomprimir)  
3. Dentro encontrarás la carpeta `chrome-extension` con todos los archivos  

## Paso 2: Cargar la extensión en Chrome

1. Abre **Google Chrome**  
2. En la barra de direcciones escribe: `chrome://extensions/`  
3. Activa **Modo de desarrollador** (esquina superior derecha)  
4. Haz clic en **Cargar extensión sin empaquetar**  
5. Selecciona la carpeta `chrome-extension` (si descargaste el ZIP, es la carpeta que se creó al extraer)  
6. La extensión aparecerá en la barra de herramientas  

## Paso 3: Configurar la extensión

1. Haz clic en el ícono de la extensión (Albaterra)  
2. Completa:
   - **URL de tu CRM**: 
     - Si la app está desplegada: `https://tu-app.vercel.app`
     - Si corre en tu PC: `http://localhost:3000` (el servidor debe estar corriendo con `npm run dev`)
   - **API Key**: la clave que te haya dado el administrador (ej: `licitia-dev-key-2024`)
3. Haz clic en **Guardar configuración**  

## Paso 4: Usar la extensión

1. Entra en cualquier tienda online (Lider, Falabella, Amazon, etc.)  
2. Abre la página de un producto  
3. Verás un botón flotante **"Enviar a Albaterra"**  
4. Haz clic para guardar el producto en tu catálogo  

---

## Requisitos

- **Google Chrome** (última versión recomendada)  
- **La app debe estar accesible** de una de estas formas:
  - Desplegada en internet (Vercel, etc.), o
  - Corriendo en local (`npm run dev`) en la misma PC donde usas la extensión
- URL y API Key proporcionadas por el administrador  

## Problemas frecuentes

**No aparece el botón**  
- Comprueba que estés en una página de producto  
- Recarga la página (F5)  

**Error al guardar**  
- Revisa que la URL y la API Key sean correctas  
- Si usas localhost: comprueba que el servidor esté corriendo (`npm run dev`)  
- Si usas una URL desplegada: comprueba que la app esté accesible en internet  

**La extensión no se carga**  
- Asegúrate de haber seleccionado la carpeta correcta (la que contiene `manifest.json`)  
- Activa el Modo de desarrollador  
