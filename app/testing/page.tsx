"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, ArrowLeft, ExternalLink, Eye, Loader2, Zap, SlidersHorizontal } from "lucide-react";
import { OportunidadCardAPI } from "@/components/features/oportunidad-card-api";
import {
  FiltrosPanel,
  FILTROS_DEFAULT,
  type FiltrosState,
} from "@/components/features/filtros-panel";
import { aplicarFiltros, extraerOpciones } from "@/lib/utils/filtros-api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TestingPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estado, setEstado] = useState("activas");
  const [tipoProcedimiento, setTipoProcedimiento] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    licitaciones: unknown[];
    total: number;
    raw?: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCodigo, setSelectedCodigo] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_DEFAULT);
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  const openDetalle = async (codigo: string, origen: "lic" | "oc" = "lic") => {
    setSelectedCodigo(codigo);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({ codigo, origen });
      const res = await fetch(`/api/testing/chilecompra/detalle?${params}`);
      const json = await res.json();
      if (res.ok && json.licitacion) setDetailData(json.licitacion as Record<string, unknown>);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetalle = () => {
    setSelectedCodigo(null);
    setDetailData(null);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ fecha, estado, tipo: tipoProcedimiento });
      const res = await fetch(`/api/testing/chilecompra?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al consultar");
      setData({
        licitaciones: json.licitaciones || [],
        total: json.total || 0,
        raw: json.raw,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number | null | undefined) => {
    if (n == null) return "—";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
  };

  const listado = (data?.licitaciones ?? []) as Record<string, unknown>[];
  const opciones = useMemo(() => extraerOpciones(listado), [listado]);
  const comunasParaRegion = filtros.region
    ? opciones.comunasPorRegion[filtros.region] ?? []
    : opciones.comunas;
  const filteredLicitaciones = useMemo(
    () => aplicarFiltros(listado, filtros),
    [listado, filtros]
  );

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Testing API Mercado Público</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vista previa de cómo se muestra la información de la API de ChileCompra
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consultar API</CardTitle>
            <CardDescription>
              Selecciona fecha y estado. Requiere CHILECOMPRA_API_KEY en .env.local
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fecha</label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm w-40"
              >
                <option value="activas">Activas (Publicadas)</option>
                <option value="cerrada">Cerrada</option>
                <option value="adjudicada">Adjudicada</option>
                <option value="desierta">Desierta</option>
                <option value="revocada">Revocada</option>
                <option value="suspendida">Suspendida</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de procedimiento</label>
              <select
                value={tipoProcedimiento}
                onChange={(e) => setTipoProcedimiento(e.target.value)}
                className="h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm w-56"
              >
                <option value="todos">Todos</option>
                <option value="licitaciones">Solo Licitaciones</option>
                <option value="compra_agil">Solo Compra Ágil (AG)</option>
                <option value="trato_directo">Compra Ágil + Trato Directo (AG, COT, C2, F2, G2)</option>
                <option value="menor_30_utm">Menores a 30 UTM</option>
              </select>
            </div>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Consultando..." : "Consultar API"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive font-medium">Error</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {data && !error && (
          <>
            {/* Header tipo Dashboard */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Oportunidades Recomendadas</h2>
                <p className="text-muted-foreground">
                  Datos reales desde la API de Mercado Público
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setFiltrosOpen(true)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {filteredLicitaciones.length !== listado.length && (
                    <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                      {filteredLicitaciones.length}
                    </span>
                  )}
                </Button>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="text-2xl font-bold">{filteredLicitaciones.length}</span>
                    {filteredLicitaciones.length !== listado.length && (
                      <span className="text-sm text-muted-foreground">
                        de {listado.length}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {(() => {
                      const total = filteredLicitaciones.reduce(
                        (s, l) => s + (Number(l.MontoEstimado ?? l.Total ?? l.TotalNeto ?? 0)),
                        0
                      );
                      if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(0)}M`;
                      if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
                      return formatCurrency(total);
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de filtros */}
            <FiltrosPanel
              open={filtrosOpen}
              onClose={() => setFiltrosOpen(false)}
              filtros={filtros}
              onFiltrosChange={setFiltros}
              regiones={opciones.regiones}
              comunas={comunasParaRegion}
              organismos={opciones.organismos}
            />

            {/* Lista de cards con datos reales */}
            <div className="space-y-4">
              {filteredLicitaciones.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center space-y-4">
                    {listado.length > 0 ? (
                      <>
                        <p className="text-muted-foreground">
                          Los filtros actuales no coinciden con ningún resultado de los {listado.length} disponibles.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setFiltros(FILTROS_DEFAULT)}
                          className="gap-2"
                        >
                          Limpiar filtros y ver todos
                        </Button>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No hay resultados para esta consulta</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredLicitaciones.map((lic, index) => (
                  <OportunidadCardAPI
                    key={String(lic.CodigoExterno ?? lic.Codigo ?? index)}
                    item={lic}
                    onVerDetalle={openDetalle}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de una licitación (estructura raw)</CardTitle>
                <CardDescription>
                  Campos disponibles según la documentación de la API
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.licitaciones.length > 0 ? (
                  <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(data.licitaciones[0], null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={!!selectedCodigo} onOpenChange={(open) => !open && closeDetalle()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detalle de licitación {selectedCodigo}
              </DialogTitle>
              <DialogDescription>
                Toda la información disponible desde la API de Mercado Público
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : detailData ? (
                <>
                  <DetalleLicitacion data={detailData} formatCurrency={formatCurrency} />
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Ver JSON completo
                    </summary>
                    <pre className="mt-2 text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-80">
                      {JSON.stringify(detailData, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  No se pudo cargar el detalle. Verifica que el código sea correcto.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DetalleLicitacion({
  data,
  formatCurrency,
}: {
  data: Record<string, unknown>;
  formatCurrency: (n: number | null | undefined) => string;
}) {
  const comprador = data.Comprador as Record<string, unknown> | undefined;
  const fechas = data.Fechas as Record<string, unknown> | undefined;
  const itemsRaw = data.Items as { Listado?: Record<string, unknown>[] } | Record<string, unknown>[] | undefined;
  const itemsListado = Array.isArray(itemsRaw)
    ? itemsRaw
    : (itemsRaw as { Listado?: Record<string, unknown>[] })?.Listado;

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="font-medium text-muted-foreground min-w-[140px]">{label}</span>
      <span className="flex-1 break-words">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="space-y-4 text-sm">
      <section>
        <h4 className="font-semibold mb-2 text-primary">Información general</h4>
        <div className="space-y-0">
          <InfoRow label="Código" value={String(data.CodigoExterno ?? data.Codigo ?? "")} />
          <InfoRow label="Nombre" value={String(data.Nombre ?? "")} />
          <InfoRow label="Descripción" value={String(data.Descripcion ?? "")} />
          <InfoRow label="Estado" value={String(data.Estado ?? data.CodigoEstado ?? "")} />
          <InfoRow label="Tipo" value={String(data.Tipo ?? "")} />
          <InfoRow label="Moneda" value={String(data.Moneda ?? data.TipoMoneda ?? "")} />
          <InfoRow
            label="Monto / Total"
            value={formatCurrency(
              (data.MontoEstimado ?? data.Total ?? data.TotalNeto) as number
            )}
          />
        </div>
      </section>

      {comprador && Object.keys(comprador).length > 0 && (
        <section>
          <h4 className="font-semibold mb-2 text-primary">Comprador / Organismo</h4>
          <div className="space-y-0">
            <InfoRow label="Organismo" value={String(comprador.NombreOrganismo ?? "")} />
            <InfoRow label="Unidad" value={String(comprador.NombreUnidad ?? "")} />
            <InfoRow label="Región" value={String(comprador.RegionUnidad ?? "")} />
            <InfoRow label="Comuna" value={String(comprador.ComunaUnidad ?? "")} />
          </div>
        </section>
      )}

      {data.Proveedor && typeof data.Proveedor === "object" && (
        <section>
          <h4 className="font-semibold mb-2 text-primary">Proveedor</h4>
          <div className="space-y-0">
            <InfoRow label="Nombre" value={String((data.Proveedor as Record<string, unknown>).Nombre ?? "")} />
            <InfoRow label="RUT" value={String((data.Proveedor as Record<string, unknown>).RutSucursal ?? "")} />
          </div>
        </section>
      )}

      {fechas && Object.keys(fechas).length > 0 && (
        <section>
          <h4 className="font-semibold mb-2 text-primary">Fechas</h4>
          <div className="space-y-0">
            {Object.entries(fechas).map(([key, val]) =>
              val ? (
                <InfoRow
                  key={key}
                  label={key}
                  value={
                    typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)
                      ? format(new Date(val as string), "dd MMM yyyy HH:mm", { locale: es })
                      : String(val)
                  }
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {itemsListado && itemsListado.length > 0 && (
        <section>
          <h4 className="font-semibold mb-2 text-primary">Items ({itemsListado.length})</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">Correlativo</th>
                  <th className="p-2 text-left">Producto</th>
                  <th className="p-2 text-left">Cantidad</th>
                  <th className="p-2 text-left">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {itemsListado.slice(0, 20).map((item: Record<string, unknown>, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{String(item.Correlativo ?? "")}</td>
                    <td className="p-2">
                      {String(
                        item.NombreProducto ??
                          item.EspecificacionComprador ??
                          item.EspecificacionProveedor ??
                          item.Descripcion ??
                          ""
                      )}
                    </td>
                    <td className="p-2">{String(item.Cantidad ?? "")}</td>
                    <td className="p-2">{String(item.UnidadMedida ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemsListado.length > 20 && (
              <p className="p-2 text-muted-foreground text-xs">
                … y {itemsListado.length - 20} items más
              </p>
            )}
          </div>
        </section>
      )}

      {data.Link && (
        <a
          href={String(data.Link)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Ver en Mercado Público
        </a>
      )}
    </div>
  );
}
