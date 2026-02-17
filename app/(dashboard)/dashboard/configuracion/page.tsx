"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

const STORAGE_KEY = "licitia_empresa_config";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    razonSocial: "ALBATERRA SPA",
    rut: "78.167.034-0",
    contacto: "FRANCISCO IGNACIO SOLAR MORENO",
    email: "FSOLAR94@GMAIL.COM",
    telefono: "56986037230",
    direccion: "SAN RIGOBERTO #271, MAIPU",
    diasEntrega: 2,
    validezDias: 20,
  });
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig({ ...config, ...JSON.parse(stored) });
      }
    } catch {
      // usar defaults
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast({ title: "Configuración guardada", description: "Los cambios se aplicarán en los próximos PDFs." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setConfig({
      razonSocial: "ALBATERRA SPA",
      rut: "78.167.034-0",
      contacto: "FRANCISCO IGNACIO SOLAR MORENO",
      email: "FSOLAR94@GMAIL.COM",
      telefono: "56986037230",
      direccion: "SAN RIGOBERTO #271, MAIPU",
      diasEntrega: 2,
      validezDias: 20,
    });
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Restaurado", description: "Valores por defecto restaurados." });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Datos de la empresa para cotizaciones PDF. Se usan por defecto en todos los PDFs generados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Datos de la empresa
          </CardTitle>
          <CardDescription>
            Edita estos valores para que aparezcan en el encabezado de todas las cotizaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Razón Social</Label>
              <Input
                value={config.razonSocial}
                onChange={(e) => setConfig((c) => ({ ...c, razonSocial: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input
                value={config.rut}
                onChange={(e) => setConfig((c) => ({ ...c, rut: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input
                value={config.contacto}
                onChange={(e) => setConfig((c) => ({ ...c, contacto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={config.email}
                onChange={(e) => setConfig((c) => ({ ...c, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={config.telefono}
                onChange={(e) => setConfig((c) => ({ ...c, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={config.direccion}
                onChange={(e) => setConfig((c) => ({ ...c, direccion: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Días hábiles de entrega</Label>
              <Input
                type="number"
                min={1}
                value={config.diasEntrega}
                onChange={(e) => setConfig((c) => ({ ...c, diasEntrega: Number(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Validez de cotización (días)</Label>
              <Input
                type="number"
                min={1}
                value={config.validezDias}
                onChange={(e) => setConfig((c) => ({ ...c, validezDias: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Guardar</Button>
            <Button variant="outline" onClick={handleReset}>
              Restaurar valores por defecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
