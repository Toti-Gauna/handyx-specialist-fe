'use client';
// Solo celular (lote 0.2): con pantalla ancha (≥ 900 px) y mouse se muestra PantallaEscritorio (lienzo X-Escritorio)
// en lugar de la app. Una tablet grande que se usa con el dedo sigue viendo la app. El catálogo del mock queda afuera
// (se revisa desde la computadora). El HTML estático trae la app; el cambio se decide al hidratar.
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';
import { CONSULTA_ESCRITORIO } from '../logica.ts';
import { PantallaEscritorio } from '../organismos/PantallaEscritorio.tsx';

const LIBRES = ['/catalogo/'];

function suscribir(avisar: () => void) {
  const m = window.matchMedia(CONSULTA_ESCRITORIO);
  m.addEventListener('change', avisar);
  return () => m.removeEventListener('change', avisar);
}

export function SoloCelular({ children }: { children: ReactNode }) {
  const ruta = usePathname() ?? '';
  const escritorio = useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA_ESCRITORIO).matches,
    () => false,
  );
  if (escritorio && !LIBRES.some((l) => ruta.startsWith(l))) return <PantallaEscritorio />;
  return children;
}
