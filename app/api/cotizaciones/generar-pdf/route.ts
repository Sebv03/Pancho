import { NextRequest, NextResponse } from "next/server";
import { generarPDFCotizacion } from "@/lib/pdf/generar-cotizacion";
import { EMPRESA_DEFAULT } from "@/lib/config/empresa";
import type { ConfigEmpresa } from "@/lib/config/empresa";

/**
 * POST /api/cotizaciones/generar-pdf
 * Genera un PDF de cotización con los datos enviados
 * Body: { empresa?: ConfigEmpresa, items: ItemCotizacion[], licitacion?: { nombre } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresa: empresaOverride, items, licitacion_id } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Se requieren items para generar la cotización" },
        { status: 400 }
      );
    }

    const empresa: ConfigEmpresa = {
      ...EMPRESA_DEFAULT,
      ...empresaOverride,
    };

    const itemsFormateados = items.map((item: { descripcion: string; unidades: number; precio_unitario: number }) => ({
      descripcion: item.descripcion,
      unidades: Number(item.unidades),
      precioUnitario: Number(item.precio_unitario),
    }));

    const pdfBytes = await generarPDFCotizacion({
      empresa,
      items: itemsFormateados,
      fechaEmision: new Date(),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotizacion-${licitacion_id || Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return NextResponse.json(
      {
        error: "Error al generar PDF",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
