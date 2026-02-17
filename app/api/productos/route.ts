import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/productos
 * Obtiene productos con búsqueda y filtros
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search');
    const sitio = searchParams.get('sitio');
    const activo = searchParams.get('activo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,descripcion.ilike.%${search}%,marca.ilike.%${search}%`
      );
    }

    if (sitio) {
      query = query.eq('sitio_origen', sitio);
    }

    if (activo !== null) {
      query = query.eq('activo', activo === 'true');
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
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      {
        error: 'Error al obtener productos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/productos
 * Crea un nuevo producto
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      nombre,
      descripcion,
      precio_capturado,
      precio_venta,
      url_origen,
      sitio_origen,
      imagen_url,
      sku,
      marca,
      categoria,
      activo = true,
    } = body;

    if (!nombre || precio_capturado == null) {
      return NextResponse.json(
        { error: 'nombre y precio_capturado son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: String(nombre),
        descripcion: descripcion ?? null,
        precio_capturado: Number(precio_capturado),
        precio_venta: precio_venta != null ? Number(precio_venta) : null,
        url_origen: url_origen || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sitio_origen: sitio_origen || null,
        imagen_url: imagen_url || null,
        sku: sku || null,
        marca: marca || null,
        categoria: categoria || null,
        activo: activo !== false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      {
        error: 'Error al crear producto',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
