import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Endpoint para agregar datos de prueba
 * Útil mientras se espera el rate limit de la API de ChileCompra
 * 
 * POST /api/seed-test-data
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    const licitacionesPrueba = [
      {
        codigo_externo: 'TEST-2026-001',
        nombre: 'Suministro de Equipamiento Tecnológico para Modernización Digital',
        descripcion: 'Adquisición de equipos computacionales, servidores y dispositivos de red para modernizar la infraestructura tecnológica del organismo.',
        fecha_cierre: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        organismo: 'Ministerio de Hacienda',
        monto_estimado: 150000000,
        estado: 'activa',
        link_oficial: 'https://www.mercadopublico.cl',
      },
      {
        codigo_externo: 'TEST-2026-002',
        nombre: 'Servicios de Consultoría en Transformación Digital',
        descripcion: 'Contratación de servicios profesionales especializados para asesoría en procesos de transformación digital y modernización institucional.',
        fecha_cierre: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días
        organismo: 'Ministerio del Interior',
        monto_estimado: 85000000,
        estado: 'activa',
        link_oficial: 'https://www.mercadopublico.cl',
      },
      {
        codigo_externo: 'TEST-2026-003',
        nombre: 'Arriendo de Vehículos para Operaciones Administrativas',
        descripcion: 'Servicio de arriendo de vehículos livianos para apoyo en actividades administrativas y operacionales del servicio público.',
        fecha_cierre: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 días
        organismo: 'Servicio de Salud Metropolitano Central',
        monto_estimado: 42000000,
        estado: 'activa',
        link_oficial: 'https://www.mercadopublico.cl',
      },
      {
        codigo_externo: 'TEST-2026-004',
        nombre: 'Construcción de Infraestructura Educacional',
        descripcion: 'Diseño y construcción de establecimiento educacional de enseñanza básica con capacidad para 500 estudiantes.',
        fecha_cierre: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 días
        organismo: 'Ministerio de Educación',
        monto_estimado: 2500000000,
        estado: 'activa',
        link_oficial: 'https://www.mercadopublico.cl',
      },
      {
        codigo_externo: 'TEST-2026-005',
        nombre: 'Servicios de Seguridad y Vigilancia',
        descripcion: 'Contratación de servicios de seguridad integral para dependencias del organismo público en la Región Metropolitana.',
        fecha_cierre: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días atrás (cerrada)
        organismo: 'Contraloría General de la República',
        monto_estimado: 95000000,
        estado: 'cerrada',
        link_oficial: 'https://www.mercadopublico.cl',
      },
      {
        codigo_externo: 'TEST-2026-006',
        nombre: 'Suministro de Insumos Médicos y Farmacéuticos',
        descripcion: 'Adquisición de medicamentos, insumos médicos y material clínico para abastecer centros de atención primaria.',
        fecha_cierre: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 días
        organismo: 'Servicio de Salud Valparaíso San Antonio',
        monto_estimado: 180000000,
        estado: 'activa',
        link_oficial: 'https://www.mercadopublico.cl',
      },
    ];

    const insertadas = [];
    const duplicadas = [];

    for (const licitacion of licitacionesPrueba) {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('licitaciones')
        .select('id')
        .eq('codigo_externo', licitacion.codigo_externo)
        .single();

      if (existente) {
        duplicadas.push(licitacion.codigo_externo);
      } else {
        const { data, error } = await supabase
          .from('licitaciones')
          .insert(licitacion)
          .select()
          .single();

        if (!error && data) {
          insertadas.push(data.codigo_externo);
        }
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Datos de prueba agregados exitosamente',
      resumen: {
        totalProcesadas: licitacionesPrueba.length,
        nuevas: insertadas.length,
        duplicadas: duplicadas.length,
      },
      insertadas,
      duplicadas,
    });
  } catch (error) {
    console.error('Error al agregar datos de prueba:', error);
    return NextResponse.json(
      {
        error: 'Error al agregar datos de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
