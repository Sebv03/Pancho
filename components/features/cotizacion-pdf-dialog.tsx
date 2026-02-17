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
import { Licitacion } from "@/types";

export interface ItemCotizacionForm {
  descripcion: string;
  unidades: number;
  precio_unitario: number;
}

const ITEMS_PRUEBA: ItemCotizacionForm[] = [
  { descripcion: "VASOS PLASTICOS TRANSPARENTES 200 CC", unidades: 20000, precio_unitario: 23 },
  { descripcion: "Papel Fotocopia OFFICE DEPOT Carta 75 g 500 Hojas", unidades: 150, precio_unitario: 3160 },
  { descripcion: "Destacador de Bolsillo Isofit Punta Biselada Amarillo Fluor", unidades: 24, precio_unitario: 304 },
  { descripcion: "Pilas Alcalinas Duracell AA", unidades: 40, precio_unitario: 1001 },
];

interface CotizacionPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licitacion: Licitacion;
}

export function CotizacionPDFDialog({
  open,
  onOpenChange,
  licitacion,
}: CotizacionPDFDialogProps) {
  const [items, setItems] = React.useState<ItemCotizacionForm[]>(ITEMS_PRUEBA);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setItems(ITEMS_PRUEBA);
    }
  }, [open]);

  const getEmpresaConfig = () => {
    try {
      const stored = typeof window !== "undefined" && localStorage.getItem("licitia_empresa_config");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // usar defaults del servidor
    }
    return undefined;
  };

  const handleGenerarPDF = async () => {
    setGenerating(true);
    try {
      const empresa = getEmpresaConfig();
      const response = await fetch("/api/cotizaciones/generar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          licitacion_id: licitacion.id,
          empresa,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Error al generar PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${licitacion.codigo_externo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al generar PDF");
    } finally {
      setGenerating(false);
    }
  };

  const updateItem = (index: number, field: keyof ItemCotizacionForm, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { descripcion: "", unidades: 1, precio_unitario: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalNeto = items.reduce((sum, i) => sum + i.unidades * i.precio_unitario, 0);
  const totalIva = Math.round(totalNeto * 0.19);
  const total = totalNeto + totalIva;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar cotización PDF</DialogTitle>
          <DialogDescription>
            Licitación: {licitacion.nombre}. Edita los items y genera el PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Descripción</th>
                  <th className="p-2 w-24">Unidades</th>
                  <th className="p-2 w-32">Precio Unit.</th>
                  <th className="p-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      <Input
                        value={item.descripcion}
                        onChange={(e) => updateItem(i, "descripcion", e.target.value)}
                        placeholder="Descripción"
                        className="border-0 h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.unidades}
                        onChange={(e) => updateItem(i, "unidades", Number(e.target.value) || 0)}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(i, "precio_unitario", Number(e.target.value) || 0)}
                        className="h-8"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(i)}
                        disabled={items.length <= 1}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" onClick={addItem}>
            + Agregar item
          </Button>

          <div className="text-right text-sm">
            <span className="font-medium">Neto: </span>
            {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalNeto)}
            {" | "}
            <span className="font-medium">IVA 19%: </span>
            {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalIva)}
            {" | "}
            <span className="font-medium">Total: </span>
            {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(total)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerarPDF} disabled={generating}>
            {generating ? "Generando..." : "Generar y descargar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
