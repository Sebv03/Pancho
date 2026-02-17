import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/cotizaciones
 * Crear una nueva cotización
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licitacion_id, items, razon_social, rut_empresa } = body;

    if (!licitacion_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos incompletos. Se requiere licitacion_id e items' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Calcular totales
    let subtotal = 0;
    let iva_total = 0;
    let total_general = 0;

    const itemsCalculados = items.map((item) => {
      const cantidad = parseFloat(item.cantidad);
      const precio_unitario = parseFloat(item.precio_unitario);
      
      const neto = cantidad * precio_unitario;
      const iva = neto * 0.19;
      const total = neto + iva;

      subtotal += neto;
      iva_total += iva;
      total_general += total;

      return {
        producto_id: item.producto_id || null,
        descripcion: item.descripcion,
        cantidad,
        precio_unitario,
        neto,
        iva,
        total,
        orden: item.orden || 0,
      };
    });

    // Crear cotización
    const { data: cotizacion, error: cotError } = await supabase
      .from('cotizaciones')
      .insert({
        licitacion_id,
        razon_social: razon_social || 'ALBATERRA SPA',
        rut_empresa: rut_empresa || '76.XXX.XXX-X',
        items: itemsCalculados,
        subtotal: Math.round(subtotal * 100) / 100,
        iva_total: Math.round(iva_total * 100) / 100,
        total_general: Math.round(total_general * 100) / 100,
        estado: 'borrador',
      })
      .select()
      .single();

    if (cotError) {
      throw cotError;
    }

    // Insertar items individuales
    const itemsParaInsertar = itemsCalculados.map((item) => ({
      ...item,
      cotizacion_id: cotizacion.id,
    }));

    const { error: itemsError } = await supabase
      .from('cotizacion_items')
      .insert(itemsParaInsertar);

    if (itemsError) {
      throw itemsError;
    }

    return NextResponse.json({
      success: true,
      cotizacion,
      mensaje: 'Cotización creada exitosamente',
    });

  } catch (error) {
    console.error('Error al crear cotización:', error);
    return NextResponse.json(
      {
        error: 'Error al crear cotización',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cotizaciones
 * Obtener cotizaciones con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const licitacion_id = searchParams.get('licitacion_id');
    const estado = searchParams.get('estado');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('cotizaciones')
      .select('*, licitaciones(nombre, codigo_externo)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (licitacion_id) {
      query = query.eq('licitacion_id', licitacion_id);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener cotizaciones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// Importar createClient para GET
import { createClient } from '@/lib/supabase/server';
