'use client';
// Tu alta (lote 1.2): el registro por pasos RG-2 a RG-10 (`?paso=`) y el estado del alta (D6-Alta). Sin `?paso=` el
// registro se retoma en el paso que dice el servidor (`pasoActual`); no se saltean pasos. Mandada, se ve el estado y
// solo se pueden sumar certificados o cargar los antecedentes que faltaban. Al quedar habilitado aparece, una vez,
// «¡Estás habilitado!» (OB-Aprobado). Las piezas viven en ./registro/.
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import type { PasoRegistro, RegistroEspecialista } from '../contracts/registro.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { esPasoRegistro, pasoAMostrar, pasoSiguiente, registroEditable } from '../lib/registro.ts';
import { ProveedorRegistro, rutaPaso, type CtxRegistro } from './registro/comunes.tsx';
import { EstadoAlta } from './registro/EstadoAlta.tsx';
import { PasoRevision } from './registro/PasoRevision.tsx';
import { PasoDatos, PasoDomicilio, PasoRubros, PasoZonas } from './registro/PasosCuenta.tsx';
import { PasoAntecedentes, PasoCertificados } from './registro/PasosDocumentos.tsx';
import { PasoCuit, PasoDni, PasoSelfie } from './registro/PasosIdentidad.tsx';
import './registro/registro.css';

const PASOS: Record<PasoRegistro, () => ReactNode> = {
  datos: PasoDatos,
  domicilio: PasoDomicilio,
  rubros: PasoRubros,
  zonas: PasoZonas,
  selfie: PasoSelfie,
  dni: PasoDni,
  cuit_cuil: PasoCuit,
  certificados: PasoCertificados,
  antecedentes: PasoAntecedentes,
  revision: PasoRevision,
};

/** Lo que se puede abrir con el alta ya mandada. */
const DESPUES_DE_MANDAR = new Set<PasoRegistro>(['certificados', 'antecedentes']);

/** Qué mostrar: un paso o el estado del alta. Puro, para probarlo sin pantalla. */
export function vistaAlta(r: RegistroEspecialista, pedido: string | null): PasoRegistro | 'estado' {
  if (r.estadoAlta === 'borrador') return pasoAMostrar(r, pedido);
  if (r.estadoAlta === 'requiere_correccion') return esPasoRegistro(pedido) ? pasoAMostrar(r, pedido) : 'estado';
  if (r.estadoAlta === 'enviada' || r.estadoAlta === 'en_revision' || r.estadoAlta === 'habilitada') return esPasoRegistro(pedido) && DESPUES_DE_MANDAR.has(pedido) ? pedido : 'estado';
  return 'estado';
}

export function Alta() {
  const router = useRouter();
  const pedido = useSearchParams().get('paso');
  const { recargar: recargarPerfil } = usePerfil();
  // El alta la cambia el equipo de verificación: se vuelve a pedir cada minuto (con la pantalla a la vista).
  const c = useCarga(() => api.registro(), [], { cadaMs: 60_000 });
  const [propio, setPropio] = useState<RegistroEspecialista | null>(null);
  const r = propio && (!c.datos || propio.version >= c.datos.version) ? propio : c.datos;
  const habilitada = r?.estadoAlta === 'habilitada';
  const ob = useCarga(async () => (habilitada ? api.onboarding() : null), [habilitada]);

  // Recién habilitado: la bienvenida aparece sola, una vez.
  useEffect(() => {
    if (habilitada && ob.datos && !ob.datos.bienvenidaVista) router.replace(RUTAS.obHabilitado.ruta);
  }, [habilitada, ob.datos, router]);

  const recargar = c.recargar;
  const seguir = useCallback(
    (desde: PasoRegistro) => {
      void recargarPerfil();
      const sig = pasoSiguiente(desde);
      router.push(r && registroEditable(r.estadoAlta) && sig ? rutaPaso(sig) : RUTAS.alta.ruta);
    },
    [r, router, recargarPerfil],
  );
  const ctx = useMemo<CtxRegistro | null>(() => (r ? { r, fijar: setPropio, recargar, seguir } : null), [r, recargar, seguir]);

  if (c.fallo && !r) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!r || !ctx || (habilitada && (!ob.datos || !ob.datos.bienvenidaVista) && !ob.fallo)) return <Cargando />;

  const vista = vistaAlta(r, pedido);
  if (vista === 'estado') return <EstadoAlta r={r} />;
  const Paso = PASOS[vista];
  return (
    <ProveedorRegistro value={ctx}>
      <Paso key={vista} />
    </ProveedorRegistro>
  );
}
