import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_2m7rYGitHQLc@ep-aged-mountain-b5h3db2g-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const docentesOficiales = [
  // Teoría
  { nombre: "Berta Rott", rol: "teoria" as const, activo: true },
  { nombre: "Ana María Nuñez", rol: "teoria" as const, activo: true },
  { nombre: "María del Carmen Bermúdez", rol: "teoria" as const, activo: true },

  // Práctica
  { nombre: "Daniel Quain", rol: "practica" as const, activo: true },
  { nombre: "Ariel Vargas", rol: "practica" as const, activo: true },
  { nombre: "María Nidia Berger", rol: "practica" as const, activo: true },
  { nombre: "Nicolás Custidiano", rol: "practica" as const, activo: true },
  { nombre: "Rodriguez", rol: "practica" as const, activo: true },
  { nombre: "Rodrigo Belbey", rol: "practica" as const, activo: true },
  { nombre: "Silvina Trullet", rol: "practica" as const, activo: true },
  { nombre: "Guillermo Andreatta", rol: "practica" as const, activo: true },
  { nombre: "Lucas Ochipinti", rol: "practica" as const, activo: true },
  { nombre: "Martín Pérez Zamparo", rol: "practica" as const, activo: true },
];

async function main() {
  console.log("Cargando docentes oficiales de Matemática Financiera...");

  // Borrar docentes de prueba anteriores
  await db.delete(schema.docentes);
  console.log("Docentes de prueba anteriores eliminados.");

  // Insertar los docentes oficiales
  await db.insert(schema.docentes).values(docentesOficiales);
  console.log(`✅ ${docentesOficiales.length} docentes oficiales insertados con éxito.`);

  const listado = await db.select().from(schema.docentes);
  console.log("Listado actual en Neon:");
  listado.forEach((d) => console.log(` - [${d.rol.toUpperCase()}] ${d.nombre}`));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
