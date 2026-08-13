---
name: bakery-security-rbac
description: Revisa autenticación, autorización, roles ADMIN y EMPLOYEE, políticas RLS, secretos, endpoints y enlaces públicos del inventario de panadería.
---

# Seguridad y permisos

1. Comprueba autorización en UI, servidor y RLS.
2. Niega por defecto y concede la mínima capacidad.
3. Prohíbe `service_role` y secretos en código cliente.
4. Deshabilita registro público.
5. Prueba escalamiento de rol, IDOR, acceso a sesiones ajenas, mass assignment y manipulación de IDs.
6. Los empleados solo modifican conteos propios en estado DRAFT.
7. Los reportes finalizados son inmutables.
8. El acceso público usa token impredecible, revocable y no enumerable.
9. El endpoint público devuelve solo datos de reporte permitidos.
10. Registra acciones administrativas sin guardar secretos.
11. Cada hallazgo debe incluir severidad, evidencia, impacto y corrección verificable.
