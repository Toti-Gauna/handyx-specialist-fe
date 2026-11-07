# Deploy de la PWA de especialistas

## Hoy: demo con datos de prueba en specialist.handyx.pro (07/11/2026, pedido por Ignacio)

Es el build `mock` (`npm run build`): toda la app funciona con datos sintéticos en memoria, con el banner amarillo
«Datos de prueba» siempre visible y el **Panel de prueba** para recorrer escenarios (alta, pedidos, trabajo, obra, caja,
sin conexión). No hay backend, no se guarda nada fuera de la pestaña (recargar vuelve al estado inicial) y no se indexa
(`robots` y `X-Robots-Tag` en noindex). **No es producción**: producción es `build:hostinger` con la API real.

### Armar el paquete

```sh
npm ci
npm run build            # mock, base "/" (sin NEXT_PUBLIC_BASE_PATH)
npm run e2e              # los 26 recorridos sobre ese mismo build
(cd out && zip -qr ../handyx-specialist-demo.zip .)
```

`out/` lleva `.htaccess` (de `public/.htaccess`): HTTPS obligatorio, `404.html`, cabeceras de seguridad, noindex y
`no-cache` para el HTML, `sw.js`, el manifest y los `.txt` de Next (así un deploy nuevo llega enseguida; `docs/pwa.md`).

### Subir a Hostinger

1. **Subdominio**: hPanel → el sitio de `handyx.pro` → Dominios → Subdominios → crear `specialist`. Si el DNS de
   `handyx.pro` no está en Hostinger, crear en el proveedor de DNS el registro que indica hPanel para el subdominio.
2. **HTTPS**: hPanel → Seguridad → SSL → instalar el certificado gratuito para `specialist.handyx.pro`.
3. **Archivos**: Administrador de archivos → la carpeta del subdominio → borrar lo que haya → subir
   `handyx-specialist-demo.zip` → Extraer. `index.html` y `.htaccess` tienen que quedar en la raíz de esa carpeta (no
   adentro de otra). Activar «mostrar archivos ocultos» para ver el `.htaccess`.
4. **Verificar**: `https://specialist.handyx.pro/` abre con el banner «Datos de prueba»; `/inicio/` y `/pedidos/` cargan
   al recargar; una ruta inventada muestra la 404 de la app; `http://` redirige a `https://`; se puede instalar como app.

Para actualizar: repetir el paso 3 con el paquete nuevo (borrar todo antes, así no quedan archivos viejos de `_next/`).

## Después: producción

`build:hostinger` con `NEXT_PUBLIC_DATA_SOURCE=http` y `NEXT_PUBLIC_API_BASE_URL=https://…` (la API desplegada en la
fase 6). El script exige `http` y verifica que el bundle no tenga fixtures. Al pasar a producción, el mock deja de servirse
en ese dominio.
