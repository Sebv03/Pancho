"use client";

import { useEffect, useState } from "react";
import { ProductosTable } from "@/components/features/productos-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Producto } from "@/types";
import { RefreshCw, Package } from "lucide-react";
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

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo de productos capturados desde e-commerce con la extensión Chrome
          </p>
        </div>
        <Button variant="outline" onClick={fetchProductos} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
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
