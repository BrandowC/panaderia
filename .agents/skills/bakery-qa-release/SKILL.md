---
name: bakery-qa-release
description: Define y ejecuta controles de calidad, pruebas unitarias, integración, RLS, Playwright, accesibilidad, CI y criterios de salida para cada fase del inventario de panadería.
---

# QA y liberación

Antes de declarar trabajo terminado:

1. Relaciona cada requisito con al menos una verificación.
2. Ejecuta lint, typecheck, pruebas y build.
3. Añade pruebas negativas de permisos, no solo caminos felices.
4. Usa Playwright en viewport móvil y escritorio.
5. Prueba recarga, doble clic, pérdida de red, sesión vencida y recuperación de borrador.
6. Comprueba que un reporte histórico no cambie tras renombrar o archivar un producto.
7. Ejecuta una revisión de accesibilidad sobre login, conteo y reporte.
8. Reporta comandos, resultados y limitaciones reales; no declares éxito sin evidencia.
9. Bloquea despliegue si CI falla o existen secretos/versiones vulnerables conocidas.
