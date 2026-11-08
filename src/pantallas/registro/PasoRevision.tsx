'use client';
// RG-10 · Revisar y enviar (lote 1.2). Todo lo cargado con su estado (cada fila lleva a su paso), los textos para
// especialistas con una casilla sin tildar y «Mandar mi alta». Lo que falta lo dice el servidor (`faltantesEnvio`).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { FaltanteRegistro, PasoRegistro } from '../../contracts/registro.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { ETIQUETA_GRUPO, gruposAlta, NOMBRE_PASO, PRIVACIDAD_ESPECIALISTA_VERSION, TERMINOS_ESPECIALISTA_VERSION } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Casilla } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/Avisos.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { FalloPaso, MarcoPaso, rutaPaso, useRegistro } from './comunes.tsx';
import { HojaTextos } from './HojaTextos.tsx';

const PASO_FALTANTE: Record<FaltanteRegistro, PasoRegistro> = {
  datos: 'datos',
  domicilio: 'domicilio',
  rubros: 'rubros',
  zonas: 'zonas',
  selfie: 'selfie',
  dni: 'dni',
  cuit_cuil: 'cuit_cuil',
  matricula: 'certificados',
};

export function PasoRevision() {
  const router = useRouter();
  const { r, fijar } = useRegistro();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [acepta, setAcepta] = useState(false);
  const [textos, setTextos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const grupos = gruposAlta(r);
  const nombre = [r.datos.nombre, r.datos.apellido].filter(Boolean).join(' ');

  async function enviar() {
    if (r.faltantesEnvio.length) return setError('Todavía falta completar lo marcado arriba.');
    if (!acepta) return setError('Para mandar tu alta tenés que aceptar los términos y el aviso de privacidad para especialistas.');
    setError(null);
    const x = await ejecutar(async () => fijar(await api.enviarRegistro({ terminosEspecialista: TERMINOS_ESPECIALISTA_VERSION, privacidadEspecialista: PRIVACIDAD_ESPECIALISTA_VERSION, version: r.version })));
    if (x.ok) router.push(RUTAS.alta.ruta);
  }

  return (
    <MarcoPaso
      paso="revision"
      antes="Revisá y "
      marcado="mandá"
      bajada="Evaluamos tu perfil para saber si estás apto. Te avisamos apenas tengamos una respuesta."
      accion={
        <Boton icono="enviar" ocupado={pendiente} textoOcupado="Mandando…" onClick={() => void enviar()}>
          Mandar mi alta
        </Boton>
      }
    >
      {r.faltantesEnvio.length ? (
        <AvisoCaja tono="alerta" titulo="Para mandarla todavía falta">
          <span className="rg-faltan">
            {r.faltantesEnvio.map((f) => (
              <Link key={f} href={rutaPaso(PASO_FALTANTE[f])}>
                {f === 'matricula' ? 'La matrícula' : NOMBRE_PASO[PASO_FALTANTE[f]]}
              </Link>
            ))}
          </span>
        </AvisoCaja>
      ) : null}
      <Tarjeta etiqueta="Lo que cargaste">
        <FilaIcono icono="cuenta" titulo={nombre || 'Tus datos'} detalle={[r.datos.telefonoEnmascarado, r.datos.emailEnmascarado].filter(Boolean).join(' · ')} href={rutaPaso('datos')} borde={false} />
        {grupos.map((g) => {
          const e = ETIQUETA_GRUPO[g.estado];
          return (
            <FilaIcono
              key={g.id}
              icono={g.icono}
              titulo={g.titulo}
              detalle={g.detalle}
              href={rutaPaso(g.paso)}
              derecha={
                <Chip icono={e.icono} tono={e.tono}>
                  {g.estado === 'revision' ? 'Cargado' : e.texto}
                </Chip>
              }
            />
          );
        })}
      </Tarjeta>
      <div className="rg-acepta">
        <Casilla checked={acepta} onChange={(e) => setAcepta(e.target.checked)}>
          Leí y acepto los términos y el aviso de privacidad para especialistas.
        </Casilla>
        <Boton variante="texto" bloque={false} onClick={() => setTextos(true)}>
          Leer los textos
        </Boton>
      </div>
      {error ? <AvisoCaja tono="error" titulo={error} /> : null}
      <FalloPaso fallo={fallo} />
      <HojaTextos abierta={textos} onCerrar={() => setTextos(false)} />
    </MarcoPaso>
  );
}
