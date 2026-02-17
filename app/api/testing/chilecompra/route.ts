import { NextRequest, NextResponse } from "next/server";
import {
  ChileCompraService,
  ChileCompraOrdenCompra,
  ChileCompraLicitacion,
} from "@/lib/services/chilecompra";

const ENRICH_LIMIT = 15; // Cuántas licitaciones enriquecer con detalle (Organismo, Monto)
const DELAY_MS = 150; // Pausa entre peticiones para evitar rate limit

// Tipos de procedimiento según documentación ChileCompra (Licitacion.aspx)
const TIPOS_LICITACION = ["L1", "LE", "LP", "LS"]; // Licitación Pública
// Compra Ágil (AG) y Tratos Directos (COT, C2, F2, G2, C1, F3, G1) en órdenes de compra.
// No filtrar solo CodigoTipo 1: COT y trato directo pueden venir por otras vías administrativas.
const TIPOS_COMPRA_AGIL = ["AG"];
const TIPOS_TRATO_DIRECTO = ["COT", "C2", "F2", "G2", "C1", "F3", "G1"];
const TIPOS_COMPRA_AGIL_Y_TRATO = [...TIPOS_COMPRA_AGIL, ...TIPOS_TRATO_DIRECTO];
// 30 UTM en CLP (UTM ~70.000 CLP 2025-2026). Actualizar según SII si es necesario.
const UTM_30_CLP = 2_100_000;

function obtenerTipo(lic: { Tipo?: string; CodigoExterno?: string }): string {
  const tipo = (lic.Tipo ?? "").toUpperCase();
  if (tipo) return tipo;
  // Fallback: extraer del código (ej: 1002-11-LP26 → LP)
  const codigo = lic.CodigoExterno ?? "";
  const match = codigo.match(/-([A-Z0-9]{2,3})\d*$/i);
  return match ? match[1].toUpperCase() : "";
}

function getMonto(
  item: { MontoEstimado?: number; Total?: number; TotalNeto?: number }
): number | null {
  const n = item.MontoEstimado ?? item.Total ?? item.TotalNeto;
  return typeof n === "number" ? n : null;
}

function filtrarPorTipo(
  listado: { Tipo?: string; CodigoExterno?: string; MontoEstimado?: number; Total?: number; TotalNeto?: number }[],
  tipoFiltro: string
): typeof listado {
  if (!tipoFiltro || tipoFiltro === "todos") return listado;
  if (tipoFiltro === "compra_agil") return listado; // Compra Ágil viene de otro endpoint
  if (tipoFiltro === "menor_30_utm") {
    return listado.filter((lic) => {
      const monto = getMonto(lic);
      return monto != null && monto < UTM_30_CLP;
    });
  }
  return listado.filter((lic) => {
    if (!lic || typeof lic !== "object") return false;
    try {
      const tipo = obtenerTipo(lic);
      if (tipoFiltro === "licitaciones") return TIPOS_LICITACION.includes(tipo);
      return true;
    } catch {
      return false;
    }
  });
}

/** Convierte Orden de Compra a formato compatible con la tabla (como licitación) */
function ordenToLicitacionFormat(oc: ChileCompraOrdenCompra): ChileCompraLicitacion & { _origen: "oc" } {
  const fechas = oc.Fechas as Record<string, string> | undefined;
  const fechaCierre = fechas?.FechaEnvio ?? fechas?.FechaCreacion ?? fechas?.FechaAceptacion;
  return {
    CodigoExterno: oc.Codigo,
    Nombre: oc.Nombre ?? oc.Descripcion ?? "",
    Descripcion: oc.Descripcion,
    FechaCierre: fechaCierre,
    Comprador: oc.Comprador,
    MontoEstimado: oc.Total ?? oc.TotalNeto,
    Estado: oc.Estado,
    CodigoEstado: oc.CodigoEstado,
    Tipo: oc.Tipo ?? "AG",
    Link: oc.CodigoLicitacion
      ? `https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?qs=`
      : undefined,
    _origen: "oc",
  } as ChileCompraLicitacion & { _origen: "oc" };
}

/**
 * GET /api/testing/chilecompra
 * Obtiene licitaciones de la API para mostrar en la página de testing.
 * Las primeras N se enriquecen con el endpoint de detalle para obtener Organismo y Monto
 * (el listado básico no siempre incluye esos campos).
 * Params: fecha (YYYY-MM-DD), estado (activas|cerrada|etc), tipo (todos|licitaciones|compra_agil|menor_30_utm)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const estado = searchParams.get("estado") || "activas";
    const tipo = searchParams.get("tipo") || "todos";

    const service = new ChileCompraService();
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

    let licitaciones: (ChileCompraLicitacion & { _origen?: string })[];
    let raw: unknown;

    if (tipo === "menor_30_utm") {
      // Adquisiciones menores a 30 UTM: combinar licitaciones + órdenes, filtrar por monto < 30 UTM
      const [responseLic, responseOC] = await Promise.all([
        service.obtenerLicitaciones({ fechaDesde: fechaConsulta, estado }),
        service.obtenerOrdenesDeCompra({ fechaDesde: fechaConsulta, estado }),
      ]);
      raw = { licitaciones: responseLic, ordenes: responseOC };
      const listadoOC = (responseOC.Listado || [])
        .filter((oc) => {
          const t = (oc.Tipo ?? "").toUpperCase();
          return TIPOS_COMPRA_AGIL_Y_TRATO.includes(t) || TIPOS_COMPRA_AGIL_Y_TRATO.some((c) => t.startsWith(c));
        })
        .map(ordenToLicitacionFormat)
        .filter((oc) => {
          const m = getMonto(oc);
          return m != null && m < UTM_30_CLP;
        });
      const listadoLic = responseLic.Listado || [];
      const toEnrich = listadoLic.slice(0, 30);
      const enriched: (ChileCompraLicitacion & { _origen?: string })[] = [];
      for (let i = 0; i < toEnrich.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
        const lic = toEnrich[i];
        const codigo = lic.CodigoExterno;
        if (!codigo) continue;
        try {
          const detalle = await service.obtenerDetalleLicitacion(codigo);
          const m = detalle?.MontoEstimado ?? lic.MontoEstimado;
          if (m != null && m < UTM_30_CLP) {
            enriched.push({
              ...lic,
              Comprador: detalle?.Comprador ?? lic.Comprador,
              MontoEstimado: m,
              _origen: "lic",
            } as ChileCompraLicitacion & { _origen: string });
          }
        } catch {
          /* skip */
        }
      }
      licitaciones = [...enriched, ...listadoOC];
    } else if (tipo === "compra_agil" || tipo === "trato_directo") {
      const responseOC = await service.obtenerOrdenesDeCompra({
        fechaDesde: fechaConsulta,
        estado,
      });
      raw = responseOC;
      const tiposIncluidos = tipo === "trato_directo" ? TIPOS_COMPRA_AGIL_Y_TRATO : TIPOS_COMPRA_AGIL;
      const filtradas = (responseOC.Listado || []).filter((oc) => {
        const t = (oc.Tipo ?? "").toUpperCase();
        return tiposIncluidos.includes(t) || tiposIncluidos.some((c) => t.startsWith(c));
      });
      licitaciones = filtradas.map(ordenToLicitacionFormat);
    } else {
      const response = await service.obtenerLicitaciones({
        fechaDesde: fechaConsulta,
        estado,
      });
      raw = response;
      const listadoCompleto = response.Listado || [];
      const listado = filtrarPorTipo(listadoCompleto, tipo);

      const toEnrich = listado.slice(0, ENRICH_LIMIT);
      const enriched: ChileCompraLicitacion[] = [];
      for (let i = 0; i < toEnrich.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
        const lic = toEnrich[i];
        const codigo = lic.CodigoExterno;
        if (!codigo) {
          enriched.push(lic);
          continue;
        }
        try {
          const detalle = await service.obtenerDetalleLicitacion(codigo);
          enriched.push(
            detalle
              ? {
                  ...lic,
                  Comprador: detalle.Comprador ?? lic.Comprador,
                  MontoEstimado: detalle.MontoEstimado ?? lic.MontoEstimado,
                }
              : lic
          );
        } catch {
          enriched.push(lic);
        }
      }
      licitaciones = [...enriched, ...listado.slice(ENRICH_LIMIT)];
    }

    return NextResponse.json({
      success: true,
      raw,
      licitaciones,
      total: licitaciones.length,
    });
  } catch (error) {
    console.error("Error testing ChileCompra API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
