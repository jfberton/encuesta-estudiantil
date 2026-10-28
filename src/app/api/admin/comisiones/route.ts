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
    const { nombre, materia, cicloLectivo, codigoAcceso, activa } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: "El nombre de la comisión es obligatorio" }, { status: 400 });
    }

    const baseCodigo = codigoAcceso || nombre;
    const cleanCodigo = baseCodigo
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const [nueva] = await db
      .insert(comisiones)
      .values({
        nombre: nombre.trim(),
        materia: materia?.trim() || "Matemática Financiera",
        cicloLectivo: cicloLectivo?.trim() || "2026",
        codigoAcceso: cleanCodigo || `comision-${Date.now().toString(36)}`,
        activa: activa !== undefined ? Boolean(activa) : true,
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
