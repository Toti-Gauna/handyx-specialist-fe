#!/usr/bin/env bash
# Se ejecuta en Hostinger, por SSH, desde .github/workflows/hostinger.yml. No recibe credenciales.
# Mismo método que el portal interno, la landing y Eclipse: copia el sitio compilado a la carpeta del dominio con
# un respaldo previo y, si algo falla (la copia o las pruebas públicas), restaura lo anterior.
#
#   publish  <carpeta> <release>   copia el sitio de .handyx-deploy/staging/<release> a <carpeta>
#   rollback <carpeta> <release>   restaura el respaldo de esa release
set -Eeuo pipefail

action=${1:?Falta la acción: publish o rollback}
target=${2:?Falta la carpeta de publicación}
release=${3:?Falta el identificador de release}
[[ "$action" == publish || "$action" == rollback ]] || exit 2
[[ "$release" =~ ^[0-9]+-[0-9]+-[a-f0-9]{40}$ ]] || { echo "Identificador de release inválido." >&2; exit 2; }
# Solo la carpeta de workers.handyx.pro. Nunca la de otro sitio de la cuenta: lo impide este patrón.
case "$target" in
  /*/domains/workers.handyx.pro/public_html) ;;
  *) echo 'Carpeta de publicación inesperada: solo se publica en la de workers.handyx.pro.' >&2; exit 2 ;;
esac
[[ -d "$target" && ! -L "$target" ]] || { echo 'La carpeta de publicación no existe o es un enlace.' >&2; exit 2; }
root="${target%%/public_html*}"
base="$root/.handyx-deploy"
stage="$base/staging/$release"
backup="$base/backups/$release.tar.gz"
umask 077
mkdir -p "$base/backups"
chmod 700 "$base" "$base/backups"
mkdir "$base/lock" || { echo 'Hay otra publicación en curso: revisá el lock antes de reintentar.' >&2; exit 1; }
trap 'rmdir "$base/lock"' EXIT

restore() {
  [[ -f "$backup" && -f "$backup.list" && -d "$stage" ]] || return 1
  # Hostinger puede no exponer /dev/fd: se usa una lista privada en disco.
  local incoming="$base/backups/$release.incoming"
  find "$stage" -type f -print0 > "$incoming" || return 1
  # Se borran solo los archivos que introdujo esta release y después se restaura el respaldo completo.
  while IFS= read -r -d '' file; do
    relative=${file#"$stage/"}
    if ! grep -Fxq -- "./$relative" "$backup.list"; then
      rm -f -- "$target/$relative" || return 1
    fi
  done < "$incoming"
  # Las carpetas que quedan vacías (rutas de la release) se quitan: el respaldo vuelve a crear las que existían.
  find "$target" -mindepth 1 -type d -empty -delete || return 1
  tar --same-permissions -xzf "$backup" -C "$target" || return 1
  echo "Se restauró el respaldo de la release $release."
}

if [[ "$action" == rollback ]]; then
  restore
  exit
fi

for file in index.html 404.html .htaccess; do
  [[ -s "$stage/$file" ]] || { echo "Sitio incompleto: falta $file." >&2; exit 1; }
done
[[ -d "$stage/_next/static" ]] || { echo 'Sitio incompleto: falta _next/static/.' >&2; exit 1; }
# La app no publica mapas de código ni variables de entorno.
[[ -z "$(find "$stage" \( -name '*.map' -o -name '.env*' \) -print -quit)" ]] || { echo 'El paquete trae mapas de código o archivos .env: no se publica.' >&2; exit 1; }
# Un .htaccess ajeno (por ejemplo el de Hostinger) se revisa antes de reemplazarlo: no se pisa en silencio.
if [[ -s "$target/.htaccess" ]] && ! grep -Fxq '# Handyx specialist app Hostinger managed static export' "$target/.htaccess"; then
  echo 'Hay un .htaccess que no es de este despliegue: revisalo antes de la primera publicación. No se cambió nada.' >&2
  exit 1
fi
# No se siguen enlaces simbólicos al copiar en la carpeta pública.
[[ -z "$(find "$target" "$stage" -type l -print -quit)" ]] || {
  echo 'Revisá los enlaces simbólicos antes de publicar.' >&2; exit 1;
}
[[ ! -e "$backup" ]] || { echo 'Esta release ya tiene un respaldo.' >&2; exit 1; }
tar -czf "$backup" -C "$target" .
tar -tzf "$backup" > "$backup.list"

publication_failed() {
  trap - ERR
  echo 'Falló la publicación: se restauran los archivos anteriores.' >&2
  if ! restore; then
    echo 'Falló la restauración automática. Usá el respaldo guardado antes de reintentar.' >&2
  fi
  exit 1
}
trap publication_failed ERR
find "$stage" -type d -exec chmod 755 {} +
find "$stage" -type f -exec chmod 644 {} +
# El respaldo es privado (umask 077); los archivos públicos tienen que quedar legibles.
umask 022
# Primero _next (con hash): se conservan los anteriores para que las pestañas ya abiertas sigan andando.
cp -R --preserve=mode "$stage/_next" "$target/"
cp -R --preserve=mode "$stage/." "$target/"
trap - ERR
echo "Release $release publicada. Respaldo: $backup"
