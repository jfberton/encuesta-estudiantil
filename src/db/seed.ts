import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Iniciando seed en Neon...");

  // 1. Admin
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin_catedra_2026";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await db.select().from(schema.administradores);
  if (existingAdmin.length === 0) {
    await db.insert(schema.administradores).values({
      usuario: "admin",
      passwordHash: hashedPassword,
      nombre: "Profesor Titular / Administrador",
    });
    console.log(`✅ Administrador creado: usuario "admin" - clave "${adminPassword}"`);
  } else {
    console.log("ℹ️ Administrador ya existe.");
  }

  // 2. Comisiones iniciales
  const existingComisiones = await db.select().from(schema.comisiones);
  if (existingComisiones.length === 0) {
    await db.insert(schema.comisiones).values([
      {
        nombre: "Comisión 1 - Turno Mañana",
        materia: "Cátedra",
        cicloLectivo: "2026",
        codigoAcceso: "comision-1",
        activa: true,
      },
      {
        nombre: "Comisión 2 - Turno Noche",
        materia: "Cátedra",
        cicloLectivo: "2026",
        codigoAcceso: "comision-2",
        activa: false,
      },
    ]);
    console.log("✅ Comisiones de ejemplo creadas (Comisión 1 activa para pruebas).");
  } else {
    console.log("ℹ️ Comisiones ya existen.");
  }

  // 3. Docentes iniciales
  const existingDocentes = await db.select().from(schema.docentes);
  if (existingDocentes.length === 0) {
    await db.insert(schema.docentes).values([
      { nombre: "Prof. Alberto Gómez (Teoría)", rol: "teoria", activo: true },
      { nombre: "Prof. María Fernández (Teoría)", rol: "teoria", activo: true },
      { nombre: "Ing. Carlos López (Práctica)", rol: "practica", activo: true },
      { nombre: "Lic. Laura Rossi (Práctica)", rol: "practica", activo: true },
      { nombre: "Dr. Roberto Díaz (Teoría y Práctica)", rol: "ambos", activo: true },
    ]);
    console.log("✅ Docentes de prueba creados.");
  } else {
    console.log("ℹ️ Docentes ya existen.");
  }

  console.log("✨ Seed completado con éxito.");
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
