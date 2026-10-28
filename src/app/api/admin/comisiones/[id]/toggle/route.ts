import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const comisionId = parseInt(id, 10);

    const [actual] = await db
      .select()
      .from(comisiones)
      .where(eq(comisiones.id, comisionId))
      .limit(1);

    if (!actual) {
      return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
    }

    const [actualizada] = await db
      .update(comisiones)
      .set({ activa: !actual.activa })
      .where(eq(comisiones.id, comisionId))
      .returning();

    return NextResponse.json({ ok: true, comision: actualizada });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al alternar estado de comisión:", errorMessage);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
