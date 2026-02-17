import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIProcessor } from '@/lib/ai/processor';

export const maxDuration = 60; // 60 segundos para procesamiento de IA

export async function POST(request: NextRequest) {
  try {
    const { documentoId, licitacionId } = await request.json();

    if (!documentoId || !licitacionId) {
      return NextResponse.json(
        { error: 'documentoId y licitacionId son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const processor = new AIProcessor();

    // Obtener el documento
    const { data: documento, error: docError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documentoId)
      .single();

    if (docError || !documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener la licitación
    const { data: licitacion, error: licError } = await supabase
      .from('licitaciones')
      .select('nombre')
      .eq('id', licitacionId)
      .single();

    if (licError || !licitacion) {
      return NextResponse.json(
        { error: 'Licitación no encontrada' },
        { status: 404 }
      );
    }

    // Si el documento ya tiene contenido extraído, usarlo
    let contenidoTexto = documento.contenido_extraido;

    if (!contenidoTexto && documento.url_archivo) {
      // Descargar y extraer texto del PDF
      try {
        const response = await fetch(documento.url_archivo);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        contenidoTexto = await processor.extractTextFromPDF(buffer);

        // Guardar el contenido extraído
        await supabase
          .from('documentos')
          .update({ contenido_extraido: contenidoTexto })
          .eq('id', documentoId);
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Error al descargar o procesar el PDF',
            details: error instanceof Error ? error.message : 'Error desconocido',
          },
          { status: 500 }
        );
      }
    }

    if (!contenidoTexto) {
      return NextResponse.json(
        { error: 'No se pudo extraer contenido del documento' },
        { status: 400 }
      );
    }

    // Procesar con IA
    const analisis = await processor.analyzeLicitacionDocument(
      contenidoTexto,
      licitacion.nombre
    );

    // Actualizar la licitación con el análisis
    const { error: updateError } = await supabase
      .from('licitaciones')
      .update({
        resumen_ia: analisis,
        garantias_seriedad: analisis.garantias_seriedad,
        plazos_entrega: analisis.plazos_entrega,
        criterios_evaluacion: analisis.criterios_evaluacion,
        riesgos_detectados: analisis.riesgos_detectados,
        puntos_clave: analisis.puntos_clave,
      })
      .eq('id', licitacionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al guardar análisis', details: updateError.message },
        { status: 500 }
      );
    }

    // Marcar documento como procesado
    await supabase
      .from('documentos')
      .update({ procesado_ia: true })
      .eq('id', documentoId);

    return NextResponse.json({
      success: true,
      analisis,
    });
  } catch (error) {
    console.error('Error en análisis de documento:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
