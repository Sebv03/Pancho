"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Licitacion } from "@/types";
import { Zap, Download, Filter } from "lucide-react";
import { OportunidadCard } from "./oportunidad-card";

interface LicitacionesTableProps {
  licitaciones: Licitacion[];
  onAnalyze?: (licitacionId: string) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onSeguir?: (id: string) => void;
  onNoInteres?: (id: string) => void;
}

export function LicitacionesTable({
  licitaciones,
  onAnalyze,
  searchTerm: controlledSearch,
  onSearchChange,
  onSeguir,
  onNoInteres,
}: LicitacionesTableProps) {
  const [internalSearch, setInternalSearch] = React.useState("");
  const searchTerm = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearchTerm = onSearchChange ?? setInternalSearch;

  const [filteredData, setFilteredData] = React.useState(licitaciones);
  const [estadoFilter, setEstadoFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("mejor");

  React.useEffect(() => {
    let filtered = licitaciones;

    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.codigo_externo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.organismo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (estadoFilter !== "all") {
      filtered = filtered.filter((l) => l.estado === estadoFilter);
    }

    if (sortBy === "cierre") {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(a.fecha_cierre).getTime() - new Date(b.fecha_cierre).getTime()
      );
    } else if (sortBy === "monto") {
      filtered = [...filtered].sort(
        (a, b) => (b.monto_estimado ?? 0) - (a.monto_estimado ?? 0)
      );
    }

    setFilteredData(filtered);
  }, [licitaciones, searchTerm, estadoFilter, sortBy]);

  const totalPresupuesto = filteredData.reduce(
    (sum, l) => sum + (l.monto_estimado ?? 0),
    0
  );
  const formatMonto = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  };

  return (
    <div className="space-y-6">
      {/* Header tipo imagen */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Oportunidades Recomendadas</h2>
          <p className="text-muted-foreground">
            Busca nuevas oportunidades recomendadas activas
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{filteredData.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{formatMonto(totalPresupuesto)}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar oportunidades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activa">Abiertas</SelectItem>
              <SelectItem value="cerrada">Cerradas</SelectItem>
              <SelectItem value="adjudicada">Adjudicadas</SelectItem>
              <SelectItem value="desierta">Desiertas</SelectItem>
              <SelectItem value="revocada">Revocadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mejor">Mejor Coincidencia</SelectItem>
              <SelectItem value="cierre">Fecha de cierre</SelectItem>
              <SelectItem value="monto">Monto mayor</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </div>
      </div>

      {/* Lista de cards */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No se encontraron oportunidades</p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((licitacion, index) => (
            <OportunidadCard
              key={licitacion.id}
              licitacion={licitacion}
              isNew={index < 3 && licitacion.estado === "activa"}
              onSeguir={onSeguir}
              onNoInteres={onNoInteres}
              onAnalyze={onAnalyze}
            />
          ))
        )}
      </div>
    </div>
  );
}
