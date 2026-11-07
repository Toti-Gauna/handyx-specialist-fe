'use client';
// Vigía de avisos (lote 4.5): cuando llega "¡El cliente te eligió!" mientras usás la app, baja la isla con "Ver el
// trabajo" y hay confeti. Al abrir la app no se celebra lo que ya estaba: eso queda en Avisos. Nunca acepta nada.
import { api } from '@handyx/origen-datos';
import { useEffect } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useConfeti, useIsla } from '../kit/Efectos.tsx';

// En memoria, mientras dura la pestaña (nada en el almacenamiento del navegador).
const vistos = new Set<string>();
let primeraLectura = true;

export function VigiaAvisos() {
  const isla = useIsla();
  const confeti = useConfeti();
  const { lanzar } = confeti;
  const c = useCarga(() => api.avisos(), [], { cadaMs: 20_000 });

  useEffect(() => {
    if (!c.datos) return;
    const nuevos = c.datos.filter((a) => a.tipo === 'te_eligieron' && !a.leido && !vistos.has(a.id));
    for (const a of c.datos) vistos.add(a.id);
    if (primeraLectura) {
      primeraLectura = false;
      return;
    }
    const a = nuevos[0];
    if (!a) return;
    lanzar();
    isla({ titulo: a.titulo, texto: a.cuerpo, icono: 'checkCirculo', tono: 'exito', accion: a.destino.id ? { texto: 'Ver el trabajo', href: `${RUTAS.trabajo.ruta}?id=${a.destino.id}` } : undefined });
  }, [c.datos, isla, lanzar]);

  return confeti.capa;
}
