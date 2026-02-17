CREATE TABLE IF NOT EXISTS licitacion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(15, 2),
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licitacion_items_licitacion ON licitacion_items(licitacion_id);

DROP TRIGGER IF EXISTS update_licitacion_items_updated_at ON licitacion_items;
CREATE TRIGGER update_licitacion_items_updated_at
    BEFORE UPDATE ON licitacion_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE licitacion_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Licitacion_items_visibles" ON licitacion_items;
DROP POLICY IF EXISTS "Licitacion_items_gestionar" ON licitacion_items;
CREATE POLICY "Licitacion_items_visibles" ON licitacion_items FOR SELECT USING (true);
CREATE POLICY "Licitacion_items_gestionar" ON licitacion_items FOR ALL USING (true) WITH CHECK (true);
