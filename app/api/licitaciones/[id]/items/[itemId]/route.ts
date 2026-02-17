import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (body.descripcion !== undefined) updates.descripcion = body.descripcion;
    if (body.cantidad !== undefined) updates.cantidad = Number(body.cantidad);
    if (body.precio_unitario !== undefined) updates.precio_unitario = body.precio_unitario == null ? null : Number(body.precio_unitario);
    if (body.producto_id !== undefined) updates.producto_id = body.producto_id || null;
    if (body.orden !== undefined) updates.orden = Number(body.orden);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("licitacion_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error al actualizar item:", error);
    return NextResponse.json(
      { error: "Error al actualizar item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("licitacion_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar item:", error);
    return NextResponse.json(
      { error: "Error al eliminar item" },
      { status: 500 }
    );
  }
}
