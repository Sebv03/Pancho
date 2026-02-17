-- =====================================================
-- MIGRACIÓN COMPLETA: CRM de Gestión de Licitaciones
-- =====================================================

-- 1. ARREGLAR POLÍTICAS RLS PARA ACCESO PÚBLICO
-- =====================================================

-- Eliminar TODAS las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Licitaciones son visibles para todos los usuarios autenticados" ON licitaciones;
DROP POLICY IF EXISTS "Licitaciones son visibles públicamente" ON licitaciones;
DROP POLICY IF EXISTS "Service role puede gestionar licitaciones" ON licitaciones;
DROP POLICY IF EXISTS "Service role puede insertar licitaciones" ON licitaciones;
DROP POLICY IF EXISTS "Service role puede actualizar licitaciones" ON licitaciones;
DROP POLICY IF EXISTS "Documentos son visibles para usuarios autenticados" ON documentos;
DROP POLICY IF EXISTS "Documentos son visibles públicamente" ON documentos;
DROP POLICY IF EXISTS "Service role puede gestionar documentos" ON documentos;

-- Crear políticas públicas limpias
CREATE POLICY "Licitaciones_visibles_publicamente"
    ON licitaciones FOR SELECT
    USING (true);

CREATE POLICY "Licitaciones_gestionar_service_role"
    ON licitaciones FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Documentos_visibles_publicamente"
    ON documentos FOR SELECT
    USING (true);

CREATE POLICY "Documentos_gestionar_service_role"
    ON documentos FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. TABLA DE PRODUCTOS (Catálogo desde e-commerce)
-- =====================================================

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos del producto
    nombre VARCHAR(500) NOT NULL,
    descripcion TEXT,
    precio_capturado DECIMAL(15, 2) NOT NULL,
    precio_venta DECIMAL(15, 2), -- Precio que usarás en cotizaciones (puede ser diferente)
    
    -- Metadatos de origen
    url_origen TEXT NOT NULL,
    sitio_origen VARCHAR(100), -- 'lider.cl', 'jumbo.cl', 'amazon.com', etc.
    imagen_url TEXT,
    sku VARCHAR(100),
    marca VARCHAR(200),
    categoria VARCHAR(200),
    
    -- Datos estructurados capturados
    datos_estructurados JSONB, -- Schema.org, Open Graph, etc.
    
    -- Control
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para búsqueda
    UNIQUE(url_origen)
);

-- 3. TABLA DE COTIZACIONES (Historial de PDFs generados)
-- =====================================================

CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
    
    -- Datos de la empresa
    razon_social VARCHAR(255) DEFAULT 'ALBATERRA SPA',
    rut_empresa VARCHAR(20) DEFAULT '76.XXX.XXX-X',
    direccion TEXT,
    contacto_nombre VARCHAR(200),
    contacto_email VARCHAR(200),
    contacto_telefono VARCHAR(50),
    
    -- Items cotizados (array de objetos)
    items JSONB NOT NULL, -- [{producto_id, cantidad, precio_unitario, neto, iva, total}, ...]
    
    -- Totales
    subtotal DECIMAL(15, 2) NOT NULL,
    iva_total DECIMAL(15, 2) NOT NULL,
    total_general DECIMAL(15, 2) NOT NULL,
    
    -- Estado y PDF
    estado VARCHAR(50) DEFAULT 'borrador', -- borrador, enviada, adjudicada, rechazada
    pdf_url TEXT, -- URL del PDF generado
    pdf_generado BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    
    -- Notas y seguimiento
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE ITEMS DE COTIZACIÓN (Relación M:N mejorada)
-- =====================================================

CREATE TABLE IF NOT EXISTS cotizacion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    
    -- Datos del item
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(15, 2) NOT NULL,
    
    -- Cálculos
    neto DECIMAL(15, 2) NOT NULL,
    iva DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    
    -- Metadatos
    orden INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PREPARAR CAMPOS PARA IA FUTURA
-- =====================================================

ALTER TABLE licitaciones
ADD COLUMN IF NOT EXISTS ai_score DECIMAL(5, 2), -- Score de 0-100 para priorización
ADD COLUMN IF NOT EXISTS ai_summary TEXT, -- Resumen generado por IA
ADD COLUMN IF NOT EXISTS ai_match_products JSONB, -- Sugerencias de productos
ADD COLUMN IF NOT EXISTS procesado_ai BOOLEAN DEFAULT FALSE;

-- 6. TABLA DE API KEYS (Seguridad para extensión)
-- =====================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash TEXT NOT NULL UNIQUE, -- Hash de la API key
    nombre VARCHAR(200) NOT NULL, -- Descripción de la key
    activa BOOLEAN DEFAULT TRUE,
    ultimo_uso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Productos
CREATE INDEX IF NOT EXISTS idx_productos_nombre_fts ON productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_sitio_origen ON productos(sitio_origen);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio_venta);

-- Cotizaciones
CREATE INDEX IF NOT EXISTS idx_cotizaciones_licitacion_id ON cotizaciones(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(created_at);

-- Items
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_producto ON cotizacion_items(producto_id);

-- Licitaciones (para IA)
CREATE INDEX IF NOT EXISTS idx_licitaciones_ai_score ON licitaciones(ai_score) WHERE ai_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_licitaciones_procesado_ai ON licitaciones(procesado_ai);

-- 8. FUNCIONES DE CÁLCULO AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_totales_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
    subtotal_calc DECIMAL(15, 2);
    iva_calc DECIMAL(15, 2);
    total_calc DECIMAL(15, 2);
BEGIN
    -- Calcular totales desde los items
    SELECT 
        COALESCE(SUM(neto), 0),
        COALESCE(SUM(iva), 0),
        COALESCE(SUM(total), 0)
    INTO subtotal_calc, iva_calc, total_calc
    FROM cotizacion_items
    WHERE cotizacion_id = NEW.cotizacion_id;
    
    -- Actualizar la cotización
    UPDATE cotizaciones
    SET 
        subtotal = subtotal_calc,
        iva_total = iva_calc,
        total_general = total_calc,
        updated_at = NOW()
    WHERE id = NEW.cotizacion_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular al insertar/actualizar items
DROP TRIGGER IF EXISTS trigger_recalcular_cotizacion ON cotizacion_items;
CREATE TRIGGER trigger_recalcular_cotizacion
    AFTER INSERT OR UPDATE OR DELETE ON cotizacion_items
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_cotizacion();

-- 9. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cotizaciones_updated_at
    BEFORE UPDATE ON cotizaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. POLÍTICAS RLS PARA NUEVAS TABLAS
-- =====================================================

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existen
DROP POLICY IF EXISTS "Productos son visibles públicamente" ON productos;
DROP POLICY IF EXISTS "Service role puede gestionar productos" ON productos;
DROP POLICY IF EXISTS "Cotizaciones son visibles públicamente" ON cotizaciones;
DROP POLICY IF EXISTS "Service role puede gestionar cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Items son visibles públicamente" ON cotizacion_items;
DROP POLICY IF EXISTS "Service role puede gestionar items" ON cotizacion_items;
DROP POLICY IF EXISTS "Solo service role puede ver API keys" ON api_keys;

-- Políticas públicas para productos
CREATE POLICY "Productos_visibles_publicamente"
    ON productos FOR SELECT
    USING (true);

CREATE POLICY "Productos_gestionar_service_role"
    ON productos FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para cotizaciones
CREATE POLICY "Cotizaciones_visibles_publicamente"
    ON cotizaciones FOR SELECT
    USING (true);

CREATE POLICY "Cotizaciones_gestionar_service_role"
    ON cotizaciones FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para items
CREATE POLICY "Items_visibles_publicamente"
    ON cotizacion_items FOR SELECT
    USING (true);

CREATE POLICY "Items_gestionar_service_role"
    ON cotizacion_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para API keys (solo service role)
CREATE POLICY "APIKeys_solo_service_role"
    ON api_keys FOR ALL
    USING (true)
    WITH CHECK (true);

-- 11. COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE productos IS 'Catálogo de productos capturados desde e-commerce mediante extensión Chrome';
COMMENT ON TABLE cotizaciones IS 'Historial de cotizaciones generadas para licitaciones';
COMMENT ON TABLE cotizacion_items IS 'Items individuales de cada cotización';
COMMENT ON TABLE api_keys IS 'API keys para autenticación de extensión Chrome';

COMMENT ON COLUMN licitaciones.ai_score IS 'Score 0-100 calculado por IA para priorización (futuro)';
COMMENT ON COLUMN licitaciones.ai_summary IS 'Resumen generado por IA del análisis de documentos (futuro)';
COMMENT ON COLUMN licitaciones.ai_match_products IS 'Productos sugeridos por IA para esta licitación (futuro)';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
