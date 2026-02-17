import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: licitacion, error: licError } = await supabase
      .from("licitaciones")
      .select("*")
      .eq("id", id)
      .single();

    if (licError || !licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    let items: unknown[] = [];
    const { data: itemsData, error: itemsError } = await supabase
      .from("licitacion_items")
      .select("*, productos(nombre, precio_venta, precio_capturado)")
      .eq("licitacion_id", id)
      .order("orden", { ascending: true });

    if (!itemsError) items = itemsData ?? [];

    return NextResponse.json({
      data: { ...licitacion, items },
    });
  } catch (error) {
    console.error("Error al obtener licitación:", error);
    return NextResponse.json(
      { error: "Error al obtener licitación" },
      { status: 500 }
    );
  }
}
