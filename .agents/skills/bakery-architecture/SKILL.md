---
name: bakery-architecture
description: Diseña o revisa la arquitectura, alcance, capas y decisiones técnicas de la aplicación de inventario de panadería. Úsala antes de crear módulos, mover responsabilidades, añadir servicios o proponer NestJS.
---

# Arquitectura del inventario de panadería

1. Favorece una aplicación Next.js full-stack con Supabase durante el MVP.
2. Mantén reglas de negocio fuera de componentes React.
3. Separa validación, autorización, servicios, repositorios y presentación.
4. No agregues NestJS, colas, microservicios, Redis o eventos sin un requisito concreto.
5. Verifica que toda decisión reduzca complejidad o resuelva un riesgo real.
6. Conserva puntos de extracción futuros mediante interfaces de repositorio y servicios puros, sin crear abstracciones vacías.
7. Antes de implementar, documenta decisión, alternativas, consecuencias y criterio para revisarla.
8. Rechaza cambios que amplíen ventas, caja, recetas, compras o facturación dentro del MVP.
