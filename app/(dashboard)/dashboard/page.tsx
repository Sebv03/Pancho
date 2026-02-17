"use client";

import { useEffect, useState } from "react";
import { LicitacionesTable } from "@/components/features/licitaciones-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Licitacion } from "@/types";
import { RefreshCw, Download, Sparkles, Package } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const { toast } = useToast();

  const fetchLicitaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/licitaciones?limit=100");
      const data = await response.json();
      if (response.ok) {
        setLicitaciones(data.data || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar licitaciones",
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

  const handleIngest = async () => {
    try {
      setIngesting(true);
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: 1,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Se procesaron ${data.resumen.totalEncontradas} licitaciones. ${data.resumen.nuevas} nuevas, ${data.resumen.actualizadas} actualizadas.`,
        });
        fetchLicitaciones();
      } else {
        toast({
          title: "Error",
          description: data.details || data.error || "Error al ingerir licitaciones",
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
      setIngesting(false);
    }
  };

  const handleSeedTestData = async () => {
    try {
      setIngesting(true);
      const response = await fetch("/api/seed-test-data", {
        method: "POST",
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Éxito",
          description: `${data.resumen.nuevas} licitaciones de prueba agregadas.`,
        });
        fetchLicitaciones();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al agregar datos de prueba",
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
      setIngesting(false);
    }
  };

  const handleAnalyze = async (licitacionId: string) => {
    toast({
      title: "Análisis con IA",
      description: "Funcionalidad en desarrollo. Necesitas primero agregar documentos a la licitación.",
    });
  };

  const handleSeguir = (id: string) => {
    toast({ title: "Seguir", description: "Oportunidad agregada a seguimiento." });
  };

  const handleNoInteres = (id: string) => {
    toast({ title: "Sin interés", description: "Oportunidad descartada." });
  };

  useEffect(() => {
    fetchLicitaciones();
  }, []);

  const licitacionesConIA = licitaciones.filter((l) => l.resumen_ia).length;
  const licitacionesActivas = licitaciones.filter((l) => l.estado === "activa").length;

  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="space-y-8">
      {/* Header con búsqueda global */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Busca oportunidades por código o nombre"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeedTestData}
            disabled={ingesting}
            title="Agregar licitaciones de prueba (sin usar API externa)"
          >
            {ingesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Datos de Prueba
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleIngest}
            disabled={ingesting}
            title="Ingerir desde API ChileCompra (requiere esperar por rate limit)"
          >
            {ingesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Ingiriendo...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Desde ChileCompra
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchLicitaciones} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licitaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licitaciones.length}</div>
            <p className="text-xs text-muted-foreground">
              En base de datos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licitaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licitacionesActivas}</div>
            <p className="text-xs text-muted-foreground">
              Disponibles para postular
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analizadas con IA</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licitacionesConIA}</div>
            <p className="text-xs text-muted-foreground">
              Con resumen generado
            </p>
          </CardContent>
        </Card>
        <Link href="/dashboard/productos">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ver Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Catálogo</div>
            <p className="text-xs text-muted-foreground">
              Productos capturados
            </p>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* Tabla de Licitaciones */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <LicitacionesTable
          licitaciones={licitaciones}
          searchTerm={globalSearch}
          onSearchChange={setGlobalSearch}
          onAnalyze={handleAnalyze}
          onSeguir={handleSeguir}
          onNoInteres={handleNoInteres}
        />
      )}
    </div>
  );
}
