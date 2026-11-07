'use client';
// Taller (fase H0): las herramientas de tu oficio primero, después las comunes y las de otros oficios.
// Las calculadoras funcionan sin conexión: no guardan nada y no usan la API. El rubro sale del perfil; si el perfil no
// carga, se muestran todas igual (el catálogo es parte de la app, no son datos de prueba).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../../app/rutas.ts';
import { Handy } from '../../components/Handy.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso } from '../../components/ui.tsx';
import type { Rubro } from '../../contracts/rubros.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { ordenarParaRubros, type Herramienta } from '../../taller/catalogo.ts';
import { useEntrada } from './piezas.tsx';
import './taller.css';

export const RUTA_HERRAMIENTA: Record<string, string> = {
  conductores: RUTAS.tallerConductores.ruta,
  vivienda: RUTAS.tallerVivienda.ruta,
  tablero: RUTAS.tallerTablero.ruta,
  iluminacion: RUTAS.tallerIluminacion.ruta,
  consumo: RUTAS.tallerConsumo.ruta,
  ohm: RUTAS.tallerOhm.ruta,
  nivel: RUTAS.tallerNivel.ruta,
};

const NOMBRE_RUBRO: Record<Rubro, string> = {
  electricidad: 'Electricidad',
  plomeria: 'Plomería',
  gas: 'Gas',
  cerrajeria: 'Cerrajería',
  albanileria: 'Albañilería',
  aire_acondicionado: 'Aire acondicionado',
};

function Tarjeta({ h }: { h: Herramienta }) {
  const ruta = RUTA_HERRAMIENTA[h.id];
  const cuerpo = (
    <>
      <span className="tl-herr__ico">
        <Icono nombre={h.icono} />
      </span>
      <span className="tl-herr__texto">
        <strong>{h.titulo}</strong>
        <small>{h.bajada}</small>
      </span>
      {h.lista ? (
        h.sinConexion ? <span className="tl-herr__chip">Sin conexión</span> : null
      ) : (
        <span className="tl-herr__chip tl-herr__chip--prep">En preparación</span>
      )}
    </>
  );
  return (
    <li className="tl-herr-item">
      {h.lista && ruta ? (
        <Link className="tl-herr" href={ruta}>
          {cuerpo}
        </Link>
      ) : (
        <div className="tl-herr tl-herr--prep" aria-disabled="true">
          {cuerpo}
        </div>
      )}
    </li>
  );
}

export function Taller() {
  const c = useCarga(() => api.perfil(), []);
  const rubros = (c.datos?.rubros ?? []).map((r) => r.rubro);
  const { tuyas, comunes, otras } = ordenarParaRubros(rubros);
  const lista = useEntrada<HTMLDivElement>('.tl-herr-item');

  return (
    <div className="fl-pantalla tl" ref={lista}>
      <BarraSuperior titulo="Taller" atras={RUTAS.inicio.ruta} textoAtras="Volver a Inicio" acciones={null} />
      <header className="tl-hero">
        <div>
          <p className="tl-hero__eyebrow">Herramientas para tu oficio</p>
          <p className="hx-titulo tl-hero__titulo">
            Calculá, armá y <span className="hx-marca">presupuestá</span> en el lugar.
          </p>
        </div>
        <Handy nombre="lamparita" alto={92} />
      </header>
      {c.fallo && !c.datos ? (
        <Aviso tono="aviso" icono="alerta" titulo="No pudimos cargar tus rubros">
          Te mostramos todas las herramientas. Las calculadoras funcionan igual sin conexión.
        </Aviso>
      ) : null}
      {tuyas.length ? (
        <section aria-labelledby="tl-tuyas">
          <h2 id="tl-tuyas" className="tl-seccion">De tu oficio · {[...new Set(tuyas.map((h) => h.rubro))].map((r) => NOMBRE_RUBRO[r as Rubro]).join(', ')}</h2>
          <ul className="tl-herrs">{tuyas.map((h) => <Tarjeta key={h.id} h={h} />)}</ul>
        </section>
      ) : null}
      <section aria-labelledby="tl-comunes">
        <h2 id="tl-comunes" className="tl-seccion">Para todos los oficios</h2>
        <ul className="tl-herrs">{comunes.map((h) => <Tarjeta key={h.id} h={h} />)}</ul>
      </section>
      <section aria-labelledby="tl-otras">
        <h2 id="tl-otras" className="tl-seccion">Otros oficios</h2>
        <ul className="tl-herrs">{otras.map((h) => <Tarjeta key={h.id} h={h} />)}</ul>
      </section>
      <p className="tl-pie">Los cálculos son una ayuda: no reemplazan tu criterio profesional ni un certificado.</p>
    </div>
  );
}
