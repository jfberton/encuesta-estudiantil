import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docentes } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docenteId = parseInt(id, 10);
    const body = await req.json();

    const [actualizado] = await db
      .update(docentes)
      .set({
        ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
        ...(body.rol !== undefined && { rol: body.rol }),
        ...(body.activo !== undefined && { activo: Boolean(body.activo) }),
      })
      .where(eq(docentes.id, docenteId))
      .returning();

    return NextResponse.json({ ok: true, docente: actualizado });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al actualizar docente:", errorMessage);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docenteId = parseInt(id, 10);

    await db.delete(docentes).where(eq(docentes.id, docenteId));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al eliminar docente:", errorMessage);
    return NextResponse.json({ error: "Error al eliminar docente" }, { status: 500 });
  }
}
