# Ejecutar LicitIA en local

Para usar la app y la extensión en tu PC sin desplegar en internet.

## Qué necesitas instalar

Solo **Node.js** (incluye npm):

1. Ve a https://nodejs.org
2. Descarga la versión **LTS** (recomendada)
3. Instala (siguiente, siguiente…)
4. Reinicia la terminal o el PC si hace falta

## Iniciar la app

### Opción 1: Doble clic en el .bat (más fácil)

1. Haz doble clic en **`iniciar-local.bat`**
2. La primera vez instalará las dependencias (1–2 minutos)
3. Después abrirá el servidor en http://localhost:3000
4. Abre Chrome y entra en esa URL

### Opción 2: Desde la terminal

```bash
npm install    # solo la primera vez
npm run dev   # inicia el servidor
```

## Configurar la extensión

1. Carga la extensión en Chrome (ver `chrome-extension/INSTALACION_SIN_NADA.md`)
2. En el popup de la extensión:
   - **URL de tu CRM**: `http://localhost:3000`
   - **API Key**: la que tengas en `.env.local` (ej: `licitia-dev-key-2024`)

## Requisitos

| Qué | Para qué |
|-----|----------|
| **Node.js** (LTS) | Ejecutar la app |
| **Google Chrome** | Usar la extensión |
| **Archivo .env.local** | Configuración (Supabase, API Key). Copia de `.env.example` si existe |

## Problemas

**"Node.js no está instalado"**  
- Instala Node.js desde nodejs.org y vuelve a ejecutar el .bat

**"npm install falla"**  
- Comprueba tu conexión a internet  
- Ejecuta el .bat como administrador

**La extensión no guarda productos**  
- Asegúrate de que el servidor esté corriendo (ventana del .bat abierta)  
- Revisa que la URL en la extensión sea `http://localhost:3000`
