import { NextRequest, NextResponse } from "next/server";
import { ChileCompraService } from "@/lib/services/chilecompra";

/**
 * GET /api/testing/chilecompra/detalle?codigo=XXX&origen=lic|oc
 * Obtiene el detalle completo. origen=oc para órdenes de compra (Compra Ágil).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get("codigo");
    const origen = searchParams.get("origen") || "lic";

    if (!codigo) {
      return NextResponse.json(
        { success: false, error: "Falta el parámetro codigo" },
        { status: 400 }
      );
    }

    const service = new ChileCompraService();

    if (origen === "oc") {
      const detalle = await service.obtenerDetalleOrdenCompra(codigo);
      if (!detalle) {
        return NextResponse.json(
          { success: false, error: "Orden de compra no encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, licitacion: detalle });
    }

    const detalle = await service.obtenerDetalleLicitacion(codigo);
    if (!detalle) {
      return NextResponse.json(
        { success: false, error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, licitacion: detalle });
  } catch (error) {
    console.error("Error obteniendo detalle de licitación:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
