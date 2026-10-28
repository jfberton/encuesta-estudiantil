import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { administradores } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { usuario, password } = await req.json();

    if (!usuario || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const [admin] = await db
      .select()
      .from(administradores)
      .where(eq(administradores.usuario, usuario.trim().toLowerCase()))
      .limit(1);

    if (!admin) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await createSession({
      id: admin.id,
      usuario: admin.usuario,
      nombre: admin.nombre,
    });

    const response = NextResponse.json({ ok: true, nombre: admin.nombre });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error en login:", errorMessage);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
