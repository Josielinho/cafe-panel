# Login del panel

## 1. Crear la tabla y función en Supabase
Pega el contenido de `admin_login_setup.sql` en el SQL Editor de Supabase y ejecútalo completo.

Este script ya viene corregido para funcionar con la extensión `pgcrypto` en el esquema `extensions` y para permitir que el frontend valide el acceso por RPC.

## 2. Usuario inicial
Después del script quedará creado este usuario:
- usuario: `admin`
- contraseña: `12345678`

Puedes cambiarla con este SQL:

```sql
update public.admin_login
set password_hash = extensions.crypt('NuevaClaveSegura456*', extensions.gen_salt('bf', 10))
where usuario = 'admin';
```

## 3. Prueba rápida
Puedes validar que todo quedó bien con:

```sql
select * from public.verify_admin_login('admin', '12345678');
```

Debe devolver `ok = true`.

## 4. Cómo funciona el proyecto
- ruta pública: `/login`
- rutas protegidas: `/`, `/analitica`, `/encuestas`
- el panel guarda la sesión en `localStorage`
- el frontend usa la función `public.verify_admin_login(...)`

## 5. Si sale error al iniciar sesión
Reejecuta `admin_login_setup.sql` completo. Ese archivo corrige:
- permisos de ejecución para `anon` y `authenticated`
- uso de `extensions.crypt(...)`
- creación del usuario inicial
