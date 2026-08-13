# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [No publicado]

### Fase 5 — Reportes y compartir

- Reporte público en `/report/[token]` accesible sin iniciar sesión.
- Token de 256 bits guardado como hash SHA-256: un volcado de la tabla no revela enlaces.
- Finalización atómica en función SQL: el conteo y su reporte se crean en una transacción.
- Numeración legible `INV-AAAAMMDD-NNN` con la fecha civil de Bogotá.
- Compartir por Web Share, copiar enlace, WhatsApp y correo con mensaje preparado.
- PDF por impresión nativa con el nombre `inventario-panaderia_AAAA-MM-DD_HH-mm.pdf`.
- Revocación de reportes desde el historial, solo para administradores.
- Historial de conteos finalizados con alcance según rol.

### Fase 4 — Conteo móvil

- Pantalla de conteo optimizada para uso a una mano: filas compactas, botones de 44 px.
- Autoguardado con retardo de 700 ms y respaldo en `localStorage` hasta confirmar.
- Indicador de estado: guardando, guardado y sin conexión.
- Búsqueda sin acentos: "alinado" encuentra "Pan aliñado".
- Confirmación antes de finalizar, con resumen y aviso de productos en cero.
- Un solo borrador abierto por empleado, garantizado por índice único.
- Inmutabilidad de conteos finalizados impuesta por disparadores en la base.

### Fase 3 — Catálogo de productos

- Administración de productos con creación, búsqueda y archivado.
- Normalización de nombres en la base: detecta duplicados sin importar acentos.
- Índice único parcial: solo impide duplicados entre productos activos.
- Imágenes con degradación a marcador cuando fallan o no existen.
- Auditoría de creación, edición, archivado y restauración.
- Seed con 15 productos y sus imágenes verificadas.

### Fase 2 — Autenticación y autorización

- Inicio y cierre de sesión con Supabase Auth, sin registro público.
- Roles ADMIN y EMPLOYEE con autorización en interfaz, servidor y RLS.
- Middleware de protección de rutas y renovación de sesión.
- Función `is_active_admin()` con `SECURITY DEFINER` para evitar recursión en RLS.
- Escalamiento de privilegios bloqueado: el disparador fuerza rol EMPLOYEE.
- Un administrador no puede autodegradarse ni desactivarse.

### Fase 1 — Base técnica

- Next.js 16, React 19, TypeScript en modo estricto reforzado.
- Sistema visual con modo día y noche, conmutador de icono sin texto.
- Contrastes verificados contra WCAG 2.1 AA en ambos temas.
- Profundidad mediante sombras en capas y respuesta táctil; respeta `prefers-reduced-motion`.
- Utilidades de fecha en `America/Bogota` y nombre de archivo del reporte.
- Validación de entorno con Zod, separada entre cliente y servidor.
- 113 pruebas unitarias y de componentes.
- Integración continua en GitHub Actions.

### Seguridad

- `server-only` en módulos privilegiados: importarlos desde el navegador rompe la compilación.
- Regla ESLint que impide importar clientes administrativos desde la interfaz.
- Mensaje de login ambiguo para no permitir enumerar cuentas.
- Respuesta 404 uniforme para tokens inexistentes, inválidos o revocados.
- URLs de imagen restringidas a http(s): bloquea `javascript:` y `data:`.
- Auditoría escrita solo desde el servidor: nadie puede falsificar registros.
