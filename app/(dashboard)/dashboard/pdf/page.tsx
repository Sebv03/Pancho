"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Plus, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "licitia_empresa_config";

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number | null;
  precio_capturado: number;
}

interface ItemRow {
  id: string;
  descripcion: string;
  unidades: number;
  precio_unitario: number;
}

export default function PdfPage() {
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", descripcion: "", unidades: 1, precio_unitario: 0 },
  ]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [nuevoProductoId, setNuevoProductoId] = useState("");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoCant, setNuevoCant] = useState("1");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [diasEntrega, setDiasEntrega] = useState(2);
  const [validezDias, setValidezDias] = useState(20);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchProductos = async () => {
    try {
      setLoadingProductos(true);
      const res = await fetch("/api/productos?limit=500");
      const data = await res.json();
      if (res.ok) setProductos(data.data || []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar productos", variant: "destructive" });
    } finally {
      setLoadingProductos(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    const d = localStorage.getItem("licitia_dias_entrega");
    const v = localStorage.getItem("licitia_validez_dias");
    if (d) setDiasEntrega(Number(d) || 2);
    if (v) setValidezDias(Number(v) || 20);
  }, []);

  const addItem = () => {
    const desc = nuevoDesc.trim();
    const cant = Number(nuevoCant) || 1;
    const precio = Number(nuevoPrecio) || 0;
    if (!desc) {
      toast({ title: "Ingresa la descripción o selecciona un producto", variant: "destructive" });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        descripcion: desc,
        unidades: cant,
        precio_unitario: precio,
      },
    ]);
    setNuevoProductoId("");
    setNuevoDesc("");
    setNuevoCant("1");
    setNuevoPrecio("");
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const aplicarProductoAItem = (itemId: string, productoId: string) => {
    const p = productos.find((x) => x.id === productoId);
    if (!p) return;
    updateItem(itemId, "descripcion", p.nombre);
    updateItem(itemId, "precio_unitario", p.precio_venta ?? p.precio_capturado);
  };

  const handleGenerarPDF = async () => {
    const validItems = items.filter(
      (i) => i.descripcion.trim() && i.unidades > 0 && i.precio_unitario > 0
    );
    if (validItems.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Agrega al menos un item con descripción, unidades y precio unitario.",
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
          const s = localStorage.getItem(STORAGE_KEY);
          return s ? JSON.parse(s) : undefined;
        } catch {
          return undefined;
        }
      })();

      const res = await fetch("/api/cotizaciones/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map((i) => ({
            descripcion: i.descripcion,
            unidades: i.unidades,
            precio_unitario: i.precio_unitario,
          })),
          empresa: empresa
            ? { ...empresa, diasEntrega, validezDias }
            : {
                razonSocial: "ALBATERRA SPA",
                rut: "78.167.034-0",
                contacto: "FRANCISCO IGNACIO SOLAR MORENO",
                email: "FSOLAR94@GMAIL.COM",
                telefono: "56986037230",
                direccion: "SAN RIGOBERTO #271, MAIPU",
                diasEntrega,
                validezDias,
              },
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
      a.download = `cotizacion-${Date.now()}.pdf`;
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

  const neto = items.reduce(
    (s, i) => s + i.unidades * (i.precio_unitario || 0),
    0
  );
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generar PDF</h1>
          <p className="text-muted-foreground">
            Crea una cotización en PDF sin vincularla a una licitación. Agrega items manualmente o desde el catálogo de productos.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/productos">Ver Productos</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={fetchProductos} disabled={loadingProductos}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingProductos ? "animate-spin" : ""}`} />
          Actualizar productos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items de la cotización</CardTitle>
          <CardDescription>
            Agrega items manualmente o selecciona productos desde el catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabla de items */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left w-10">#</th>
                  <th className="p-2 text-left">Descripción / Desde producto</th>
                  <th className="p-2 text-right w-24">Cant.</th>
                  <th className="p-2 text-right w-28">P. unit.</th>
                  <th className="p-2 text-right w-28">Total</th>
                  <th className="p-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v) aplicarProductoAItem(item.id, v);
                          }}
                        >
                          <option value="">Desde producto...</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre.slice(0, 35)}{p.nombre.length > 35 ? "…" : ""} — $ {(p.precio_venta ?? p.precio_capturado).toLocaleString("es-CL")}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Descripción"
                          value={item.descripcion}
                          onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.unidades || ""}
                        onChange={(e) => updateItem(item.id, "unidades", Number(e.target.value) || 0)}
                        className="h-9 w-20 text-right"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.precio_unitario || ""}
                        onChange={(e) => updateItem(item.id, "precio_unitario", Number(e.target.value) || 0)}
                        className="h-9 w-24 text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.precio_unitario != null && item.unidades
                        ? `$ ${(item.unidades * item.precio_unitario).toLocaleString("es-CL")}`
                        : "—"}
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agregar item: manual o desde producto */}
          <div className="rounded-lg border p-4 bg-muted/30 space-y-4">
            <p className="text-sm font-medium">Agregar item a la cotización</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Label className="text-xs text-muted-foreground">Seleccionar producto del catálogo</Label>
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
                  disabled={loadingProductos}
                >
                  <option value="">— Manual —</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — $ {(p.precio_venta ?? p.precio_capturado).toLocaleString("es-CL")}
                    </option>
                  ))}
                </select>
                {loadingProductos && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Cargando productos...
                  </span>
                )}
              </div>
              <div className="lg:col-span-2">
                <Label className="text-xs text-muted-foreground">Descripción</Label>
                <Input
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  placeholder="ej: Galletas 100gr, Aguas 500ml"
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={nuevoCant}
                  onChange={(e) => setNuevoCant(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Precio unitario ($)</Label>
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
            {productos.length === 0 && !loadingProductos && (
              <p className="text-xs text-amber-600">
                No hay productos en el catálogo. Ve a <Link href="/dashboard/productos" className="underline">Productos</Link> para capturar o agregar productos.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración y generar</CardTitle>
          <CardDescription>
            Días de entrega y validez. Los datos de empresa se guardan automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Días hábiles de entrega</Label>
              <Input
                type="number"
                min={1}
                value={diasEntrega}
                onChange={(e) => setDiasEntrega(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Validez de cotización (días)</Label>
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
  );
}
