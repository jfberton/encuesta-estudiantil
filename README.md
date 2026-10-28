# Encuesta de Opinión Estudiantil – Cátedra Universitaria

Sistema web moderno, responsivo y anónimo para la evaluación estudiantil del desempeño docente y contenidos de la cátedra mediante códigos QR en clase.

## 🚀 Tecnologías
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Base de Datos:** Neon Serverless PostgreSQL
- **ORM:** Drizzle ORM
- **Autenticación Docente:** JWT seguro con cookies HTTP-Only (Jose)
- **Generación de QR:** Integrada para proyección en clase y descarga PNG
- **Exportación:** Descarga directa de respuestas consolidadas en formato Excel / CSV

---

## 💻 Ejecución Local

1. Instalar dependencias (ya instaladas):
   ```bash
   npm install
   ```
2. Las variables de entorno ya están configuradas en `.env.local`.
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador:
   - **Inicio / Comisiones activas:** [http://localhost:3000](http://localhost:3000)
   - **Panel de Administración:** [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Encuesta de prueba:** [http://localhost:3000/encuesta/comision-1](http://localhost:3000/encuesta/comision-1)

---

## 🔑 Credenciales Iniciales de Administración
- **Usuario:** `admin`
- **Contraseña:** `admin_catedra_2026`

*(Podés cambiarla o crear más administradores desde la base de datos o variables de entorno).*

---

## 🛡️ Mecanismo de Anonimato y Prevención de Reenvíos
1. **LocalStorage en el dispositivo:** Al presionar *Guardar y Enviar*, el formulario se bloquea y guarda una copia local. Si el estudiante vuelve a escanear el QR o refresca la página, accede directamente a sus respuestas en **Modo Sólo Lectura**.
2. **Fingerprint Anónimo:** El backend valida una huella digital técnica del dispositivo única por comisión, impidiendo que el mismo teléfono envíe dos respuestas incluso usando modo incógnito.
3. **Control en Vivo por Comisión:** El docente abre la encuesta durante la clase con un interruptor (`Habilitada / Cerrada`) y la cierra al finalizar el horario estipulado.

---

## ☁️ Despliegue en Cloudflare Pages

1. Subir este repositorio a **GitHub**.
2. En [Cloudflare Dashboard](https://dash.cloudflare.com/) ir a **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Seleccionar el repositorio.
4. Configuración de Build:
   - **Framework preset:** `Next.js`
   - **Build command:** `npx @cloudflare/next-on-pages` (o `npm run build`)
   - **Build output directory:** `.vercel/output/static` (o `.next`)
5. En **Environment variables**, agregar:
   - `DATABASE_URL`: tu cadena de conexión de Neon
   - `JWT_SECRET`: una clave secreta para los tokens de sesión del admin
   - `ADMIN_DEFAULT_PASSWORD`: contraseña del admin
6. ¡Listo! Cloudflare compilará y desplegará automáticamente con cada `git push`.
