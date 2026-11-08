'use client';
// Conversor (lote 2.4): pulgadas y milímetros (caños), frigorías y BTU (aires), bar y psi (manómetros), HP y watts,
// litros y metros cúbicos. Se escribe como en la obra («3/4», «1 1/2», «2,5»). Sin conexión y sin guardar nada.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { convertir, leerNumero, MAGNITUDES, mostrarNumero, PULGADAS_COMUNES, type Magnitud } from '../../herramientas/conversor.ts';
import { BotonIcono } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Seleccion } from '../../ui/atomos/Seleccion.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { ResultadoDestacado } from '../../ui/moleculas/Herramientas.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './herramientas.css';

const INICIO: Record<Magnitud, [string, string, string]> = {
  largo: ['3/4', 'pulgada', 'mm'],
  superficie: ['12', 'm2', 'pie2'],
  volumen: ['1', 'm3', 'l'],
  presion: ['1', 'bar', 'psi'],
  potencia: ['3000', 'frigoria', 'btu'],
};

export function Conversor() {
  const [magnitud, setMagnitud] = useState<Magnitud>('largo');
  const [valor, setValor] = useState(INICIO.largo[0]);
  const [desde, setDesde] = useState(INICIO.largo[1]);
  const [hacia, setHacia] = useState(INICIO.largo[2]);
  const unidades = MAGNITUDES[magnitud].unidades as Record<string, { texto: string; corto: string }>;
  const n = leerNumero(valor);
  const r = n === null ? null : convertir(magnitud, n, desde as never, hacia as never);
  const de = unidades[desde];
  const a = unidades[hacia];

  function cambiarMagnitud(m: Magnitud) {
    const [v, d, h] = INICIO[m];
    setMagnitud(m);
    setValor(v);
    setDesde(d);
    setHacia(h);
  }

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Conversor" subtitulo="Para todos los oficios" hrefVolver={RUTAS.tallerHerramientas.ruta} />}>
      <PastillasOpcion leyenda="Qué convertís" opciones={(Object.keys(MAGNITUDES) as Magnitud[]).map((m) => ({ valor: m, texto: MAGNITUDES[m].nombre }))} valores={[magnitud]} onCambio={(v) => cambiarMagnitud(v[0] ?? magnitud)} />
      <div className="th-columna">
        <Campo etiqueta="Valor" inputMode="decimal" autoComplete="off" value={valor} onChange={(e) => setValor(e.target.value)} error={valor.trim() && n === null ? 'Escribí un número: 2,5 · 3/4 · 1 1/2' : null} ayuda={magnitud === 'largo' ? 'Podés escribir pulgadas como en el corralón: 3/4 o 1 1/2.' : undefined} />
        <div className="th-fila">
          <Seleccion etiqueta="De" value={desde} onChange={(e) => setDesde(e.target.value)}>
            {Object.entries(unidades).map(([k, u]) => (
              <option key={k} value={k}>
                {u.texto}
              </option>
            ))}
          </Seleccion>
          <BotonIcono
            icono="flechas"
            etiqueta="Invertir: pasar de una unidad a la otra"
            onClick={() => {
              setDesde(hacia);
              setHacia(desde);
            }}
          />
          <Seleccion etiqueta="A" value={hacia} onChange={(e) => setHacia(e.target.value)}>
            {Object.entries(unidades).map(([k, u]) => (
              <option key={k} value={k}>
                {u.texto}
              </option>
            ))}
          </Seleccion>
        </div>
      </div>
      <ResultadoDestacado
        etiqueta="Resultado"
        valor={r === null || !Number.isFinite(r) ? '—' : mostrarNumero(r)}
        unidad={a?.corto ?? ''}
        lectura={r === null || !Number.isFinite(r) ? 'Sin resultado todavía.' : `${valor} ${de?.texto ?? ''} son ${mostrarNumero(r)} ${a?.texto ?? ''}.`}
        detalle={n === null ? 'Escribí un valor.' : `${valor} ${de?.corto ?? ''} = ${r === null ? '—' : mostrarNumero(r)} ${a?.corto ?? ''}`}
      />
      {magnitud === 'largo' ? (
        <Tarjeta como="section" etiqueta="Medidas de caño en pulgadas">
          <Etiqueta como="h2">Medidas de caño en pulgadas</Etiqueta>
          <dl className="th-tabla">
            {PULGADAS_COMUNES.map((p) => (
              <div key={p}>
                <dt>{p}&quot;</dt>
                <dd>{mostrarNumero(convertir('largo', leerNumero(p) ?? 0, 'pulgada', 'mm'), 1)} mm</dd>
              </div>
            ))}
          </dl>
          <p className="th-pie">Es la medida nominal: el diámetro real del caño cambia según el material y la norma.</p>
        </Tarjeta>
      ) : null}
      {magnitud === 'potencia' ? <p className="th-pie">1 frigoría por hora es lo mismo que 1 kcal/h. Para elegir un aire, usá el cálculo del ambiente: esto es solo el cambio de unidad.</p> : null}
    </PantallaSecundaria>
  );
}
