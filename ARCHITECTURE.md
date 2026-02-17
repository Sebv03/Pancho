# Arquitectura del Proyecto LicitIA

## Estructura de Directorios

```
LicitIA/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Grupo de rutas protegidas
│   │   ├── dashboard/          # Dashboard principal
│   │   └── layout.tsx          # Layout del dashboard
│   ├── api/                     # API Routes
│   │   ├── ai/
│   │   │   └── analyze-document/ # Análisis de documentos con IA
│   │   ├── ingest/              # Ingesta de licitaciones
│   │   └── licitaciones/        # CRUD de licitaciones
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página de inicio (redirige a dashboard)
│
├── components/                   # Componentes React
│   ├── ui/                      # Componentes Shadcn/UI base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── features/                # Componentes de features específicas
│   │   └── licitaciones-table.tsx
│   ├── theme-provider.tsx       # Provider de tema
│   └── theme-toggle.tsx         # Toggle de tema claro/oscuro
│
├── lib/                          # Utilidades y configuraciones
│   ├── supabase/                # Clientes de Supabase
│   │   ├── client.ts           # Cliente del navegador
│   │   ├── server.ts           # Cliente del servidor
│   │   └── admin.ts            # Cliente admin (service role)
│   ├── ai/                      # Módulo de IA
│   │   └── processor.ts        # Procesador de documentos con OpenAI
│   ├── services/                # Servicios externos
│   │   └── chilecompra.ts      # Cliente de API ChileCompra
│   └── utils/                   # Utilidades generales
│       └── cn.ts               # Utilidad para clases CSS
│
├── types/                        # TypeScript types
│   ├── database.ts             # Tipos de la base de datos
│   └── index.ts                # Tipos generales
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts            # Hook para notificaciones
│
├── supabase/                     # Configuración de Supabase
│   ├── migrations/              # Migraciones SQL
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_ai_summary_fields.sql
│   └── functions/               # Edge Functions
│       └── ingest-licitaciones/
│           └── index.ts
│
├── scripts/                      # Scripts de automatización
│   └── ingest-licitaciones.py # Script Python para ingesta
│
└── [archivos de configuración]
```

## Flujo de Datos

### 1. Ingesta de Licitaciones

```
ChileCompra API → API Route (/api/ingest) → Supabase Database
```

- El endpoint `/api/ingest` consume la API de ChileCompra
- Normaliza los datos al formato de nuestra BD
- Inserta o actualiza licitaciones en Supabase

### 2. Análisis con IA

```
PDF Document → Extract Text → OpenAI API → Process → Update Database
```

- El endpoint `/api/ai/analyze-document` recibe un documento
- Extrae el texto del PDF usando `pdf-parse`
- Envía el contenido a OpenAI para análisis estructurado
- Actualiza la licitación con el resumen generado

### 3. Visualización

```
Supabase Database → API Route (/api/licitaciones) → React Components → UI
```

- El dashboard consume `/api/licitaciones` con filtros
- Los componentes React renderizan los datos
- Los usuarios pueden filtrar, buscar y analizar

## Capas de la Aplicación

### 1. Presentación (UI Layer)
- **Componentes**: `components/ui/`, `components/features/`
- **Páginas**: `app/(dashboard)/dashboard/`
- Responsabilidades: Renderizado, interacción del usuario

### 2. Lógica de Negocio (Business Layer)
- **Servicios**: `lib/services/`, `lib/ai/`
- **API Routes**: `app/api/`
- Responsabilidades: Procesamiento, validación, transformación

### 3. Datos (Data Layer)
- **Cliente Supabase**: `lib/supabase/`
- **Migraciones**: `supabase/migrations/`
- Responsabilidades: Persistencia, consultas

## Seguridad

- **RLS (Row Level Security)**: Activado en todas las tablas
- **Service Role Key**: Solo usado en servidor, nunca expuesto al cliente
- **API Keys**: Almacenadas en variables de entorno
- **Validación**: Zod para validación de esquemas

## Escalabilidad

- **Edge Functions**: Para tareas pesadas y programadas
- **Paginación**: Implementada en todas las consultas
- **Índices**: Optimizados para búsquedas frecuentes
- **Caching**: Next.js caching automático para rutas estáticas

## Próximos Pasos

1. Implementar autenticación completa con Supabase Auth
2. Agregar sistema de notificaciones
3. Implementar caché de análisis de IA
4. Agregar tests unitarios y de integración
5. Configurar CI/CD
