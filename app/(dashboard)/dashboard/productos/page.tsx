"use client";

import { useEffect, useState, useRef } from "react";
import { ProductosTable } from "@/components/features/productos-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Producto } from "@/types";
import Link from "next/link";
import { RefreshCw, Package, FileText, FileDown, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProductoFormData } from "@/components/features/producto-form-dialog";

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/productos?limit=200");
      const data = await response.json();
      if (response.ok) {
        setProductos(data.data || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar productos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: ProductoFormData) => {
    const response = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio_capturado: Number(formData.precio_capturado),
        precio_venta: formData.precio_venta ? Number(formData.precio_venta) : null,
        url_origen: formData.url_origen || undefined,
        sitio_origen: formData.sitio_origen || null,
        imagen_url: formData.imagen_url || null,
        sku: formData.sku || null,
        marca: formData.marca || null,
        categoria: formData.categoria || null,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      toast({ title: "Producto creado", description: "El producto se agregó correctamente." });
    } else {
      toast({
        title: "Error",
        description: data.error || data.details || "Error al crear producto",
        variant: "destructive",
      });
      throw new Error(data.error || "Error al crear");
    }
  };

  const handleUpdate = async (id: string, formData: ProductoFormData) => {
    const response = await fetch(`/api/productos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio_capturado: Number(formData.precio_capturado),
        precio_venta: formData.precio_venta ? Number(formData.precio_venta) : null,
        url_origen: formData.url_origen || null,
        sitio_origen: formData.sitio_origen || null,
        imagen_url: formData.imagen_url || null,
        sku: formData.sku || null,
        marca: formData.marca || null,
        categoria: formData.categoria || null,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      toast({ title: "Producto actualizado", description: "Los cambios se guardaron correctamente." });
    } else {
      toast({
        title: "Error",
        description: data.error || data.details || "Error al actualizar producto",
        variant: "destructive",
      });
      throw new Error(data.error || "Error al actualizar");
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/productos/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (response.ok) {
      toast({ title: "Producto eliminado", description: "El producto se eliminó correctamente." });
    } else {
      toast({
        title: "Error",
        description: data.error || data.details || "Error al eliminar producto",
        variant: "destructive",
      });
      throw new Error(data.error || "Error al eliminar");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/productos?limit=5000");
      const data = await res.json();
      const list = data.data || [];
      if (list.length === 0) {
        toast({ title: "Sin datos", description: "No hay productos para exportar.", variant: "destructive" });
        return;
      }
      const { exportarProductosExcel } = await import("@/lib/utils/excel-productos");
      await exportarProductosExcel(list, `productos-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Exportado", description: `${list.length} productos exportados a Excel.` });
    } catch {
      toast({ title: "Error", description: "No se pudo exportar.", variant: "destructive" });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({ title: "Formato inválido", description: "Usa un archivo .xlsx o .xls", variant: "destructive" });
      e.target.value = "";
      return;
    }
    try {
      const { parsearExcelProductos, excelRowToProductoPayload } = await import("@/lib/utils/excel-productos");
      const rows = await parsearExcelProductos(file);
      if (rows.length === 0) {
        toast({ title: "Sin datos válidos", description: "El Excel no tiene filas con Nombre y Precio capturado.", variant: "destructive" });
        e.target.value = "";
        return;
      }
      let creados = 0;
      let errores = 0;
      for (const row of rows) {
        const payload = excelRowToProductoPayload(row);
        const response = await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) creados++;
        else errores++;
      }
      toast({
        title: "Importación completada",
        description: `${creados} productos agregados${errores > 0 ? `, ${errores} con error` : ""}.`,
      });
      fetchProductos();
    } catch (err) {
      toast({
        title: "Error al importar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo de productos capturados desde e-commerce con la extensión Chrome
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/pdf">
            <FileText className="mr-2 h-4 w-4" />
            Generar PDF
          </Link>
        </Button>
        <Button variant="outline" onClick={fetchProductos} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button variant="outline" onClick={handleExportExcel} disabled={loading}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Importar Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportExcel}
        />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productos.length}</p>
                <p className="text-sm text-muted-foreground">Productos en catálogo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {[...new Set(productos.map((p) => p.sitio_origen))].filter(Boolean).length}
                </p>
                <p className="text-sm text-muted-foreground">Sitios de origen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProductosTable
          productos={productos}
          onRefresh={fetchProductos}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
