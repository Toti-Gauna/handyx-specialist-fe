#!/bin/sh
# Regenera todo el lienzo en orden. Correr desde la carpeta que tiene gen/ y deluxe/project/.
set -e
for g in fila_rg fila_taller fila_dia fila_recibir fila_obras fila_acceso fila_h0b fila_h0c fila_ferretero fila_camino fila_taller2 fila_v6 fila_v7 fila_v8 fila_v9; do python3 gen/$g.py >/dev/null; done
rm -f deluxe/project/H0-Vista.dc.html deluxe/project/H0-Ruta.dc.html deluxe/project/H0-Stock.dc.html deluxe/project/R-Panel.dc.html
python3 gen/fondos.py
python3 gen/descripciones.py
for g in flujos revision_board recorridos lienzo; do python3 gen/$g.py >/dev/null; done
