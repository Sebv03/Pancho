"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LicitacionItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number | null;
  producto_id: string | null;
  productos?: { nombre: string; precio_venta: number | null; precio_capturado: number } | null;
}

interface Licitacion {
  id: string;
  codigo_externo: string;
  nombre: string;
  descripcion: string | null;
  fecha_cierre: string;
  organismo: string;
  monto_estimado: number | null;
  estado: string;
  link_oficial: string | null;
  items?: LicitacionItem[];
}

export default function LicitacionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [licitacion, setLicitacion] = useState<Licitacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasEntrega, setDiasEntrega] = useState(2);
  const [validezDias, setValidezDias] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [productos, setProductos] = useState<{ id: string; nombre: string; precio_venta: number | null; precio_capturado: number }[]>([]);
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoCant, setNuevoCant] = useState("1");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoProductoId, setNuevoProductoId] = useState("");
  const [items, setItems] = useState<LicitacionItem[]>([]);
  const { toast } = useToast();

  const fetchLicitacion = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [licRes, prodRes] = await Promise.all([
        fetch(`/api/licitaciones/${id}`),
        fetch("/api/productos?limit=500"),
      ]);
      const licData = await licRes.json();
      const prodData = await prodRes.json();

      if (licRes.ok) {
        const data = licData.data;
        setLicitacion(data);
        setItems(data?.items ?? []);
        setDiasEntrega(
          typeof window !== "undefined"
            ? Number(localStorage.getItem("licitia_dias_entrega")) || 2
            : 2
        );
        setValidezDias(
          typeof window !== "undefined"
            ? Number(localStorage.getItem("licitia_validez_dias")) || 20
            : 20
        );
      } else {
        toast({ title: "Error", description: licData.error, variant: "destructive" });
      }
      if (prodRes.ok) {
        setProductos(prodData.data || []);
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al cargar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicitacion(true);
  }, [id]);

  const updateItem = (
    itemId: string,
    field: "descripcion" | "cantidad" | "precio_unitario" | "producto_id",
    value: string | number | null
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const upd = { ...i, [field]: value };
        if (field === "producto_id" && value) {
          const prod = productos.find((p) => p.id === value);
          if (prod) upd.precio_unitario = prod.precio_venta ?? prod.precio_capturado;
        }
        return upd;
      })
    );
  };

  const addItem = () => {
    let desc = nuevoDesc.trim();
    let precio: number | null = nuevoPrecio ? Number(nuevoPrecio) : null;
    let productoId: string | null = nuevoProductoId || null;

    if (productoId) {
      const prod = productos.find((p) => p.id === productoId);
      if (prod) {
        desc = prod.nombre;
        precio = prod.precio_venta ?? prod.precio_capturado;
      }
    }

    if (!desc) {
      toast({ title: "Ingresa la descripción o selecciona un producto", variant: "destructive" });
      return;
    }

    const cantidad = Number(nuevoCant) || 1;
    const newItem: LicitacionItem = {
      id: `item-${Date.now()}`,
      descripcion: desc,
      cantidad,
      precio_unitario: precio,
      producto_id: productoId,
    };

    setItems((prev) => [...prev, newItem]);
    setNuevoDesc("");
    setNuevoCant("1");
    setNuevoPrecio("");
    setNuevoProductoId("");
    toast({ title: "Item agregado a la tabla" });
  };

  const deleteItem = (itemId: string) => {
    if (!confirm("¿Eliminar este item?")) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    toast({ title: "Item eliminado" });
  };

  const handleGenerarPDF = async () => {
    if (!licitacion) return;
    if (!items.length) {
      toast({
        title: "Sin items",
        description: "Agrega al menos un item y asigna precio unitario a cada uno.",
        variant: "destructive",
      });
      return;
    }

    const sinPrecio = items.filter((i) => i.precio_unitario == null || i.precio_unitario <= 0);
    if (sinPrecio.length > 0) {
      toast({
        title: "Precios faltantes",
        description: `Asigna precio unitario a: ${sinPrecio.map((i) => i.descripcion.slice(0, 30)).join(", ")}...`,
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      localStorage.setItem("licitia_dias_entrega", String(diasEntrega));
      localStorage.setItem("licitia_validez_dias", String(validezDias));

      const empresa = (() => {
        try {
          const s = localStorage.getItem("licitia_empresa_config");
          return s ? JSON.parse(s) : undefined;
        } catch {
          return undefined;
        }
      })();

      const res = await fetch("/api/cotizaciones/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            descripcion: i.descripcion,
            unidades: i.cantidad,
            precio_unitario: i.precio_unitario,
          })),
          licitacion_id: licitacion.id,
          empresa: empresa
            ? { ...empresa, diasEntrega, validezDias }
            : { ...{ razonSocial: "ALBATERRA SPA", rut: "78.167.034-0", contacto: "FRANCISCO IGNACIO SOLAR MORENO", email: "FSOLAR94@GMAIL.COM", telefono: "56986037230", direccion: "SAN RIGOBERTO #271, MAIPU" }, diasEntrega, validezDias },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${licitacion.codigo_externo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF generado", description: "Descarga iniciada." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar PDF",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const neto = items.reduce((s, i) => s + (i.cantidad * (i.precio_unitario || 0)), 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!licitacion) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Licitación no encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Link>

      {/* Detalle de la Compra Ágil - como Mercado Público */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{licitacion.nombre}</CardTitle>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {licitacion.estado.toUpperCase()}
            </span>
          </div>
          <CardDescription>Código: {licitacion.codigo_externo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {licitacion.descripcion && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm whitespace-pre-wrap">{licitacion.descripcion}</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Organismo</p>
              <p className="text-sm font-medium">{licitacion.organismo}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Presupuesto estimado</p>
              <p className="text-sm font-medium">
                {licitacion.monto_estimado != null
                  ? `$ ${licitacion.monto_estimado.toLocaleString("es-CL")}`
                  : "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Fecha de cierre</p>
              <p className="text-sm font-medium">
                {format(new Date(licitacion.fecha_cierre), "dd-MM-yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          {licitacion.link_oficial && (
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <a href={licitacion.link_oficial} target="_blank" rel="noopener noreferrer">
                  Ver en Mercado Público (adjuntos y PDF con listado de productos)
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Revisa los adjuntos en Mercado Público para ver el listado detallado de productos y cantidades que solicitan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tu oferta y Generar PDF - lado a lado */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Tabla de items - formato como el PDF */}
      <Card>
        <CardHeader>
          <CardTitle>Tu oferta (tabla para el PDF)</CardTitle>
          <CardDescription>
            Agrega los productos que piden (ej: 10 galletas 100gr, 20 aguas 500ml) con la cantidad solicitada y tu precio unitario. 
            El listado detallado está en el PDF adjunto de Mercado Público.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#166534] text-white">
                  <th className="p-2 text-center w-14">ITEM</th>
                  <th className="p-2 text-left">DESCRIPCION</th>
                  <th className="p-2 text-center w-24">UNIDADES</th>
                  <th className="p-2 text-center w-28">PRECIO UNIDAD</th>
                  <th className="p-2 text-center w-28">PRECIO TOTAL</th>
                  <th className="p-2 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay items. Haz clic en &quot;Agregar item&quot; e ingresa lo que piden (ej: 10 galletas 100gr, 20 aguas 500ml) con la cantidad.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-center font-medium">{idx + 1}</td>
                      <td className="p-2">
                        <Input
                          value={item.descripcion}
                          onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                          placeholder="ej: Galletas 100gr"
                          className="border-0 h-8 bg-transparent focus-visible:ring-0"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 1;
                            if (v !== item.cantidad) updateItem(item.id, "cantidad", v);
                          }}
                          className="h-8 text-center"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="number"
                            min={0}
                            value={item.precio_unitario ?? ""}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "precio_unitario",
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="h-8 w-24"
                          />
                        </div>
                        <select
                          className="mt-1 h-7 w-full rounded border px-2 text-xs text-muted-foreground"
                          value={item.producto_id ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateItem(item.id, "producto_id", v || null);
                          }}
                        >
                          <option value="">Desde producto...</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre.slice(0, 30)}... (${(p.precio_venta ?? p.precio_capturado).toLocaleString("es-CL")})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {item.precio_unitario != null
                          ? `$ ${(item.cantidad * item.precio_unitario).toLocaleString("es-CL")}`
                          : "—"}
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <p className="text-sm font-medium">Agregar item a la oferta</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="text-xs text-muted-foreground">Seleccionar producto (nombre + precio)</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={nuevoProductoId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNuevoProductoId(v);
                    if (v) {
                      const p = productos.find((x) => x.id === v);
                      if (p) {
                        setNuevoDesc(p.nombre);
                        setNuevoPrecio(String(p.precio_venta ?? p.precio_capturado));
                      }
                    } else {
                      setNuevoDesc("");
                      setNuevoPrecio("");
                    }
                  }}
                >
                  <option value="">— Manual —</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — $ {(p.precio_venta ?? p.precio_capturado).toLocaleString("es-CL")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs text-muted-foreground">Descripción</label>
                <Input
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  placeholder="ej: Galletas 100gr, Aguas 500ml"
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input
                  type="number"
                  min={1}
                  value={nuevoCant}
                  onChange={(e) => setNuevoCant(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Precio unitario ($)</label>
                <Input
                  type="number"
                  min={0}
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar a la tabla
                </Button>
              </div>
            </div>
            {productos.length === 0 && (
              <p className="text-xs text-amber-600">
                No hay productos en el catálogo. Ve a Productos para capturar o agregar productos.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generar cotización PDF */}
      <Card>
        <CardHeader>
          <CardTitle>Generar cotización PDF</CardTitle>
          <CardDescription>
            Configura días de entrega y validez. Luego genera el PDF con tu oferta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Días hábiles de entrega</label>
              <Input
                type="number"
                min={1}
                value={diasEntrega}
                onChange={(e) => setDiasEntrega(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Validez de cotización (días)</label>
              <Input
                type="number"
                min={1}
                value={validezDias}
                onChange={(e) => setValidezDias(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex justify-between text-sm mb-2">
              <span>Neto:</span>
              <span className="font-medium">{neto.toLocaleString("es-CL")} CLP</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>IVA 19%:</span>
              <span className="font-medium">{iva.toLocaleString("es-CL")} CLP</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{(neto + iva).toLocaleString("es-CL")} CLP</span>
            </div>
          </div>

          <Button onClick={handleGenerarPDF} disabled={generating}>
            <FileDown className="mr-2 h-4 w-4" />
            {generating ? "Generando..." : "Generar y descargar PDF"}
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
