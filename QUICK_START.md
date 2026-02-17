# 🚀 Guía Rápida de Inicio - LicitIA

## ✅ Paso 1: Configurar Variables de Entorno

Ya creamos el archivo `.env.local` para ti. Ahora necesitas completarlo con tus credenciales:

### 1.1 Obtener credenciales de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Mantén esto secreto)

### 1.2 Obtener API Key de OpenAI:

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Cópiala en `OPENAI_API_KEY`

### 1.3 Obtener API Key de ChileCompra (Opcional para empezar):

1. Ve a [Mercado Público](https://www.mercadopublico.cl)
2. Regístrate y obtén tu API key
3. Cópiala en `CHILECOMPRA_API_KEY`

**Nota:** Puedes dejar la API key de ChileCompra como placeholder por ahora si solo quieres probar la interfaz.

---

## ✅ Paso 2: Verificar Instalación

Las dependencias ya están instaladas. Verifica que todo esté correcto:

```bash
npm run dev
```

Si hay algún error, ejecuta:
```bash
npm install
```

---

## ✅ Paso 3: Iniciar el Servidor

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

Deberías ver el dashboard de LicitIA.

---

## ✅ Paso 4: Probar la Aplicación

### 4.1 Ver el Dashboard
- El dashboard debería cargar (aunque esté vacío si no hay licitaciones)

### 4.2 Ingresar Licitaciones (si configuraste ChileCompra)
1. Haz clic en el botón **"Ingresar Licitaciones"**
2. Espera a que se procesen
3. Deberías ver las licitaciones en la tabla

### 4.3 Probar el Tema Oscuro/Claro
- Haz clic en el ícono de sol/luna en la esquina superior derecha

---

## 🔧 Solución de Problemas

### Error: "Supabase client not initialized"
- Verifica que `.env.local` existe y tiene los valores correctos
- Asegúrate de que las URLs y keys sean correctas (sin espacios extra)

### Error: "Cannot find module"
- Ejecuta: `npm install`

### El dashboard está vacío
- Esto es normal si no has ingresado licitaciones aún
- Puedes agregar datos manualmente desde Supabase Dashboard para probar

### Error al ingresar licitaciones
- Verifica que `CHILECOMPRA_API_KEY` sea válida
- O deja ese campo como placeholder y agrega datos manualmente

---

## 📝 Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Iniciar el servidor
3. ⏭️ Ingresar algunas licitaciones de prueba
4. ⏭️ Probar el análisis con IA (necesitas agregar documentos primero)

---

## 💡 Tips

- Puedes agregar licitaciones manualmente desde Supabase Dashboard → Table Editor → licitaciones
- Para probar el análisis con IA, primero necesitas agregar documentos a las licitaciones
- El proyecto está listo para desarrollo, puedes empezar a personalizarlo
