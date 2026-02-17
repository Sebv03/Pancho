-- Migración inicial: Esquema de base de datos para LicitIA
-- Tabla: licitaciones
CREATE TABLE IF NOT EXISTS licitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_externo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(500) NOT NULL,
    descripcion TEXT,
    fecha_cierre TIMESTAMP WITH TIME ZONE NOT NULL,
    organismo VARCHAR(255) NOT NULL,
    monto_estimado DECIMAL(15, 2),
    estado VARCHAR(50) NOT NULL DEFAULT 'activa',
    link_oficial TEXT,
    resumen_ia JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: documentos
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    nombre_archivo VARCHAR(500),
    tipo_documento VARCHAR(100),
    contenido_extraido TEXT,
    procesado_ia BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: config_usuario
CREATE TABLE IF NOT EXISTS config_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Referencia al usuario de Supabase Auth
    palabras_clave TEXT[] DEFAULT '{}',
    regiones_interes TEXT[] DEFAULT '{}',
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_licitaciones_codigo_externo ON licitaciones(codigo_externo);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha_cierre ON licitaciones(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_organismo ON licitaciones(organismo);
CREATE INDEX IF NOT EXISTS idx_documentos_licitacion_id ON documentos(licitacion_id);
CREATE INDEX IF NOT EXISTS idx_documentos_procesado_ia ON documentos(procesado_ia);
CREATE INDEX IF NOT EXISTS idx_config_usuario_user_id ON config_usuario(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_licitaciones_updated_at
    BEFORE UPDATE ON licitaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
    BEFORE UPDATE ON documentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_usuario_updated_at
    BEFORE UPDATE ON config_usuario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security) - Ajustar según necesidades
ALTER TABLE licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_usuario ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer licitaciones (ajustar según requerimientos)
CREATE POLICY "Licitaciones son visibles para todos los usuarios autenticados"
    ON licitaciones FOR SELECT
    TO authenticated
    USING (true);

-- Política: Solo el propietario puede modificar su configuración
CREATE POLICY "Usuarios pueden gestionar su propia configuración"
    ON config_usuario FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Documentos visibles para usuarios autenticados
CREATE POLICY "Documentos son visibles para usuarios autenticados"
    ON documentos FOR SELECT
    TO authenticated
    USING (true);
