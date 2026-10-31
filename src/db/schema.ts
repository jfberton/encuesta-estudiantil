import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const administradores = pgTable("administradores", {
  id: serial("id").primaryKey(),
  usuario: text("usuario").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nombre: text("nombre").notNull().default("Administrador Cátedra"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comisiones = pgTable("comisiones", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(), // ej: "Comisión 1 - Turno Mañana"
  materia: text("materia").notNull().default("Cátedra"),
  cicloLectivo: text("ciclo_lectivo").notNull().default("2026"),
  codigoAcceso: text("codigo_acceso").notNull().unique(), // ej: "comision-1"
  activa: boolean("activa").notNull().default(false), // Switch de habilitar/cerrar encuesta
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const docentes = pgTable("docentes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull().default("ambos"), // 'teoria', 'practica', 'ambos'
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const respuestas = pgTable(
  "respuestas",
  {
    id: serial("id").primaryKey(),
    comisionId: integer("comision_id")
      .notNull()
      .references(() => comisiones.id, { onDelete: "cascade" }),
    deviceFingerprint: text("device_fingerprint").notNull(),
    
    // Perfil y evaluaciones previas
    recursante: boolean("recursante").notNull(),
    conocimientosPrevios: boolean("conocimientos_previos").notNull(),
    practicoParcialesPrevios: boolean("practico_parciales_previos").notNull(),
    
    // 1. Planificación y contenidos (1 al 5)
    ajustePrograma: integer("ajuste_programa").notNull(),
    bibliografiaUtil: integer("bibliografia_util").notNull(),
    
    // 3. Evaluaciones generales (1 al 5)
    coherenciaExamenes: integer("coherencia_examenes").notNull(),
    articulacionTeoriaPractica: integer("articulacion_teoria_practica"), // Opcional / retrocompatible
    
    // 4. Preguntas Abiertas
    puntosPositivos: text("puntos_positivos"),
    aspectosAMejorar: text("aspectos_a_mejorar"),
    comentariosAdicionales: text("comentarios_adicionales"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_comision_device").on(table.comisionId, table.deviceFingerprint),
  ]
);

export const respuestasDocentes = pgTable("respuestas_docentes", {
  id: serial("id").primaryKey(),
  respuestaId: integer("respuesta_id")
    .notNull()
    .references(() => respuestas.id, { onDelete: "cascade" }),
  docenteId: integer("docente_id")
    .notNull()
    .references(() => docentes.id, { onDelete: "cascade" }),
  tipoDocente: text("tipo_docente").notNull(), // 'teoria' o 'practica'
  claridadPedagogica: integer("claridad_pedagogica").notNull(), // 1 al 5
  disposicionConsultas: integer("disposicion_consultas").notNull(), // 1 al 5
  puntualidadCumplimiento: integer("puntualidad_cumplimiento").notNull(), // 1 al 5
  articulacionTeoriaPractica: integer("articulacion_teoria_practica"), // 1 al 5 (específico para profesores de práctica)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relaciones para consultas Drizzle
export const comisionesRelations = relations(comisiones, ({ many }) => ({
  respuestas: many(respuestas),
}));

export const respuestasRelations = relations(respuestas, ({ one, many }) => ({
  comision: one(comisiones, {
    fields: [respuestas.comisionId],
    references: [comisiones.id],
  }),
  evaluacionesDocentes: many(respuestasDocentes),
}));

export const respuestasDocentesRelations = relations(respuestasDocentes, ({ one }) => ({
  respuesta: one(respuestas, {
    fields: [respuestasDocentes.respuestaId],
    references: [respuestas.id],
  }),
  docente: one(docentes, {
    fields: [respuestasDocentes.docenteId],
    references: [docentes.id],
  }),
}));

export const docentesRelations = relations(docentes, ({ many }) => ({
  evaluaciones: many(respuestasDocentes),
}));
