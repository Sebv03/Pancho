import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Headers CORS para permitir peticiones desde extensión Chrome (cualquier e-commerce)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Endpoint para capturar productos desde la extensión Chrome
 * Recibe datos extraídos de cualquier e-commerce
 * 
 * POST /api/productos/capture
 * Headers: X-API-Key (para seguridad)
 * Body: ProductData desde extensión
 */
export async function POST(request: NextRequest) {
  try {
    // Validar API Key
    const apiKey = request.headers.get('X-API-Key');
    const expectedKey = process.env.EXTENSION_API_KEY || 'licitia-dev-key-2024';
    
    const isValid = apiKey === expectedKey;
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'API Key inválida o no proporcionada' },
        { status: 401, headers: corsHeaders }
      );
    }

    const productData = await request.json();

    // Validar datos mínimos (nombre obligatorio, precio puede ser 0)
    if (!productData.nombre) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere al menos el nombre del producto' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Precio por defecto si no se extrajo
    const precio = productData.precio != null ? productData.precio : 0;

    const supabase = createAdminClient();

    // Preparar datos para inserción
    const productoNormalizado = {
      nombre: productData.nombre,
      descripcion: productData.descripcion || null,
      precio_capturado: precio,
      precio_venta: precio, // Por defecto, mismo que capturado
      url_origen: productData.url,
      sitio_origen: productData.sitio || new URL(productData.url).hostname,
      imagen_url: productData.imagen || null,
      sku: productData.sku || null,
      marca: productData.marca || null,
      categoria: productData.categoria || null,
      datos_estructurados: {
        source: productData.source,
        confidence: productData.confidence,
        rawData: productData.rawData || null,
      },
      activo: true,
    };

    // Verificar si ya existe (por URL)
    const { data: existente } = await supabase
      .from('productos')
      .select('id, precio_capturado')
      .eq('url_origen', productoNormalizado.url_origen)
      .single();

    if (existente) {
      // Actualizar precio si cambió
      const { data: actualizado, error } = await supabase
        .from('productos')
        .update({
          precio_capturado: productoNormalizado.precio_capturado,
          precio_venta: productoNormalizado.precio_venta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        producto: actualizado,
        mensaje: 'Producto actualizado (precio)',
      }, { headers: corsHeaders });
    }

    // Insertar nuevo producto
    const { data: nuevo, error } = await supabase
      .from('productos')
      .insert(productoNormalizado)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      action: 'created',
      producto: nuevo,
      mensaje: 'Producto capturado exitosamente',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error al capturar producto:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar producto',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
