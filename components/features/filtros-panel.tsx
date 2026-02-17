"use client";

import { X, Zap, Building2, Search, MapPin, Hash, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

/** Códigos tipo correlativos a montos UTM (L1, LE, LP, LR, LS, COT) */
export const CODIGOS_POR_MONTO = [
  { codigo: "L1", desc: "< 100 UTM" },
  { codigo: "LE", desc: "100 - 1.000 UTM" },
  { codigo: "LP", desc: "1.000 - 5.000 UTM" },
  { codigo: "LR", desc: "≥ 5.000 UTM" },
  { codigo: "LS", desc: "Servicios personales" },
  { codigo: "COT", desc: "Cotización" },
] as const;

/** Opciones para "publicado hace X meses" */
export const MESES_PUBLICADO_OPCIONES = [
  { value: "", label: "Cualquier fecha" },
  { value: "1", label: "Último mes" },
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
] as const;

export interface FiltrosState {
  tipoLicitacion: boolean;
  tipoCompraAgil: boolean;
  estado: "todas" | "activas";
  codigosMonto: string[];
  mesesPublicado: string;
  organismo: string;
  presupuestoMin: string;
  presupuestoMax: string;
  region: string;
  comuna: string;
}

export const FILTROS_DEFAULT: FiltrosState = {
  tipoLicitacion: true,
  tipoCompraAgil: true,
  estado: "todas",
  codigosMonto: [],
  mesesPublicado: "",
  organismo: "",
  presupuestoMin: "",
  presupuestoMax: "",
  region: "",
  comuna: "",
};

interface FiltrosPanelProps {
  open: boolean;
  onClose: () => void;
  filtros: FiltrosState;
  onFiltrosChange: (f: FiltrosState) => void;
  regiones: string[];
  comunas: string[];
  organismos: string[];
}

export function FiltrosPanel({
  open,
  onClose,
  filtros,
  onFiltrosChange,
  regiones,
  comunas,
  organismos,
}: FiltrosPanelProps) {
  const update = (partial: Partial<FiltrosState>) => {
    onFiltrosChange({ ...filtros, ...partial });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l shadow-xl transition-transform duration-200 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Filtros</h2>
            <p className="text-sm text-muted-foreground">Refina tus resultados</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* TIPO */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Tipo</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.tipoCompraAgil}
                  onChange={(e) => update({ tipoCompraAgil: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Compra Ágil</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.tipoLicitacion}
                  onChange={(e) => update({ tipoLicitacion: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Licitación</span>
              </label>
            </div>
          </div>

          {/* ESTADO */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Estado</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  checked={filtros.estado === "todas"}
                  onChange={() => update({ estado: "todas" })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Todas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  checked={filtros.estado === "activas"}
                  onChange={() => update({ estado: "activas" })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Sin abrir</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  Nuevo
                </span>
              </label>
            </div>
          </div>

          {/* PUBLICADO HACE X MESES */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Publicado hace
            </Label>
            <div className="mt-2">
              <Select
                value={filtros.mesesPublicado || "todas"}
                onValueChange={(v) => update({ mesesPublicado: v === "todas" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier fecha" />
                </SelectTrigger>
                <SelectContent>
                  {MESES_PUBLICADO_OPCIONES.map(({ value, label }) => (
                    <SelectItem key={value || "todas"} value={value || "todas"}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CÓDIGOS CORRELATIVOS A MONTOS */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              Código por monto (UTM)
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Filtra por tipo de licitación según rango UTM
            </p>
            <div className="space-y-1.5">
              {CODIGOS_POR_MONTO.map(({ codigo, desc }) => (
                <label
                  key={codigo}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={filtros.codigosMonto.includes(codigo)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...filtros.codigosMonto, codigo]
                        : filtros.codigosMonto.filter((c) => c !== codigo);
                      update({ codigosMonto: next });
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">
                    <span className="font-medium">{codigo}</span>
                    <span className="text-muted-foreground ml-1">({desc})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ORGANISMO */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Organismo
            </Label>
            <div className="mt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar organismos..."
                value={filtros.organismo}
                onChange={(e) => update({ organismo: e.target.value })}
                className="pl-9"
                list="organismos-list"
              />
              {organismos.length > 0 && (
                <datalist id="organismos-list">
                  {organismos.slice(0, 50).map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* PRESUPUESTO */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Presupuesto (CLP)
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                placeholder="Mínimo"
                type="number"
                min={0}
                value={filtros.presupuestoMin}
                onChange={(e) => update({ presupuestoMin: e.target.value })}
              />
              <Input
                placeholder="Máximo"
                type="number"
                min={0}
                value={filtros.presupuestoMax}
                onChange={(e) => update({ presupuestoMax: e.target.value })}
              />
            </div>
          </div>

          {/* UBICACIÓN */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Ubicación
            </Label>
            <div className="mt-2">
              <Select
                value={filtros.region || "todas"}
                onValueChange={(v) => update({ region: v === "todas" ? "" : v, comuna: "" })}
              >
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Todas las regiones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las regiones</SelectItem>
                  {regiones.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* COMUNA */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Comuna</Label>
            <div className="mt-2">
              <Select
                value={filtros.comuna || "todas"}
                onValueChange={(v) => update({ comuna: v === "todas" ? "" : v })}
                disabled={!filtros.region}
              >
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  <SelectValue
                    placeholder={
                      filtros.region ? "Selecciona comuna" : "Selecciona una región primero"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las comunas</SelectItem>
                  {comunas.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Limpiar filtros */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onFiltrosChange(FILTROS_DEFAULT)}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </>
  );
}
