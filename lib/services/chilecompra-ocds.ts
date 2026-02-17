/**
 * Servicio OCDS (Open Contracting Data Standard) para Mercado Público
 *
 * La API OCDS es más completa para procesos de Compra Ágil y Trato Directo
 * que la API v1 de licitaciones.
 *
 * @see https://datos-abiertos.chilecompra.cl/descargas/procesos-ocds
 * @see https://apis.mercadopublico.cl/OCDS/
 * OCID prefix: ocds-70d2nz
 *
 * Sistemas: licitacion | trato-directo | convenio
 */

const OCDS_BASE = "https://apis.mercadopublico.cl/OCDS";
const DATOS_ABIERTOS_BASE = "https://datos-abiertos.chilecompra.cl";
const OCID_PREFIX = "ocds-70d2nz";

export type OCDSSystem = "licitacion" | "trato-directo" | "convenio";

export interface OCDSRecord {
  ocid: string;
  compiledRelease?: Record<string, unknown>;
  releases?: Record<string, unknown>[];
  [key: string]: unknown;
}

/** Resultado normalizado para unificar con el formato v1 */
export interface OCDSRecordNormalizado {
  CodigoExterno: string;
  Nombre: string;
  Descripcion?: string;
  FechaCierre?: string;
  Comprador?: { NombreOrganismo?: string; RegionUnidad?: string; ComunaUnidad?: string };
  MontoEstimado?: number;
  Estado?: string;
  CodigoEstado?: number;
  Tipo?: string;
  Link?: string;
  _origen: "ocds";
}

/**
 * Obtiene un registro OCDS por OCID.
 * Endpoint: apis.mercadopublico.cl/OCDS/data/record/{id}
 * El id es el OCID sin el prefijo ocds-70d2nz-
 */
export async function obtenerRecordOCDS(
  ocid: string
): Promise<OCDSRecord | null> {
  const id = ocid.startsWith(OCID_PREFIX) ? ocid.replace(`${OCID_PREFIX}-`, "") : ocid;
  const url = `${OCDS_BASE}/data/record/${id}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as OCDSRecord;
  } catch {
    return null;
  }
}

/**
 * Extrae datos del formato OCDS al formato compatible con nuestra app.
 */
export function normalizarRecordOCDS(record: OCDSRecord): OCDSRecordNormalizado | null {
  const compiled = record.compiledRelease ?? record;
  if (!compiled || typeof compiled !== "object") return null;

  const parties = (compiled.parties as Record<string, unknown>[]) ?? [];
  const buyer = parties.find((p) => {
    const roles = p.roles;
    return Array.isArray(roles) && roles.includes("buyer");
  }) as Record<string, unknown> | undefined;
  const tender = (compiled.tender ?? compiled) as Record<string, unknown>;
  const title = (tender.title ?? compiled.title ?? "") as string;
  const value = tender.value ?? compiled.value;
  const amount =
    typeof value === "object" && value && "amount" in value
      ? Number((value as Record<string, unknown>).amount)
      : undefined;
  const period = tender.tenderPeriod as Record<string, unknown> | undefined;

  const ocid = String(compiled.ocid ?? record.ocid ?? "");
  const codigo = ocid.replace(OCID_PREFIX, "").replace(/^-/, "") || ocid;

  return {
    CodigoExterno: codigo,
    Nombre: String(title || ""),
    Descripcion: tender.description ? String(tender.description) : undefined,
    FechaCierre: period?.endDate ? String(period.endDate) : undefined,
    Comprador: buyer
      ? {
          NombreOrganismo: String(buyer.name ?? ""),
          RegionUnidad: (buyer as Record<string, unknown>).address?.region as string | undefined,
          ComunaUnidad: (buyer as Record<string, unknown>).address?.locality as string | undefined,
        }
      : undefined,
    MontoEstimado: amount,
    Estado: tender.status ? String(tender.status) : undefined,
    Tipo: undefined,
    Link: `https://www.mercadopublico.cl/Procurement/Modules/PO/DetailsPurchaseOrder.aspx?qs=`,
    _origen: "ocds",
  };
}

/**
 * Obtiene el listado de paquetes OCDS desde datos abiertos.
 * Parámetros: system (licitacion|trato-directo|convenio), from_date, until_date
 * Nota: La API puede ser lenta; los datos abiertos suelen ofrecer descargas.
 */
export async function obtenerPaqueteOCDS(params: {
  system?: OCDSSystem;
  from_date?: string; // YYYY-MM
  until_date?: string; // YYYY-MM
}): Promise<{ records?: { ocid: string }[] } | null> {
  const url = new URL(`${DATOS_ABIERTOS_BASE}/descargas/procesos-ocds`);
  if (params.system) url.searchParams.set("system", params.system);
  if (params.from_date) url.searchParams.set("from_date", params.from_date);
  if (params.until_date) url.searchParams.set("until_date", params.until_date);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as { records?: { ocid: string }[] };
  } catch {
    return null;
  }
}
