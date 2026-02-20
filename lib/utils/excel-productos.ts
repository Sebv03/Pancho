"use client";
/**
 * Utilidades para exportar e importar productos en Excel
 * Formato: Imagen | Nombre | Sitio | Precio capturado | Precio Venta
 * Usa import dinámico de xlsx para evitar problemas con SSR en Next.js
 */

export const EXCEL_HEADERS = ["Imagen", "Nombre", "Sitio", "Precio capturado", "Precio Venta"] as const;

export interface ProductoExcelRow {
  Imagen: string;
  Nombre: string;
  Sitio: string;
  "Precio capturado": number;
  "Precio Venta": number | string;
}

export interface ProductoParaExportar {
  imagen_url: string | null;
  nombre: string;
  sitio_origen: string | null;
  precio_capturado: number;
  precio_venta: number | null;
}

export async function exportarProductosExcel(productos: ProductoParaExportar[], filename = "productos.xlsx") {
  const XLSX = await import("xlsx");
  const rows: ProductoExcelRow[] = productos.map((p) => ({
    Imagen: p.imagen_url || "",
    Nombre: p.nombre,
    Sitio: p.sitio_origen || "",
    "Precio capturado": p.precio_capturado,
    "Precio Venta": p.precio_venta ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, filename);
}

function parsePrecio(val: unknown): number | null {
  if (val == null || val === "") return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const str = String(val).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export async function parsearExcelProductos(file: File): Promise<ProductoExcelRow[]> {
  const XLSX = await import("xlsx");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("No se pudo leer el archivo"));
          return;
        }
        const wb = XLSX.read(data, { type: "binary" });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ProductoExcelRow>(firstSheet, { defval: "" });

        const validos = rows.filter((r) => {
          const nombre = String((r as Record<string, unknown>)?.Nombre ?? "").trim();
          const precioCap = parsePrecio((r as Record<string, unknown>)?.["Precio capturado"]);
          const precioVta = parsePrecio((r as Record<string, unknown>)?.["Precio Venta"]);
          const precio = precioCap ?? precioVta ?? 0;
          return nombre.length > 0 && precio >= 0;
        });

        resolve(validos);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Error al parsear Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsBinaryString(file);
  });
}

export function excelRowToProductoPayload(row: ProductoExcelRow | Record<string, unknown>) {
  const r = row as Record<string, unknown>;
  const nombre = String(r?.Nombre ?? "").trim();
  const precioCapturado = parsePrecio(r?.["Precio capturado"]) ?? parsePrecio(r?.["Precio Venta"]) ?? 0;
  const precioVenta = parsePrecio(r?.["Precio Venta"]);
  const imagen = String(r?.Imagen ?? "").trim() || null;
  const sitio = String(r?.Sitio ?? "").trim() || null;

  return {
    nombre,
    descripcion: null,
    precio_capturado: precioCapturado,
    precio_venta: precioVenta,
    url_origen: `import-excel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    sitio_origen: sitio,
    imagen_url: imagen,
    sku: null,
    marca: null,
    categoria: null,
  };
}
