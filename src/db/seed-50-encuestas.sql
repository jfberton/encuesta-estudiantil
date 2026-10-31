-- =====================================================================
-- SCRIPT SQL PARA NEON: INSERCIÓN DE 50 ENCUESTAS DE PRUEBA
-- =====================================================================
-- Instrucciones para ejecutar en Neon:
-- 1. Entra a tu consola de Neon (console.neon.tech).
-- 2. Ve a la sección "SQL Editor".
-- 3. Pega este script completo y haz clic en "Run".
-- =====================================================================

-- Opcional: aseguramos que la columna exista en respuestas_docentes y sea nullable en respuestas
ALTER TABLE respuestas_docentes ADD COLUMN IF NOT EXISTS articulacion_teoria_practica integer;
ALTER TABLE respuestas ALTER COLUMN articulacion_teoria_practica DROP NOT NULL;

DO $$
DECLARE
    -- Comisión destino: por defecto usa la comisión 3 (o la primera si la 3 no existiera)
    v_target_comision_id INTEGER := 3;
    v_comision_id INTEGER;
    
    -- Variables para bucle
    i INTEGER;
    v_respuesta_id INTEGER;
    v_created_at TIMESTAMP;
    v_fingerprint TEXT;
    
    -- Listas de docentes extraídas de la base de datos
    v_teoria_ids INTEGER[];
    v_practica_ids INTEGER[];
    v_len_teoria INTEGER;
    v_len_practica INTEGER;
    
    -- Docentes elegidos para cada encuesta
    v_doc_teoria_1 INTEGER;
    v_doc_teoria_2 INTEGER;
    v_doc_practica_1 INTEGER;
    v_doc_practica_2 INTEGER;
    
    -- Arrays de comentarios realistas
    v_positivos TEXT[] := ARRAY[
        'Excelente la explicación de los temas teóricos y la resolución paso a paso en clase.',
        'Muy buena predisposición de los docentes para responder dudas tanto presenciales como por aula virtual.',
        'Las guías prácticas son muy completas y totalmente acordes al nivel de los exámenes parciales.',
        'Las clases son muy dinámicas y los profesores transmiten mucha confianza.',
        'El material de cátedra y los apuntes subidos al aula virtual son claros y bien estructurados.',
        'Muy buena articulación y sincronía entre las clases teóricas y las comisiones de práctica.',
        'Excelente la paciencia y dedicación en los horarios de consulta previos a los parciales.',
        'Los ejemplos de aplicación práctica y financiera ayudan mucho a comprender conceptos difíciles.',
        'Destaco la puntualidad de los profesores y el estricto cumplimiento del cronograma de la cátedra.',
        'Clases amenas y explicaciones claras que hacen accesible una materia con mucha matemática.',
        NULL,
        NULL
    ];
    
    v_mejorar TEXT[] := ARRAY[
        'Subir las diapositivas y guías de ejercicios con mayor anticipación a las clases.',
        'Dedicar más tiempo de clase a los ejercicios de mayor complejidad antes de las fechas de examen.',
        'Agregar más horarios de clases de consulta durante la semana previa al parcial.',
        'El ritmo de las primeras unidades fue un poco acelerado para quienes veníamos sin base matemática fuerte.',
        'Incluir más modelos de parciales de cuatrimestres anteriores con sus resoluciones comentadas.',
        'Mejorar la acústica y el proyector del aula para que se pueda seguir bien desde las últimas filas.',
        'Coordinar mejor los criterios de corrección en las devoluciones de los trabajos prácticos.',
        'Ninguno en particular, la cursada estuvo muy bien organizada y con buen ritmo.',
        'Todo muy bien organizado, no tengo objeciones.',
        NULL,
        NULL
    ];
    
    v_adicionales TEXT[] := ARRAY[
        'Muy conforme con la cursada este cuatrimestre, agradezco a todos los profesores.',
        'Excelente cátedra, se nota el compromiso de todo el equipo docente con el aprendizaje de los alumnos.',
        'Sería muy útil implementar algún taller complementario de Excel financiero para aplicar las fórmulas.',
        'Agradezco especialmente la ayuda recibida en las clases de consulta antes del segundo examen.',
        'Felicitaciones por la organización de la materia y por brindar este espacio anónimo para opinar.',
        'Sigan así, excelente nivel académico.',
        NULL,
        NULL,
        NULL
    ];
    
    -- Arrays de pesos para notas (distribución realista: predominan 4 y 5, con presencia de 3, 2 y 1)
    v_notas_altas INTEGER[] := ARRAY[4, 4, 5, 5, 5, 4, 5, 3, 4, 5];
    v_notas_medias INTEGER[] := ARRAY[3, 3, 4, 4, 4, 5, 3, 2, 4, 5];
    v_notas_variadas INTEGER[] := ARRAY[2, 3, 3, 4, 4, 4, 5, 5, 1, 4];

BEGIN
    -- 1. Determinar ID de Comisión
    SELECT id INTO v_comision_id FROM comisiones WHERE id = v_target_comision_id;
    IF v_comision_id IS NULL THEN
        SELECT id INTO v_comision_id FROM comisiones ORDER BY id LIMIT 1;
        IF v_comision_id IS NULL THEN
            RAISE EXCEPTION 'No se encontró ninguna comisión en la base de datos. Cree una comisión primero.';
        END IF;
        RAISE NOTICE 'Comisión % no encontrada. Se usará la comisión ID: %', v_target_comision_id, v_comision_id;
    ELSE
        RAISE NOTICE 'Insertando encuestas para la comisión ID: %', v_comision_id;
    END IF;

    -- 2. Obtener IDs de docentes activos (separados por rol)
    SELECT ARRAY_AGG(id) INTO v_teoria_ids 
    FROM docentes 
    WHERE rol IN ('teoria', 'ambos') AND activo = true;

    SELECT ARRAY_AGG(id) INTO v_practica_ids 
    FROM docentes 
    WHERE rol IN ('practica', 'ambos') AND activo = true;

    -- Fallback si no estuvieran cargados
    IF v_teoria_ids IS NULL OR array_length(v_teoria_ids, 1) = 0 THEN
        v_teoria_ids := ARRAY[6, 7, 8];
    END IF;
    IF v_practica_ids IS NULL OR array_length(v_practica_ids, 1) = 0 THEN
        v_practica_ids := ARRAY[9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    END IF;

    v_len_teoria := array_length(v_teoria_ids, 1);
    v_len_practica := array_length(v_practica_ids, 1);

    -- 3. Bucle para generar las 50 encuestas
    FOR i IN 1..50 LOOP
        -- Fingerprint único de 64 caracteres hex (simula el sha256 del cliente)
        v_fingerprint := md5(random()::text || clock_timestamp()::text || i::text) || 
                         md5(clock_timestamp()::text || random()::text || (i + 100)::text);

        -- Fecha realista distribuida en los últimos 3 días
        v_created_at := NOW() - (interval '1 hour' * floor(random() * 70)) 
                              - (interval '1 minute' * floor(random() * 59));

        -- Insertar en tabla "respuestas"
        INSERT INTO respuestas (
            comision_id,
            device_fingerprint,
            recursante,
            conocimientos_previos,
            practico_parciales_previos,
            ajuste_programa,
            bibliografia_util,
            coherencia_examenes,
            articulacion_teoria_practica,
            puntos_positivos,
            aspectos_a_mejorar,
            comentarios_adicionales,
            created_at
        ) VALUES (
            v_comision_id,
            v_fingerprint,
            (random() < 0.22), -- ~22% recursantes
            (random() < 0.78), -- ~78% con conocimientos previos
            (random() < 0.68), -- ~68% practicó parciales previos
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_medias[1 + floor(random() * array_length(v_notas_medias, 1))],
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            NULL, -- Ahora se almacena en respuestas_docentes para docentes de práctica
            v_positivos[1 + floor(random() * array_length(v_positivos, 1))],
            v_mejorar[1 + floor(random() * array_length(v_mejorar, 1))],
            v_adicionales[1 + floor(random() * array_length(v_adicionales, 1))],
            v_created_at
        ) RETURNING id INTO v_respuesta_id;

        -- 4. Insertar evaluaciones docentes para esta respuesta
        -- Elegir al menos 1 docente de teoría
        v_doc_teoria_1 := v_teoria_ids[1 + floor(random() * v_len_teoria)];
        
        INSERT INTO respuestas_docentes (
            respuesta_id,
            docente_id,
            tipo_docente,
            claridad_pedagogica,
            disposicion_consultas,
            puntualidad_cumplimiento,
            articulacion_teoria_practica,
            created_at
        ) VALUES (
            v_respuesta_id,
            v_doc_teoria_1,
            'teoria',
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            NULL,
            v_created_at
        );

        -- 25% de probabilidad de evaluar a un segundo docente de teoría si hay más de uno
        IF v_len_teoria > 1 AND random() < 0.25 THEN
            v_doc_teoria_2 := v_teoria_ids[1 + floor(random() * v_len_teoria)];
            IF v_doc_teoria_2 <> v_doc_teoria_1 THEN
                INSERT INTO respuestas_docentes (
                    respuesta_id,
                    docente_id,
                    tipo_docente,
                    claridad_pedagogica,
                    disposicion_consultas,
                    puntualidad_cumplimiento,
                    articulacion_teoria_practica,
                    created_at
                ) VALUES (
                    v_respuesta_id,
                    v_doc_teoria_2,
                    'teoria',
                    v_notas_medias[1 + floor(random() * array_length(v_notas_medias, 1))],
                    v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
                    v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
                    NULL,
                    v_created_at
                );
            END IF;
        END IF;

        -- Elegir 1 docente de práctica (incluye articulacion_teoria_practica)
        v_doc_practica_1 := v_practica_ids[1 + floor(random() * v_len_practica)];
        
        INSERT INTO respuestas_docentes (
            respuesta_id,
            docente_id,
            tipo_docente,
            claridad_pedagogica,
            disposicion_consultas,
            puntualidad_cumplimiento,
            articulacion_teoria_practica,
            created_at
        ) VALUES (
            v_respuesta_id,
            v_doc_practica_1,
            'practica',
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
            v_notas_variadas[1 + floor(random() * array_length(v_notas_variadas, 1))],
            v_created_at
        );

        -- 45% de probabilidad de evaluar a un segundo docente de práctica (común en comisiones con JTP y Ayudante)
        IF v_len_practica > 1 AND random() < 0.45 THEN
            v_doc_practica_2 := v_practica_ids[1 + floor(random() * v_len_practica)];
            IF v_doc_practica_2 <> v_doc_practica_1 THEN
                INSERT INTO respuestas_docentes (
                    respuesta_id,
                    docente_id,
                    tipo_docente,
                    claridad_pedagogica,
                    disposicion_consultas,
                    puntualidad_cumplimiento,
                    articulacion_teoria_practica,
                    created_at
                ) VALUES (
                    v_respuesta_id,
                    v_doc_practica_2,
                    'practica',
                    v_notas_medias[1 + floor(random() * array_length(v_notas_medias, 1))],
                    v_notas_medias[1 + floor(random() * array_length(v_notas_medias, 1))],
                    v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
                    v_notas_altas[1 + floor(random() * array_length(v_notas_altas, 1))],
                    v_created_at
                );
            END IF;
        END IF;

    END LOOP;

    RAISE NOTICE '¡50 encuestas de prueba insertadas con éxito!';
END $$;

-- Verificación final: Muestra el resumen consolidado en Neon
SELECT 
    c.id AS comision_id,
    c.nombre AS comision_nombre,
    COUNT(DISTINCT r.id) AS total_respuestas,
    COUNT(rd.id) AS total_evaluaciones_docentes,
    ROUND(AVG(r.ajuste_programa)::numeric, 2) AS prom_ajuste_programa,
    ROUND(AVG(r.bibliografia_util)::numeric, 2) AS prom_bibliografia,
    ROUND(AVG(r.coherencia_examenes)::numeric, 2) AS prom_coherencia_examenes,
    ROUND(AVG(rd.articulacion_teoria_practica)::numeric, 2) AS prom_articulacion_practica
FROM comisiones c
LEFT JOIN respuestas r ON r.comision_id = c.id
LEFT JOIN respuestas_docentes rd ON rd.respuesta_id = r.id
GROUP BY c.id, c.nombre
ORDER BY c.id;
