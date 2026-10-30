'use client';
// Alta guiada (lote 4.4). Con el alta editable: la lista con anillo de progreso, cada paso en su pantalla (`?paso=`) y el
// resumen (`?paso=resumen`). Enviada o en revisión: la línea de tiempo (y el turno de antecedentes se puede elegir igual).
// Rechazada o habilitada: su pantalla. Las piezas viven en ./alta/.
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { useCarga } from '../hooks/useCarga.ts';
import { esPasoAlta, itemsAlta, type PasoAlta } from '../lib/alta.ts';
import { fechaHora } from '../lib/formato.ts';
import type { PropsPaso } from './alta/comunes.tsx';
import { AltaEnRevision, AltaHabilitada, AltaRechazada } from './alta/EstadosAlta.tsx';
import { InicioAlta } from './alta/InicioAlta.tsx';
import { PasoAntecedentes } from './alta/PasoAntecedentes.tsx';
import { PasoDatos } from './alta/PasoDatos.tsx';
import { PasoIdentidad } from './alta/PasoIdentidad.tsx';
import { PasoRubros } from './alta/PasoRubros.tsx';
import { PasoSelfie } from './alta/PasoSelfie.tsx';
import { PasoZonas } from './alta/PasoZonas.tsx';
import { ResumenAlta } from './alta/ResumenAlta.tsx';
import './alta/alta.css';

const PASOS: Record<PasoAlta, (p: PropsPaso) => ReactNode> = {
  datos: PasoDatos,
  identidad: PasoIdentidad,
  selfie: PasoSelfie,
  rubros: PasoRubros,
  zonas: PasoZonas,
  antecedentes: PasoAntecedentes,
};

export function Alta() {
  const router = useRouter();
  const paso = useSearchParams().get('paso');
  const { perfil, recargar: recargarPerfil } = usePerfil();
  const c = useCarga(async () => {
    const [datos, disponibilidad] = await Promise.all([api.datosAlta(), api.disponibilidad()]);
    return { datos, disponibilidad };
  }, []);

  // La celebración es para el momento en que se ve el cambio a habilitada (no cada vez que se abre esta pantalla).
  const previo = useRef(perfil.estadoAlta);
  const [celebrar, setCelebrar] = useState(false);
  useEffect(() => {
    if (previo.current !== 'habilitada' && perfil.estadoAlta === 'habilitada') setCelebrar(true);
    previo.current = perfil.estadoAlta;
  }, [perfil.estadoAlta]);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const { datos, disponibilidad } = c.datos;
  const recargar = async () => {
    await Promise.all([c.recargar(), recargarPerfil()]);
  };
  const props: PropsPaso = { perfil, datos, disponibilidad, recargar, alTerminar: () => router.push(RUTAS.alta.ruta) };
  const items = itemsAlta(perfil, datos, disponibilidad, fechaHora);
  const e = perfil.estadoAlta;

  if (e === 'habilitada') return <AltaHabilitada perfil={perfil} celebrar={celebrar} />;
  if (e === 'rechazada' || e === 'suspendida') return <AltaRechazada perfil={perfil} />;
  if (e === 'enviada' || e === 'en_revision') {
    // Con el alta en revisión no se edita nada, pero el turno de antecedentes se puede elegir o cambiar.
    return paso === 'antecedentes' ? <PasoAntecedentes {...props} /> : <AltaEnRevision perfil={perfil} />;
  }
  if (paso === 'resumen') return <ResumenAlta perfil={perfil} datos={datos} items={items} recargar={recargar} />;
  if (esPasoAlta(paso)) {
    const Paso = PASOS[paso];
    return <Paso {...props} />;
  }
  return <InicioAlta perfil={perfil} items={items} />;
}
