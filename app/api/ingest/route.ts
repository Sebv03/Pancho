import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ChileCompraService } from '@/lib/services/chilecompra';

/**
 * Endpoint para ingerir licitaciones desde ChileCompra API
 * 
 * Uso:
 * POST /api/ingest
 * Body: { pagina?: number, fechaDesde?: string, fechaHasta?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagina = 1, fechaDesde, fechaHasta, estado } = body;

    const chileCompraService = new ChileCompraService();
    const supabase = createAdminClient();

    // Si no se proporciona fecha, usar el día de hoy
    const fechaConsulta = fechaDesde || new Date().toISOString().split('T')[0];

    // Obtener licitaciones de la API
    const response = await chileCompraService.obtenerLicitaciones({
      pagina,
      fechaDesde: fechaConsulta,
      estado: estado || 'activas', // Por defecto obtener las activas
    });

    const licitacionesIngeridas = [];
    const licitacionesDuplicadas = [];

    // Procesar cada licitación
    for (const licitacion of response.Listado) {
      const licitacionNormalizada =
        chileCompraService.normalizarLicitacion(licitacion);

      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('licitaciones')
        .select('id')
        .eq('codigo_externo', licitacionNormalizada.codigo_externo)
        .single();

      if (existente) {
        // Actualizar licitación existente
        const { error } = await supabase
          .from('licitaciones')
          .update(licitacionNormalizada)
          .eq('codigo_externo', licitacionNormalizada.codigo_externo);

        if (!error) {
          licitacionesDuplicadas.push(licitacionNormalizada.codigo_externo);
        }
      } else {
        // Insertar nueva licitación
        const { data, error } = await supabase
          .from('licitaciones')
          .insert(licitacionNormalizada)
          .select()
          .single();

        if (!error && data) {
          licitacionesIngeridas.push(data.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      resumen: {
        totalEncontradas: response.Listado.length,
        nuevas: licitacionesIngeridas.length,
        actualizadas: licitacionesDuplicadas.length,
        paginaActual: response.PaginaActual,
        totalPaginas: response.TotalPaginas,
      },
      nuevas: licitacionesIngeridas,
      actualizadas: licitacionesDuplicadas,
    });
  } catch (error) {
    console.error('Error en ingesta de licitaciones:', error);
    return NextResponse.json(
      {
        error: 'Error al ingerir licitaciones',
        details:
          error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
