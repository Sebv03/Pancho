"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  Eye,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OportunidadCardAPIProps {
  item: Record<string, unknown>;
  onVerDetalle: (codigo: string, origen: "lic" | "oc") => void;
  formatCurrency: (n: number | null | undefined) => string;
}

export function OportunidadCardAPI({
  item,
  onVerDetalle,
  formatCurrency,
}: OportunidadCardAPIProps) {
  const comprador = item.Comprador as Record<string, unknown> | undefined;
  const codigo = String(item.CodigoExterno ?? item.Codigo ?? "");
  const nombre = String(item.Nombre ?? "");
  const organismo = comprador?.NombreOrganismo ?? comprador?.nombreOrganismo ?? "";
  const region = comprador?.RegionUnidad as string | undefined;
  const comuna = comprador?.ComunaUnidad as string | undefined;
  const monto = (item.MontoEstimado ?? item.Total ?? item.TotalNeto) as number | null | undefined;
  const fechaCierre = item.FechaCierre as string | undefined;
  const estado = String(item.Estado ?? item.CodigoEstado ?? "");
  const tipo = String(item.Tipo ?? "").toUpperCase() || 
    (codigo.match(/-([A-Z0-9]{2,3})\d*$/i)?.[1] ?? "").toUpperCase();
  const link = item.Link as string | undefined;
  const origen = (item as Record<string, unknown>)._origen === "oc" ? "oc" : "lic";

  const esLicitacion = ["L1", "LE", "LP", "LS"].includes(tipo);
  const esCompraAgil = tipo === "AG" || ["C2", "F2", "G2", "C1", "F3", "G1"].includes(tipo);

  const tipoLabel = esCompraAgil ? "Compra Ágil" : "Licitación";
  const estadoLabel =
    estado === "5" || estado.toLowerCase().includes("publicad") || estado.toLowerCase().includes("activa")
      ? "Abierta"
      : estado;

  const ubicacion = [region, comuna].filter(Boolean).join(" / ") || null;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-gray-600">
              {codigo || "—"}
            </Badge>
            <Badge
              className={`border ${
                estado === "5" || estadoLabel === "Abierta"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {estadoLabel || estado || "—"}
            </Badge>
            {tipo && (
              <Badge
                className={
                  esLicitacion
                    ? "border border-blue-200 bg-blue-50 text-blue-800"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
                }
              >
                {tipo}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-bold leading-tight text-gray-900">
            {nombre || "Sin nombre"}
          </h3>

          {tipo && (
            <Badge variant="outline" className="text-gray-600 w-fit">
              <Building2 className="mr-1 h-3.5 w-3.5" />
              {tipoLabel}
            </Badge>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerDetalle(codigo, origen)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Ver detalle
            </Button>
          </div>

          <div className="space-y-1.5 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{String(organismo || "—")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                Monto estimado: {formatCurrency(monto)}
              </span>
              {ubicacion && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                  {ubicacion}
                </span>
              )}
              {fechaCierre && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                  Cierre: {format(new Date(fechaCierre), "d MMM HH:mm", { locale: es })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4 lg:min-w-[180px]">
          <p className="text-right text-xl font-bold text-gray-900">
            PRESUPUESTO {formatCurrency(monto)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerDetalle(codigo, origen)}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Ver detalle
            </Button>
            {link && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver en Mercado Público"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
