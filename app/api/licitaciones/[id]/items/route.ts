import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("licitacion_items")
      .select("*, productos(nombre, precio_venta, precio_capturado)")
      .eq("licitacion_id", id)
      .order("orden", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Error al obtener items:", error);
    return NextResponse.json(
      { error: "Error al obtener items" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { descripcion, cantidad = 1, precio_unitario, producto_id, orden = 0 } = body;

    if (!descripcion) {
      return NextResponse.json(
        { error: "descripcion es requerida" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("licitacion_items")
      .insert({
        licitacion_id: id,
        descripcion,
        cantidad: Number(cantidad) || 1,
        precio_unitario: precio_unitario != null ? Number(precio_unitario) : null,
        producto_id: producto_id || null,
        orden: Number(orden) || 0,
      })
      .select()
      .single();

    if (error) {
      const msg = (error as { message?: string }).message ?? String(error);
      throw new Error(msg);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error al crear item:", error);
    const msg = error instanceof Error ? error.message : "Error al crear item";
    return NextResponse.json(
      { error: msg, details: "Verifica que la migración 005 (licitacion_items) esté aplicada en Supabase." },
      { status: 500 }
    );
  }
}
