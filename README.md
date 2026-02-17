# LicitIA - CRM Completo de Gestión de Licitaciones

Sistema CRM profesional que conecta productos del retail con licitaciones públicas. Captura productos de cualquier e-commerce, gestiona licitaciones y genera cotizaciones profesionales automáticamente.

## 🎯 Características Principales

- 🛒 **Captura Universal**: Extensión Chrome que extrae productos de cualquier e-commerce
- 📊 **Dashboard Completo**: Gestión de licitaciones, productos y cotizaciones
- 🤖 **IA Integrada**: Análisis automático de documentos y requisitos
- 📄 **Generador de PDFs**: Cotizaciones profesionales listas para Mercado Público
- 🔍 **Búsqueda Inteligente**: Matching automático de productos con ítems solicitados

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), TailwindCSS, Shadcn/UI
- **Backend/Database**: Supabase (PostgreSQL)
- **IA**: OpenAI API para análisis de documentos
- **Extensión**: Chrome Extension (Manifest V3)
- **Automatización**: Supabase Edge Functions
- **Futuro**: n8n + Google AI Studio para scoring automático

## 📋 Prerrequisitos

- Node.js 18+ 
- Cuenta de Supabase
- Google Chrome (para la extensión)
- API Key de OpenAI (opcional, para análisis con IA)
- API Key de ChileCompra (opcional, para ingesta automática)

## 🛠️ Instalación Rápida

### Paso 1: Base de Datos
Ejecuta las migraciones SQL en Supabase (en orden):
1. `001_initial_schema.sql`
2. `002_add_ai_summary_fields.sql`
3. `004_complete_crm_schema.sql`

### Paso 2: Dashboard
```bash
npm install
npm run dev
```

### Paso 3: Extensión Chrome
1. Ve a `chrome://extensions/`
2. Activa "Modo de desarrollador"
3. Carga la carpeta `chrome-extension`
4. Configura URL: `http://localhost:3000`
5. API Key: `licitia-dev-key-2024`

**📘 [Ver Guía Completa de Instalación →](INSTALACION_COMPLETA.md)**

## 📁 Estructura del Proyecto

```
LicitIA/
├── app/                          # Next.js App Router
│   ├── (dashboard)/dashboard/   # Dashboard principal
│   ├── api/
│   │   ├── licitaciones/        # Gestión de licitaciones
│   │   ├── productos/           
│   │   │   ├── capture/         # 🔥 Endpoint para extensión
│   │   │   └── route.ts         # CRUD productos
│   │   ├── cotizaciones/        # Crear y gestionar cotizaciones
│   │   └── ingest/              # Ingesta desde ChileCompra
│
├── chrome-extension/             # 🔥 Extensión Chrome Universal
│   ├── manifest.json
│   ├── content.js               # Extractor inteligente
│   ├── popup.html               # Configuración
│   └── icons/
│
├── components/
│   ├── ui/                      # Componentes Shadcn/UI
│   └── features/                # Componentes de negocio
│
├── lib/
│   ├── supabase/                # Clientes Supabase
│   ├── ai/                      # Procesamiento con IA
│   └── services/                # Servicios externos
│
├── supabase/
│   └── migrations/              # Migraciones SQL
│       ├── 001_initial_schema.sql
│       ├── 002_add_ai_summary_fields.sql
│       └── 004_complete_crm_schema.sql
│
└── types/                       # TypeScript definitions
```

## 🔑 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
CHILECOMPRA_API_KEY=your_chilecompra_api_key
```

## 📊 Modelo de Datos

- **licitaciones**: Información de licitaciones públicas (+ campos para IA futura)
- **documentos**: PDFs y documentos asociados
- **productos**: Catálogo de productos capturados desde e-commerce
- **cotizaciones**: Historial de cotizaciones generadas
- **cotizacion_items**: Items individuales de cada cotización
- **config_usuario**: Preferencias del usuario
- **api_keys**: Autenticación para extensión Chrome

## 🤖 Funcionalidades Actuales

### Gestión de Licitaciones
- ✅ Dashboard con tabla avanzada
- ✅ Filtros y búsqueda en tiempo real
- ✅ Ingesta desde API ChileCompra
- ✅ Datos de prueba para desarrollo

### Captura de Productos (Extensión Chrome)
- ✅ Detección automática en páginas de producto
- ✅ Extracción inteligente con múltiples estrategias:
  - Schema.org (JSON-LD)
  - Open Graph Protocol
  - Microdata HTML
  - Selectores CSS comunes
- ✅ Compatible con cualquier e-commerce
- ✅ Botón flotante no intrusivo
- ✅ Sincronización automática con CRM

### Análisis con IA (Opcional)
- ✅ Extracción de garantías de seriedad
- ✅ Identificación de plazos de entrega
- ✅ Análisis de criterios de evaluación
- ✅ Detección de riesgos

### Sistema
- ✅ Modo oscuro/claro
- ✅ Diseño responsive
- ✅ Arquitectura escalable

## 🔮 Roadmap (Próximamente)

- [ ] Módulo de cotizaciones con buscador inteligente
- [ ] Generador de PDFs profesionales
- [ ] Integración con n8n para scoring automático
- [ ] Matching de productos con ítems de licitación
- [ ] Dashboard de rentabilidad
- [ ] Notificaciones automáticas
- [ ] Análisis predictivo con IA

## 📝 Licencia

Uso personal
