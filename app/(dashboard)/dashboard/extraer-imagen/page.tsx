"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUp, Loader2, Plus } from "lucide-react";

function parsePrice(text: string): number | null {
  const patterns = [
    /\$\s*([\d.,\s]+)/,
    /([\d]{1,3}(?:\.\d{3})*(?:,\d+)?)\s*CLP/i,
    /precio[:\s]*\$?\s*([\d.,\s]+)/i,
    /([\d]{1,3}(?:\.\d{3})+(?:,\d+)?)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = (m[1] || m[0]).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0 && num < 100000000) return num;
    }
  }
  return null;
}

function parseName(text: string): string | null {
  const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 3);
  for (const line of lines) {
    if (line.length > 5 && line.length < 120 && !/^\d+$/.test(line) && !/^\$[\d.,\s]+$/.test(line)) {
      return line.slice(0, 200);
    }
  }
  return lines[0] || null;
}

export default function ExtraerImagenPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Sube una imagen (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setTexto("");
    setNombre("");
    setPrecio("");
  };

  const handleExtract = async () => {
    if (!file) {
      toast({ title: "Selecciona una imagen", variant: "destructive" });
      return;
    }
    setLoading(true);
    setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const extracted = result.data.text;
      setTexto(extracted);
      const p = parsePrice(extracted);
      const n = parseName(extracted);
      setPrecio(p != null ? String(p) : "");
      setNombre(n || "");
      if (!p && !n) {
        toast({ title: "No se detectó nombre ni precio", description: "Revisa el texto extraído y completa manualmente." });
      } else {
        toast({ title: "OCR completado", description: "Revisa y corrige los datos si es necesario." });
      }
    } catch (err) {
      toast({
        title: "Error al procesar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleAddProduct = async () => {
    const n = nombre.trim();
    const p = Number(precio) || 0;
    if (!n) {
      toast({ title: "Ingresa el nombre del producto", variant: "destructive" });
      return;
    }
    if (p <= 0) {
      toast({ title: "Ingresa un precio válido", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          descripcion: null,
          precio_capturado: p,
          precio_venta: p,
          url_origen: `ocr-imagen-${Date.now()}`,
          sitio_origen: "OCR",
          imagen_url: null,
          sku: null,
          marca: null,
          categoria: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Producto agregado", description: "Se guardó en el catálogo." });
      } else {
        throw new Error(data.error || "Error al guardar");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al guardar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Extraer de imagen</h1>
        <p className="text-muted-foreground">
          Sube una foto de un producto y extrae nombre y precio con OCR (Tesseract.js). Gratuito, sin APIs externas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Imagen</CardTitle>
            <CardDescription>Sube una foto clara del producto (etiqueta, pantalla, ticket)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
              <ImageUp className="mr-2 h-4 w-4" />
              Seleccionar imagen
            </Button>
            {preview && (
              <div className="relative rounded-lg border overflow-hidden bg-muted/30">
                <img src={preview} alt="Vista previa" className="w-full max-h-64 object-contain" />
              </div>
            )}
            {file && (
              <Button onClick={handleExtract} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress > 0 ? `Procesando ${progress}%` : "Procesando..."}
                  </>
                ) : (
                  "Extraer texto (OCR)"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Texto extraído y datos detectados. Corrige si es necesario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {texto && (
              <div className="space-y-2">
                <Label>Texto detectado</Label>
                <pre className="p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                  {texto || "(vacío)"}
                </pre>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Chocolate Golazo 25gr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio ($)</Label>
              <Input
                id="precio"
                type="text"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="ej: 1891"
              />
            </div>
            {(nombre || precio) && (
              <Button onClick={handleAddProduct} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar al catálogo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
