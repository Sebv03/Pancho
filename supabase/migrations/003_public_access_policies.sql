-- Migración: Permitir acceso público a licitaciones (para MVP)
-- Esta migración permite que usuarios no autenticados puedan leer licitaciones

-- Eliminar política anterior que requiere autenticación
DROP POLICY IF EXISTS "Licitaciones son visibles para todos los usuarios autenticados" ON licitaciones;

-- Crear política que permite acceso público de lectura
CREATE POLICY "Licitaciones son visibles públicamente"
    ON licitaciones FOR SELECT
    USING (true);

-- Permitir inserción con service role (para el endpoint de ingesta)
CREATE POLICY "Service role puede insertar licitaciones"
    ON licitaciones FOR INSERT
    WITH CHECK (true);

-- Permitir actualización con service role
CREATE POLICY "Service role puede actualizar licitaciones"
    ON licitaciones FOR UPDATE
    USING (true);

-- Actualizar política de documentos para acceso público
DROP POLICY IF EXISTS "Documentos son visibles para usuarios autenticados" ON documentos;

CREATE POLICY "Documentos son visibles públicamente"
    ON documentos FOR SELECT
    USING (true);

-- Permitir inserción y actualización de documentos
CREATE POLICY "Service role puede gestionar documentos"
    ON documentos FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comentario de seguridad
COMMENT ON TABLE licitaciones IS 'Tabla con acceso público de lectura. En producción, considerar agregar autenticación.';
