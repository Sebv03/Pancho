import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/licitaciones
 * Obtiene licitaciones con filtros opcionales
 * 
 * Query params:
 * - estado: filtrar por estado
 * - organismo: filtrar por organismo
 * - fechaDesde: fecha mínima de cierre
 * - fechaHasta: fecha máxima de cierre
 * - limit: límite de resultados (default: 50)
 * - offset: offset para paginación
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const estado = searchParams.get('estado');
    const organismo = searchParams.get('organismo');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = supabase
      .from('licitaciones')
      .select('*', { count: 'exact' })
      .order('fecha_cierre', { ascending: true })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (estado) {
      query = query.eq('estado', estado);
    }
    if (organismo) {
      query = query.ilike('organismo', `%${organismo}%`);
    }
    if (fechaDesde) {
      query = query.gte('fecha_cierre', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha_cierre', fechaHasta);
    }
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,descripcion.ilike.%${search}%,codigo_externo.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener licitaciones', details: error.message },
        { status: 500 }
      );
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
    console.error('Error en GET /api/licitaciones:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
