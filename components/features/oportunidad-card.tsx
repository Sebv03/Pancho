"use client";

import Link from "next/link";
import { Licitacion } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ExternalLink,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  Zap,
  ThumbsDown,
  FileDown,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OportunidadCardProps {
  licitacion: Licitacion;
  isNew?: boolean;
  onSeguir?: (id: string) => void;
  onNoInteres?: (id: string) => void;
  onAnalyze?: (id: string) => void;
}

export function OportunidadCard({
  licitacion,
  isNew = false,
  onSeguir,
  onNoInteres,
  onAnalyze,
}: OportunidadCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "No especificado";
    const formatted = new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);
    if (amount >= 1_000_000) {
      return formatted.replace(/\s/g, "");
    }
    return formatted;
  };

  const estadoLabel: Record<string, string> = {
    activa: "Abierta",
    cerrada: "Cerrada",
    adjudicada: "Adjudicada",
    desierta: "Desierta",
    revocada: "Revocada",
  };
  const estadoColor =
    licitacion.estado === "activa"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className="relative rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {isNew && (
        <div className="absolute -top-1 -left-1 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
          NUEVO
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-3">
          {/* Código y badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-gray-600">
              {licitacion.codigo_externo}
            </Badge>
            <Badge className={`border ${estadoColor}`}>
              {estadoLabel[licitacion.estado] ?? licitacion.estado}
            </Badge>
            {licitacion.resumen_ia && (
              <Badge className="border border-violet-200 bg-violet-50 text-violet-800">
                <Sparkles className="mr-1 h-3 w-3" />
                Resumen IA
              </Badge>
            )}
          </div>

          {/* Título */}
          <h3 className="text-lg font-bold leading-tight text-gray-900">
            {licitacion.nombre}
          </h3>

          {/* Tipo y fuente */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-gray-600">
              <Building2 className="mr-1 h-3.5 w-3.5" />
              Licitación
            </Badge>
            <Badge variant="outline" className="text-gray-600">
              CL MercadoPúblico
            </Badge>
          </div>

          {/* Acciones y match */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
              <Zap className="h-4 w-4" />
              + 80%
            </span>
            {onSeguir && (
              <Button variant="outline" size="sm" onClick={() => onSeguir(licitacion.id)}>
                Seguir
              </Button>
            )}
            {onNoInteres && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                onClick={() => onNoInteres(licitacion.id)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Detalles */}
          <div className="space-y-1.5 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{licitacion.organismo}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                Monto estimado: {formatCurrency(licitacion.monto_estimado)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                Chile
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                Cierre: {format(new Date(licitacion.fecha_cierre), "d MMM HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        </div>

        {/* Presupuesto y acciones */}
        <div className="flex flex-col items-end justify-between gap-4 lg:min-w-[180px]">
          <p className="text-right text-xl font-bold text-gray-900">
            PRESUPUESTO {formatCurrency(licitacion.monto_estimado)}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/licitaciones/${licitacion.id}`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                Ver y cotizar
              </Link>
            </Button>
            {licitacion.link_oficial && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={licitacion.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver en Mercado Público"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {onAnalyze && !licitacion.resumen_ia && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAnalyze(licitacion.id)}
                title="Analizar con IA"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
