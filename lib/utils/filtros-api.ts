import type { FiltrosState } from "@/components/features/filtros-panel";

const TIPOS_LICITACION = ["L1", "LE", "LP", "LS"];
const TIPOS_COMPRA_AGIL = ["AG", "COT", "C2", "F2", "G2", "C1", "F3", "G1"];

function obtenerTipo(item: Record<string, unknown>): string {
  const tipo = String(item.Tipo ?? "").toUpperCase();
  if (tipo) return tipo;
  const codigo = String(item.CodigoExterno ?? item.Codigo ?? "");
  const match = codigo.match(/-([A-Z0-9]{2,3})\d*$/i);
  return match ? match[1].toUpperCase() : "";
}

function getMonto(item: Record<string, unknown>): number | null {
  const n = item.MontoEstimado ?? item.Total ?? item.TotalNeto;
  return typeof n === "number" ? n : null;
}

function esLicitacion(tipo: string): boolean {
  if (!tipo) return false;
  return TIPOS_LICITACION.some((t) => tipo === t || tipo.startsWith(t));
}

function esCompraAgil(tipo: string): boolean {
  if (!tipo) return false;
  return tipo === "AG" || tipo === "COT" || TIPOS_COMPRA_AGIL.includes(tipo) || tipo.startsWith("AG") || tipo.startsWith("COT");
}

function esActiva(item: Record<string, unknown>): boolean {
  const estado = String(item.Estado ?? item.CodigoEstado ?? "").toLowerCase();
  return (
    estado === "5" ||
    estado.includes("publicad") ||
    estado.includes("activa") ||
    estado.includes("abierta")
  );
}

function getFechaPublicacion(item: Record<string, unknown>): Date | null {
  const fechas = item.Fechas as Record<string, string> | undefined;
  const str =
    (item.FechaPublicacion as string) ??
    fechas?.FechaPublicacion ??
    (item.FechaCreacion as string) ??
    fechas?.FechaCreacion ??
    (item.FechaCierre as string);
  if (!str || typeof str !== "string") return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function aplicarFiltros(
  listado: Record<string, unknown>[],
  filtros: FiltrosState
): Record<string, unknown>[] {
  return listado.filter((item) => {
    const tipo = obtenerTipo(item);
    const monto = getMonto(item);
    const comprador = item.Comprador as Record<string, unknown> | undefined;
    const organismo = String(
      comprador?.NombreOrganismo ?? comprador?.nombreOrganismo ?? ""
    );
    const region = String(comprador?.RegionUnidad ?? "");
    const comuna = String(comprador?.ComunaUnidad ?? "");

    // Tipo: al menos uno debe estar activo
    if (!filtros.tipoLicitacion && !filtros.tipoCompraAgil) return false;
    // Si ambos están seleccionados, mostrar todo (incl. COT, LP26, etc.)
    if (filtros.tipoLicitacion && filtros.tipoCompraAgil) {
      // pasar
    } else {
      const matchLicitacion = filtros.tipoLicitacion && esLicitacion(tipo);
      const matchCompraAgil = filtros.tipoCompraAgil && esCompraAgil(tipo);
      if (!matchLicitacion && !matchCompraAgil) return false;
    }

    // Estado
    if (filtros.estado === "activas" && !esActiva(item)) return false;

    // Publicado hace X meses
    if (filtros.mesesPublicado) {
      const meses = Number(filtros.mesesPublicado);
      if (!isNaN(meses) && meses > 0) {
        const fechaPub = getFechaPublicacion(item);
        if (fechaPub) {
          const limite = new Date();
          limite.setMonth(limite.getMonth() - meses);
          if (fechaPub < limite) return false;
        }
      }
    }

    // Códigos correlativos a montos (L1, LE, LP, LR, LS)
    if (filtros.codigosMonto.length > 0) {
      const matchCodigo = filtros.codigosMonto.some(
        (c) => tipo === c || tipo.startsWith(c)
      );
      if (!matchCodigo) return false;
    }

    // Organismo (búsqueda por texto)
    if (filtros.organismo.trim()) {
      if (!organismo.toLowerCase().includes(filtros.organismo.toLowerCase()))
        return false;
    }

    // Presupuesto
    if (filtros.presupuestoMin) {
      const min = Number(filtros.presupuestoMin.replace(/\D/g, ""));
      if (!isNaN(min) && (monto == null || monto < min)) return false;
    }
    if (filtros.presupuestoMax) {
      const max = Number(filtros.presupuestoMax.replace(/\D/g, ""));
      if (!isNaN(max) && (monto == null || monto > max)) return false;
    }

    // Región
    if (filtros.region && region !== filtros.region) return false;

    // Comuna
    if (filtros.comuna && comuna !== filtros.comuna) return false;

    return true;
  });
}

export function extraerOpciones(listado: Record<string, unknown>[]): {
  regiones: string[];
  comunas: string[];
  comunasPorRegion: Record<string, string[]>;
  organismos: string[];
} {
  const regionesSet = new Set<string>();
  const comunasSet = new Set<string>();
  const comunasPorRegion: Record<string, Set<string>> = {};
  const organismosSet = new Set<string>();

  for (const item of listado) {
    const comprador = item.Comprador as Record<string, unknown> | undefined;
    const org = String(
      comprador?.NombreOrganismo ?? comprador?.nombreOrganismo ?? ""
    ).trim();
    const region = String(comprador?.RegionUnidad ?? "").trim();
    const comuna = String(comprador?.ComunaUnidad ?? "").trim();

    if (org) organismosSet.add(org);
    if (region) {
      regionesSet.add(region);
      if (!comunasPorRegion[region]) comunasPorRegion[region] = new Set();
      if (comuna) comunasPorRegion[region].add(comuna);
    }
    if (comuna) comunasSet.add(comuna);
  }

  return {
    regiones: Array.from(regionesSet).sort(),
    comunas: Array.from(comunasSet).sort(),
    comunasPorRegion: Object.fromEntries(
      Object.entries(comunasPorRegion).map(([k, v]) => [k, Array.from(v).sort()])
    ),
    organismos: Array.from(organismosSet).sort(),
  };
}
