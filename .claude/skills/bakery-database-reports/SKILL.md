---
name: bakery-database-reports
description: Diseña o revisa PostgreSQL, migraciones, snapshots de conteos, reportes públicos, zona horaria, PDF y consistencia transaccional.
---

# Datos y reportes

- Guarda timestamps en UTC y presenta en `America/Bogota`.
- Usa migraciones repetibles y versionadas.
- Añade checks para cantidades enteras no negativas.
- Archiva productos en lugar de borrarlos cuando exista historial.
- Al finalizar, copia nombre, categoría y orden como snapshot.
- Finalización y creación de reporte deben ser atómicas e idempotentes.
- No recalcules reportes históricos desde el catálogo actual.
- El PDF y la página pública deben consumir el mismo DTO de reporte.
- Prueba revocación, tokens inválidos, concurrencia y doble finalización.
- Añade índices solo para consultas identificadas y documenta su propósito.
