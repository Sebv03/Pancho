# 📘 Guía de Instalación Completa - LicitIA CRM

Sistema CRM completo para gestión de licitaciones públicas con captura automática de productos desde e-commerce.

## 🎯 Componentes del Sistema

1. **Dashboard Web** (Next.js + Supabase)
2. **Extensión Chrome** (Captura de productos)
3. **Base de Datos** (Supabase PostgreSQL)
4. **APIs** (Next.js API Routes)

## 📋 Prerequisitos

- ✅ Node.js 18+
- ✅ Cuenta de Supabase
- ✅ Google Chrome
- ✅ (Opcional) Cuenta de OpenAI para análisis con IA

## 🚀 Paso 1: Configurar Base de Datos

### 1.1 Ejecutar Migraciones

Ve a tu Supabase Dashboard y ejecuta las migraciones **EN ORDEN**:

1. **SQL Editor** → Pega `supabase/migrations/001_initial_schema.sql` → Run
2. **SQL Editor** → Pega `supabase/migrations/002_add_ai_summary_fields.sql` → Run
3. **SQL Editor** → Pega `supabase/migrations/004_complete_crm_schema.sql` → Run

Deberías ver: "Success. No rows returned" para cada una.

### 1.2 Verificar Tablas Creadas

Ve a **Table Editor** y verifica que existen:
- ✅ `licitaciones`
- ✅ `documentos`
- ✅ `productos`
- ✅ `cotizaciones`
- ✅ `cotizacion_items`
- ✅ `config_usuario`
- ✅ `api_keys`

## 🔧 Paso 2: Configurar Variables de Entorno

El archivo `.env.local` ya debería existir. Verifica que tenga:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ldqpkveyonltzcdshvsf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# OpenAI (Opcional)
OPENAI_API_KEY=sk-tu-api-key-aqui

# ChileCompra
CHILECOMPRA_API_KEY=F8537A18-6766-4DEF-9E59-426B4FEE2844
CHILECOMPRA_API_URL=https://api.mercadopublico.cl

# Extensión Chrome
EXTENSION_API_KEY=licitia-dev-key-2024

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 💻 Paso 3: Iniciar el Dashboard

```bash
# Si no está corriendo, inicia el servidor
npm run dev
```

Abre: http://localhost:3000/dashboard

## 🔌 Paso 4: Instalar Extensión Chrome

### 4.1 Cargar extensión

1. Abre Chrome
2. Ve a `chrome://extensions/`
3. Activa **"Modo de desarrollador"** (toggle arriba a la derecha)
4. Clic en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta `chrome-extension` de tu proyecto
6. La extensión aparecerá con el nombre "LicitIA - Capturador Universal"

### 4.2 Configurar extensión

1. Haz clic en el ícono de la extensión (puzzle piece en Chrome)
2. Pin la extensión LicitIA para acceso rápido
3. Haz clic en el ícono de LicitIA
4. Configura:
   - URL: `http://localhost:3000`
   - API Key: `licitia-dev-key-2024`
5. Clic en **"Guardar Configuración"**

## ✅ Paso 5: Probar el Sistema

### 5.1 Agregar Datos de Prueba

1. Ve al dashboard: http://localhost:3000/dashboard
2. Clic en **"Datos de Prueba"**
3. Deberías ver 6 licitaciones de ejemplo

### 5.2 Capturar un Producto

1. Navega a cualquier producto en:
   - https://www.lider.cl
   - https://www.paris.cl
   - https://www.falabella.com
   - O cualquier otro e-commerce

2. Deberías ver un botón flotante morado: **"⚡ Enviar a LicitIA"**

3. Haz clic en el botón

4. Verás una notificación: "✅ Producto agregado a LicitIA"

5. Ve al dashboard y verifica que el producto se guardó

### 5.3 Ver Productos Capturados

En el dashboard, deberías poder:
- Ver lista de productos
- Buscar productos
- Editar precios
- Ver de qué sitio vienen

## 📊 Estructura del Sistema

```
LicitIA/
├── app/                          # Next.js App
│   ├── (dashboard)/             
│   │   └── dashboard/           # Dashboard principal
│   ├── api/
│   │   ├── licitaciones/        # API licitaciones
│   │   ├── productos/           
│   │   │   ├── capture/         # 🔥 Endpoint extensión
│   │   │   └── route.ts         # CRUD productos
│   │   ├── cotizaciones/        # Gestión cotizaciones
│   │   └── ingest/              # Ingesta ChileCompra
│   
├── chrome-extension/             # 🔥 Extensión Chrome
│   ├── manifest.json
│   ├── content.js               # Extractor universal
│   ├── content.css
│   ├── popup.html
│   ├── popup.js
│   └── background.js
│
├── supabase/
│   └── migrations/              # Migraciones SQL
│       ├── 001_initial_schema.sql
│       ├── 002_add_ai_summary_fields.sql
│       └── 004_complete_crm_schema.sql
│
└── .env.local                   # Variables de entorno
```

## 🎨 Flujo Completo del Sistema

```
┌─────────────────┐
│   E-commerce    │ (Lider, Paris, etc.)
└────────┬────────┘
         │ 1. Usuario visita producto
         │
    ┌────▼──────────┐
    │   Extensión   │ (Detecta y extrae datos)
    │    Chrome     │
    └────┬──────────┘
         │ 2. POST /api/productos/capture
         │
    ┌────▼──────────┐
    │   Next.js     │ (Valida y guarda)
    │   Backend     │
    └────┬──────────┘
         │ 3. Inserta en Supabase
         │
    ┌────▼──────────┐
    │   Supabase    │ (PostgreSQL)
    │   Database    │
    └────┬──────────┘
         │ 4. Query desde dashboard
         │
    ┌────▼──────────┐
    │   Dashboard   │ (Gestión y cotizaciones)
    │     Web       │
    └───────────────┘
```

## 🔮 Próximas Funcionalidades

1. **Módulo de Cotizaciones**
   - Crear cotizaciones desde licitaciones
   - Buscar y asignar productos
   - Calcular totales automáticos

2. **Generador de PDF**
   - Formato profesional (estilo ALBATERRA SPA)
   - Descarga directa
   - Listo para Mercado Público

3. **IA Automática** (Futuro con n8n)
   - Scoring de licitaciones
   - Matching automático de productos
   - Análisis de rentabilidad

## 🐛 Solución de Problemas

### Extensión no aparece en Chrome
- Verifica que el "Modo de desarrollador" esté activado
- Recarga la extensión desde `chrome://extensions/`

### Botón flotante no aparece
- Solo aparece en páginas de productos
- Abre la consola (F12) para ver errores
- Verifica que estés en un e-commerce compatible

### Producto no se guarda
- Verifica que el servidor esté corriendo (`npm run dev`)
- Comprueba la URL y API Key en la extensión
- Revisa la consola del navegador

### No se ven las licitaciones
- Asegúrate de ejecutar la migración 004
- Haz clic en "Datos de Prueba" para agregar ejemplos

## 📞 Soporte

Si tienes problemas:
1. Verifica que todas las migraciones estén ejecutadas
2. Revisa los logs del servidor (`npm run dev`)
3. Abre la consola del navegador (F12)
4. Verifica las variables de entorno

## 🎉 ¡Listo!

Tu CRM de licitaciones está configurado y funcionando. Ahora puedes:

1. ✅ Capturar productos de cualquier e-commerce
2. ✅ Gestionar licitaciones
3. ✅ Crear cotizaciones
4. ✅ Generar PDFs profesionales

¡A facturar con el Estado! 🚀
