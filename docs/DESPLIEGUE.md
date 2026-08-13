# Publicar la aplicación

La forma más simple de poner la app en internet es **Vercel**, la empresa que
desarrolla Next.js. Tiene un plan gratuito suficiente para una panadería.

## 1. Subir el código a GitHub

```bash
git add .
git commit -m "Inventario de panadería"
git remote add origin https://github.com/TU-USUARIO/panaderia.git
git push -u origin master
```

Si aún no existe el repositorio, créalo primero en github.com (privado).

## 2. Conectar Vercel

1. Entra a **vercel.com** e inicia sesión con GitHub.
2. *Add New → Project* y elige el repositorio.
3. Vercel detecta Next.js automáticamente: no cambies nada de la configuración.

## 3. Variables de entorno

Antes de desplegar, en *Environment Variables* añade las cuatro:

| Nombre | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role) |
| `NEXT_PUBLIC_SITE_URL` | La dirección que te dé Vercel, por ejemplo `https://panaderia.vercel.app` |

`NEXT_PUBLIC_SITE_URL` no la conoces hasta el primer despliegue: pon un valor
provisional, despliega, y luego corrígela con la dirección real y vuelve a
desplegar.

## 4. Autorizar la dirección en Supabase

En Supabase → *Authentication → URL Configuration*:

- **Site URL**: la dirección de Vercel.
- **Redirect URLs**: añade la misma dirección.

Sin esto, el inicio de sesión falla en producción aunque funcione en local.

## 5. Comprobar

1. Abre la dirección en el celular.
2. Inicia sesión.
3. Toma la foto de un pan: comprueba que se sube.
4. Haz un conteo de prueba y finalízalo.
5. Abre el enlace del reporte desde otro teléfono, sin sesión.

## Antes de entregarlo a la panadería

- **Rota el secreto JWT** en Supabase → *Settings → API → JWT Settings →
  Generate a new JWT secret*. Invalida las dos claves a la vez, así que
  actualiza `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en
  Vercel en el mismo momento.
- Crea la cuenta de la propietaria y elimina las cuentas de prueba.
- Cambia el nombre de la panadería en la tabla `bakery_settings`.

## Cuánto cuesta

Ambos servicios tienen plan gratuito que cubre de sobra una panadería:

| Servicio | Plan gratuito |
|---|---|
| Vercel | 100 GB de tráfico al mes |
| Supabase | 500 MB de base de datos y 1 GB de archivos |

Una foto comprimida ocupa unos 80 KB: caben más de 12 000 fotos en el plan
gratuito de Supabase.
