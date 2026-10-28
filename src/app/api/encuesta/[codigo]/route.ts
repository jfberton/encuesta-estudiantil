import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comisiones, docentes } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    const [comision] = await db
      .select({
        id: comisiones.id,
        nombre: comisiones.nombre,
        materia: comisiones.materia,
        cicloLectivo: comisiones.cicloLectivo,
        codigoAcceso: comisiones.codigoAcceso,
        activa: comisiones.activa,
      })
      .from(comisiones)
      .where(eq(comisiones.codigoAcceso, codigo))
      .limit(1);

    if (!comision) {
      return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
    }

    // Traer docentes activos
    const todosDocentes = await db
      .select({
        id: docentes.id,
        nombre: docentes.nombre,
        rol: docentes.rol,
      })
      .from(docentes)
      .where(eq(docentes.activo, true));

    const docentesTeoria = todosDocentes.filter(
      (d) => d.rol === "teoria" || d.rol === "ambos"
    );
    const docentesPractica = todosDocentes.filter(
      (d) => d.rol === "practica" || d.rol === "ambos"
    );

    return NextResponse.json({
      comision,
      docentes: {
        teoria: docentesTeoria,
        practica: docentesPractica,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al obtener encuesta:", errorMessage);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
