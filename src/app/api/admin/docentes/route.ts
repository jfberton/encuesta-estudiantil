import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { docentes } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const list = await db
      .select()
      .from(docentes)
      .orderBy(asc(docentes.nombre));

    return NextResponse.json({ docentes: list });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al obtener docentes:", errorMessage);
    return NextResponse.json({ error: "Error al cargar docentes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { nombre, rol } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const [nuevo] = await db
      .insert(docentes)
      .values({
        nombre: nombre.trim(),
        rol: rol || "ambos",
        activo: true,
      })
      .returning();

    return NextResponse.json({ ok: true, docente: nuevo });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error al agregar docente:", errorMessage);
    return NextResponse.json({ error: "Error al guardar docente" }, { status: 500 });
  }
}
