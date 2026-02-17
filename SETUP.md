# Guía de Configuración - LicitIA

## Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Supabase creada
- API Key de OpenAI
- API Key de ChileCompra (Mercado Público)

## Paso 1: Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el dashboard
3. Ejecuta las migraciones en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_ai_summary_fields.sql`

## Paso 2: Configurar Variables de Entorno

1. Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` y completa las siguientes variables:

```env
# Supabase (obtén estos valores en Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# OpenAI (obtén en https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-tu-api-key

# ChileCompra (obtén en https://www.mercadopublico.cl)
CHILECOMPRA_API_KEY=tu-api-key-chilecompra
CHILECOMPRA_API_URL=https://api.mercadopublico.cl
```

## Paso 3: Instalar Dependencias

```bash
npm install
```

## Paso 4: Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Paso 5: Ingerir Datos Iniciales

### Opción A: Usando la API Route (Recomendado)

1. Ve al dashboard en `http://localhost:3000/dashboard`
2. Haz clic en el botón **"Ingresar Licitaciones"**
3. Esto ejecutará la ingesta desde la API de ChileCompra

### Opción B: Usando el Script de Python

```bash
# Instalar dependencias de Python
pip install requests python-dotenv supabase

# Ejecutar el script
python scripts/ingest-licitaciones.py --pagina 1 --fecha-desde 2024-01-01
```

### Opción C: Usando Supabase Edge Function

1. Despliega la función en Supabase:
```bash
supabase functions deploy ingest-licitaciones
```

2. Llama a la función:
```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/ingest-licitaciones \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pagina": 1, "fechaDesde": "2024-01-01"}'
```

## Paso 6: Analizar Documentos con IA

1. Primero, necesitas agregar documentos a las licitaciones:
   - Puedes hacerlo manualmente desde Supabase Dashboard
   - O implementar un endpoint para subir documentos

2. Una vez que tengas documentos:
   - Haz clic en el ícono de IA en la tabla de licitaciones
   - O llama directamente a `/api/ai/analyze-document`

## Verificación

Para verificar que todo funciona:

1. ✅ El dashboard carga sin errores
2. ✅ Puedes ver licitaciones (si las hay en la BD)
3. ✅ Los filtros funcionan
4. ✅ El toggle de tema claro/oscuro funciona
5. ✅ La ingesta de licitaciones funciona

## Troubleshooting

### Error: "Supabase client not initialized"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que `.env.local` existe y tiene los valores correctos

### Error: "OpenAI API error"
- Verifica que tu API key de OpenAI sea válida
- Asegúrate de tener créditos en tu cuenta de OpenAI

### Error: "ChileCompra API error"
- Verifica que tu API key de ChileCompra sea válida
- Revisa que la URL de la API sea correcta

### Las migraciones fallan
- Asegúrate de ejecutarlas en orden
- Verifica que no existan conflictos con datos existentes

## Próximos Pasos

- Configurar autenticación de usuarios
- Implementar sistema de notificaciones
- Agregar más filtros y búsquedas avanzadas
- Configurar tareas programadas para ingesta automática
