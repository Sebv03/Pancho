/**
 * Supabase Edge Function para ingerir licitaciones desde ChileCompra API
 * 
 * Uso:
 *   curl -X POST https://your-project.supabase.co/functions/v1/ingest-licitaciones \
 *     -H "Authorization: Bearer YOUR_ANON_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"pagina": 1, "fechaDesde": "2024-01-01"}'
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CHILECOMPRA_API_URL = Deno.env.get("CHILECOMPRA_API_URL") ||
  "https://api.mercadopublico.cl";
const CHILECOMPRA_API_KEY = Deno.env.get("CHILECOMPRA_API_KEY") || "";

interface ChileCompraLicitacion {
  CodigoExterno: string;
  Nombre: string;
  Descripcion?: string;
  FechaCierre?: string;
  Comprador?: {
    NombreOrganismo?: string;
  };
  MontoEstimado?: number;
  CodigoEstado?: number;
  Link?: string;
}

interface ChileCompraResponse {
  Listado: ChileCompraLicitacion[];
  TotalPaginas: number;
  PaginaActual: number;
}

function mapearEstado(codigoEstado: number): string {
  const estados: Record<number, string> = {
    1: "activa",
    2: "cerrada",
    3: "desierta",
    4: "adjudicada",
    5: "revocada",
  };
  return estados[codigoEstado] || "desconocido";
}

function normalizarLicitacion(licitacion: ChileCompraLicitacion) {
  return {
    codigo_externo: licitacion.CodigoExterno,
    nombre: licitacion.Nombre,
    descripcion: licitacion.Descripcion || null,
    fecha_cierre: licitacion.FechaCierre
      ? new Date(licitacion.FechaCierre).toISOString()
      : new Date().toISOString(),
    organismo: licitacion.Comprador?.NombreOrganismo || "No especificado",
    monto_estimado: licitacion.MontoEstimado || null,
    estado: mapearEstado(licitacion.CodigoEstado || 0),
    link_oficial: licitacion.Link || null,
  };
}

serve(async (req) => {
  try {
    const { pagina = 1, fechaDesde, fechaHasta } = await req.json();

    // Obtener licitaciones de ChileCompra
    const url = new URL(`${CHILECOMPRA_API_URL}/licitaciones/v1/Licitaciones.svc`);
    url.searchParams.append("ticket", CHILECOMPRA_API_KEY);
    url.searchParams.append("pagina", pagina.toString());
    if (fechaDesde) url.searchParams.append("fechaDesde", fechaDesde);
    if (fechaHasta) url.searchParams.append("fechaHasta", fechaHasta);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`ChileCompra API error: ${response.status}`);
    }

    const data: ChileCompraResponse = await response.json();

    // Conectar a Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const nuevas: string[] = [];
    const actualizadas: string[] = [];

    // Procesar cada licitación
    for (const licitacion of data.Listado) {
      const normalizada = normalizarLicitacion(licitacion);

      // Verificar si existe
      const { data: existente } = await supabase
        .from("licitaciones")
        .select("id")
        .eq("codigo_externo", normalizada.codigo_externo)
        .single();

      if (existente) {
        await supabase
          .from("licitaciones")
          .update(normalizada)
          .eq("codigo_externo", normalizada.codigo_externo);
        actualizadas.push(normalizada.codigo_externo);
      } else {
        const { data: nueva } = await supabase
          .from("licitaciones")
          .insert(normalizada)
          .select()
          .single();
        if (nueva) nuevas.push(nueva.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resumen: {
          totalEncontradas: data.Listado.length,
          nuevas: nuevas.length,
          actualizadas: actualizadas.length,
          paginaActual: data.PaginaActual,
          totalPaginas: data.TotalPaginas,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
