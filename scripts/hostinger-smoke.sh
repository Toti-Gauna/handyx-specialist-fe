#!/usr/bin/env bash
# Pruebas públicas de solo lectura de la app publicada: no inician sesión ni escriben datos.
# Uso: bash scripts/hostinger-smoke.sh [URL base, por defecto https://workers.handyx.pro]
set -euo pipefail
base=${1:-https://workers.handyx.pro}
base=${base%/}

pedir() {
  curl --fail --silent --show-error --retry 3 --retry-delay 5 --connect-timeout 15 --max-time 30 "$@"
}
falla() { echo "Falló la prueba: $1" >&2; exit 1; }

inicio=$(pedir "$base/") || falla "no responde $base/"
[[ "$inicio" == *'<title>Handyx · Especialistas'* ]] || falla 'el inicio no es el de la app de especialistas de Handyx'
[[ "$inicio" == *'name="robots" content="noindex, nofollow"'* ]] || falla 'la app no pide que no la indexen'

# El JS que enlaza el index tiene que estar publicado y servirse como JavaScript.
script=$(grep -o '_next/static/[^"]*\.js' <<<"$inicio" | head -n 1)
[[ -n "$script" ]] || falla 'el index no enlaza ningún script de _next/static'
tipo=$(pedir --head "$base/$script" | tr -d '\r' | awk 'tolower($1)=="content-type:" {print $2}') || falla "no responde $base/$script"
[[ "$tipo" == *javascript* ]] || falla "el script publicado no es JavaScript ($tipo)"

# Una ruta interna abre directo (carpeta/index.html) y una inexistente da 404 real.
pedir --output /dev/null "$base/acceso/" || falla 'la ruta /acceso/ no abre'
codigo=$(curl --silent --output /dev/null --write-out '%{http_code}' --connect-timeout 15 --max-time 30 "$base/esta-ruta-no-existe/")
[[ "$codigo" == 404 ]] || falla "una ruta inexistente devolvió $codigo en vez de 404"

# Cabeceras del .htaccess: no se embebe en otros sitios y el HTML no se cachea.
cabeceras=$(pedir --head "$base/" | tr -d '\r' | tr '[:upper:]' '[:lower:]')
[[ "$cabeceras" == *'x-frame-options: deny'* ]] || falla 'falta X-Frame-Options: DENY (¿se subió el .htaccess?)'
[[ "$cabeceras" == *"frame-ancestors 'none'"* ]] || falla "falta frame-ancestors 'none'"
pedir --head "$base/index.html" | tr -d '\r' | tr '[:upper:]' '[:lower:]' | grep -q 'cache-control: no-store' || falla 'el HTML no lleva Cache-Control: no-store'

# Sin HTTPS tiene que redirigir.
if [[ "$base" == https://* ]]; then
  destino=$(curl --silent --output /dev/null --write-out '%{redirect_url}' --connect-timeout 15 --max-time 30 "http://${base#https://}/")
  [[ "$destino" == https://* ]] || falla 'http no redirige a https'
fi
echo 'La app publicada responde bien: index, script, rutas, 404, cabeceras de seguridad y redirección a HTTPS.'
