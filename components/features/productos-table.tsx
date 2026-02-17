"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Producto } from "@/types";
import { ExternalLink, Pencil, Trash2, Plus } from "lucide-react";
import { ProductoFormDialog, ProductoFormData } from "./producto-form-dialog";

interface ProductosTableProps {
  productos: Producto[];
  onRefresh: () => void;
  onCreate: (data: ProductoFormData) => Promise<void>;
  onUpdate: (id: string, data: ProductoFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProductosTable({
  productos,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: ProductosTableProps) {
  const [filteredData, setFilteredData] = React.useState(productos);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sitioFilter, setSitioFilter] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProducto, setEditingProducto] = React.useState<Producto | null>(null);
  const [deleteProducto, setDeleteProducto] = React.useState<Producto | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    let filtered = productos;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (p.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (p.sitio_origen?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    if (sitioFilter !== "all") {
      filtered = filtered.filter((p) => p.sitio_origen === sitioFilter);
    }

    setFilteredData(filtered);
  }, [productos, searchTerm, sitioFilter]);

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "No especificado";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const sitiosUnicos = [...new Set(productos.map((p) => p.sitio_origen).filter(Boolean))] as string[];

  const handleAdd = () => {
    setEditingProducto(null);
    setFormOpen(true);
  };

  const handleEdit = (p: Producto) => {
    setEditingProducto(p);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: ProductoFormData) => {
    if (editingProducto) {
      await onUpdate(editingProducto.id, data);
    } else {
      await onCreate(data);
    }
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteProducto) return;
    await onDelete(deleteProducto.id);
    setDeleteProducto(null);
    onRefresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Catálogo de productos capturados desde e-commerce. Total: {filteredData.length}
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar por nombre, marca o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            className="flex h-10 w-[180px] items-center justify-between rounded-lg border border-input bg-white px-3 py-2 text-sm"
            value={sitioFilter}
            onChange={(e) => setSitioFilter(e.target.value)}
          >
            <option value="all">Todos los sitios</option>
            {sitiosUnicos.map((sitio) => (
              <option key={sitio} value={sitio}>
                {sitio}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Sitio</TableHead>
                <TableHead>Precio Capturado</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead className="text-right w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No hay productos. Usa la extensión Chrome para capturar o agrega uno manualmente.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>
                      {producto.imagen_url ? (
                        <img
                          src={producto.imagen_url}
                          alt={producto.nombre}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium truncate max-w-[250px]" title={producto.nombre}>
                          {producto.nombre}
                        </div>
                        {producto.marca && (
                          <div className="text-xs text-muted-foreground">{producto.marca}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{producto.sitio_origen || "—"}</span>
                    </TableCell>
                    <TableCell>{formatCurrency(producto.precio_capturado)}</TableCell>
                    <TableCell>{formatCurrency(producto.precio_venta)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {producto.url_origen && !producto.url_origen.startsWith("manual-") && (
                          <a
                            href={producto.url_origen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md hover:bg-accent p-2"
                            title="Ver en origen"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(producto)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteProducto(producto)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {mounted && (
        <ProductoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          producto={editingProducto}
          onSubmit={handleFormSubmit}
        />
      )}

      {mounted && (
      <Dialog open={!!deleteProducto} onOpenChange={(open) => !open && setDeleteProducto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              Se eliminará &quot;{deleteProducto?.nombre}&quot;. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProducto(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </Card>
  );
}
