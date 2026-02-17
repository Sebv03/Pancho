"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Producto } from "@/types";

export interface ProductoFormData {
  nombre: string;
  descripcion: string;
  precio_capturado: string;
  precio_venta: string;
  url_origen: string;
  sitio_origen: string;
  imagen_url: string;
  sku: string;
  marca: string;
  categoria: string;
}

const emptyForm: ProductoFormData = {
  nombre: "",
  descripcion: "",
  precio_capturado: "",
  precio_venta: "",
  url_origen: "",
  sitio_origen: "",
  imagen_url: "",
  sku: "",
  marca: "",
  categoria: "",
};

interface ProductoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: Producto | null;
  onSubmit: (data: ProductoFormData) => Promise<void>;
}

export function ProductoFormDialog({
  open,
  onOpenChange,
  producto,
  onSubmit,
}: ProductoFormDialogProps) {
  const isEditing = !!producto;
  const [form, setForm] = React.useState<ProductoFormData>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio_capturado: String(producto.precio_capturado),
        precio_venta: producto.precio_venta != null ? String(producto.precio_venta) : "",
        url_origen: producto.url_origen || "",
        sitio_origen: producto.sitio_origen || "",
        imagen_url: producto.imagen_url || "",
        sku: producto.sku || "",
        marca: producto.marca || "",
        categoria: producto.categoria || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [producto, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del producto."
              : "Agrega un nuevo producto al catálogo manualmente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              required
              placeholder="Nombre del producto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción opcional"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="precio_capturado">Precio capturado (CLP) *</Label>
              <Input
                id="precio_capturado"
                type="number"
                min="0"
                step="1"
                value={form.precio_capturado}
                onChange={(e) => setForm((f) => ({ ...f, precio_capturado: e.target.value }))}
                required
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precio_venta">Precio venta (CLP)</Label>
              <Input
                id="precio_venta"
                type="number"
                min="0"
                step="1"
                value={form.precio_venta}
                onChange={(e) => setForm((f) => ({ ...f, precio_venta: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url_origen">URL origen</Label>
            <Input
              id="url_origen"
              type="url"
              value={form.url_origen}
              onChange={(e) => setForm((f) => ({ ...f, url_origen: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sitio_origen">Sitio origen</Label>
              <Input
                id="sitio_origen"
                value={form.sitio_origen}
                onChange={(e) => setForm((f) => ({ ...f, sitio_origen: e.target.value }))}
                placeholder="lider.cl, jumbo.cl..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={form.marca}
                onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                placeholder="Marca"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Categoría"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Código SKU"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imagen_url">URL imagen</Label>
            <Input
              id="imagen_url"
              type="url"
              value={form.imagen_url}
              onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
