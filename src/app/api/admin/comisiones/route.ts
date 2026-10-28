import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, respuestas } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const list = await db
      .select({
        id: comisiones.id,
        nombre: comisiones.nombre,
        materia: comisiones.materia,
        cicloLectivo: comisiones.cicloLectivo,
        codigoAcceso: comisiones.codigoAcceso,
        activa: comisiones.activa,
        createdAt: comisiones.createdAt,
        totalRespuestas: sql<number>`count(${respuestas.id})::int`,
      })
      .from(comisiones)
      .leftJoin(respuestas, eq(comisiones.id, respuestas.comisionId))
      .groupBy(comisiones.id)
      .orderBy(desc(comisiones.createdAt));

    return NextResponse.json({ comisiones: list });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al obtener comisiones:", errorMessage);
    return NextResponse.json({ error: "Error al cargar comisiones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { nombre, materia, cicloLectivo, codigoAcceso } = await req.json();

    if (!nombre || !codigoAcceso) {
      return NextResponse.json({ error: "Nombre y código son obligatorios" }, { status: 400 });
    }

    const cleanCodigo = codigoAcceso.trim().toLowerCase().replace(/\s+/g, "-");

    const [nueva] = await db
      .insert(comisiones)
      .values({
        nombre: nombre.trim(),
        materia: materia?.trim() || "Cátedra",
        cicloLectivo: cicloLectivo?.trim() || "2026",
        codigoAcceso: cleanCodigo,
        activa: false,
      })
      .returning();

    return NextResponse.json({ ok: true, comision: nueva });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al crear comisión:", errorMessage);
    return NextResponse.json(
      { error: "Error al crear comisión. Verifique que el código no esté repetido." },
      { status: 500 }
    );
  }
}
