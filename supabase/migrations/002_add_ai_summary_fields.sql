-- Migración adicional: Campos mejorados para resumen de IA
-- Agregar campos específicos para el análisis de IA en licitaciones

ALTER TABLE licitaciones
ADD COLUMN IF NOT EXISTS garantias_seriedad TEXT[],
ADD COLUMN IF NOT EXISTS plazos_entrega TEXT,
ADD COLUMN IF NOT EXISTS criterios_evaluacion TEXT[],
ADD COLUMN IF NOT EXISTS riesgos_detectados TEXT[],
ADD COLUMN IF NOT EXISTS puntos_clave TEXT[];

-- Índice para búsquedas full-text en descripción
CREATE INDEX IF NOT EXISTS idx_licitaciones_descripcion_fts 
ON licitaciones USING gin(to_tsvector('spanish', descripcion));

-- Comentarios para documentación
COMMENT ON COLUMN licitaciones.resumen_ia IS 'Resumen completo generado por IA en formato JSON';
COMMENT ON COLUMN licitaciones.garantias_seriedad IS 'Array de garantías requeridas extraídas por IA';
COMMENT ON COLUMN licitaciones.plazos_entrega IS 'Plazos de entrega identificados por IA';
COMMENT ON COLUMN licitaciones.criterios_evaluacion IS 'Criterios de evaluación extraídos por IA';
COMMENT ON COLUMN licitaciones.riesgos_detectados IS 'Riesgos potenciales identificados por IA';
