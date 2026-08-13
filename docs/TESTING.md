# Pruebas

## Pruebas unitarias y de componentes

```bash
npm run test          # una vez
npm run test:watch    # en modo continuo
```

113 pruebas sobre la lógica que más riesgo concentra:

| Área | Qué se verifica |
|---|---|
| Fechas de Bogotá | Bordes de día, cambio de año, nombre del PDF, ausencia de horario de verano |
| Errores | El mensaje al usuario nunca filtra detalles internos |
| Entorno | Falta de variables detectada con mensaje que nombra la variable |
| Rutas públicas | Un prefijo parecido no abre una ruta privada |
| Búsqueda | Coincidencias sin acentos en ambos sentidos |
| Esquemas de producto | XSS por URL, mass assignment, límites de longitud |
| Esquemas de cantidad | Negativos, decimales, texto y límite máximo |
| Sesión y roles | Usuario desactivado, empleado en administración, admin inactivo |
| Tokens | Longitud, unicidad, hash irreversible |

## Pruebas de extremo a extremo

Requieren `.env.local` con un proyecto de Supabase y las migraciones aplicadas.

```bash
npm run build
npm run test:e2e         # móvil y escritorio
npm run test:e2e:movil   # solo móvil, que es el 98% del uso
npm run test:e2e:ui      # modo interactivo
```

Los usuarios de prueba se crean y se eliminan automáticamente. No se usan cuentas reales.

| Archivo | Recorridos |
|---|---|
| `acceso-publico.spec.ts` | Redirección al login, token inventado, ausencia de registro público, error de login ambiguo |
| `permisos.spec.ts` | Empleado y administrador, acceso denegado por dirección directa, cierre de sesión |
| `catalogo.spec.ts` | Crear producto, duplicados con y sin acentos, URL peligrosa, búsqueda, archivar |
| `conteo-y-reporte.spec.ts` | Conteo completo, finalización, enlace público sin sesión, borrador tras recarga, reporte revocado |

## Verificación contra la base real

```bash
node scripts/verify-rls.mjs      # permisos: 8 comprobaciones de RLS
node scripts/verify-db.mjs       # esquema y usuario administrador
node scripts/check-catalog.mjs   # catálogo y normalización de nombres
node scripts/verify-flow.mjs     # migraciones aplicadas
```

`verify-rls.mjs` crea un empleado temporal, intenta escalarlo a administrador,
comprueba que falla y lo elimina. Es la prueba de que el bloqueo está en la base
de datos y no solo en la interfaz.

## Antes de publicar

Los cuatro comandos deben terminar en verde:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
