#!/usr/bin/env bash
# Regenera el catálogo de capturas sanitizadas de docs/capturas/ (después de `npm run build`; requiere ImageMagick).
# capturas.cjs falla si una pantalla muestra algo que no sea sintético, así que acá solo llega lo que pasó el control.
set -euo pipefail
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
ANCHOS=390x844,1280x800 node e2e/capturas.cjs "$tmp"
rm -rf docs/capturas/390x844 docs/capturas/1280x800
mkdir -p docs/capturas/390x844 docs/capturas/1280x800
for f in "$tmp"/390x844/*.png; do convert "$f" -strip -quality 72 "docs/capturas/390x844/$(basename "${f%.png}").webp"; done
for n in inicio pedido-programado trabajo-agendado agenda caja cuenta; do
  convert "$tmp/1280x800/$n.png" -strip -quality 72 "docs/capturas/1280x800/$n.webp"
done
echo "Catálogo actualizado en docs/capturas/"
