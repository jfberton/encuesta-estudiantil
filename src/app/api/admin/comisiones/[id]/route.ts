import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, respuestas, respuestasDocentes } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

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
    const comisionId = parseInt(id, 10);

    if (isNaN(comisionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 1. Verificar existencia
    const [comision] = await db
      .select()
      .from(comisiones)
      .where(eq(comisiones.id, comisionId))
      .limit(1);

    if (!comision) {
      return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
    }

    // 2. Limpiar respuestas vinculadas de forma segura antes de eliminar la comisión
    const respuestasDeComision = await db
      .select({ id: respuestas.id })
      .from(respuestas)
      .where(eq(respuestas.comisionId, comisionId));

    if (respuestasDeComision.length > 0) {
      const respIds = respuestasDeComision.map((r) => r.id);
      await db
        .delete(respuestasDocentes)
        .where(inArray(respuestasDocentes.respuestaId, respIds));
      await db
        .delete(respuestas)
        .where(eq(respuestas.comisionId, comisionId));
    }

    // 3. Eliminar la comisión
    await db.delete(comisiones).where(eq(comisiones.id, comisionId));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al eliminar comisión:", errorMessage);
    return NextResponse.json({ error: "Error al eliminar comisión" }, { status: 500 });
  }
}
