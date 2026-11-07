'use client';
// Sección y caída de tensión (fase H1). Cable, protección y caída en un solo cálculo, con el «por qué» a la vista.
// Inspirado en Ugly's, Electrical Calc Elite y la calculadora de caída de tensión de Southwire.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import {
  CIRCUITO,
  corrienteDesdePotencia,
  elegirConductor,
  MAX_CIRCUITOS_AGRUPADOS,
  REVISION,
  TEMPERATURAS,
  TIPOS_CIRCUITO,
  type Sistema,
  type TipoCircuito,
} from '../../taller/electricidad.ts';
import { AvisoRevision, CampoNumero, mostrar, numero, Opciones, PorQue, Resultado } from './piezas.tsx';
import './taller.css';

type Modo = 'corriente' | 'potencia';

export function Conductores() {
  const [tipo, setTipo] = useState<TipoCircuito>('tomas');
  const [sistema, setSistema] = useState<Sistema>('monofasico');
  const [modo, setModo] = useState<Modo>('potencia');
  const [carga, setCarga] = useState('2200');
  const [cosPhi, setCosPhi] = useState('0,9');
  const [longitud, setLongitud] = useState('25');
  const [temperatura, setTemperatura] = useState<number>(30);
  const [circuitos, setCircuitos] = useState(1);

  const valorCarga = numero(carga);
  const valorCos = numero(cosPhi);
  const valorLong = numero(longitud);
  const errorCarga = valorCarga === null || valorCarga <= 0 ? `Escribí ${modo === 'potencia' ? 'la potencia' : 'la corriente'} mayor que cero.` : null;
  const errorCos = valorCos === null || valorCos <= 0 || valorCos > 1 ? 'Entre 0,1 y 1.' : null;
  const errorLong = valorLong === null || valorLong <= 0 ? 'Escribí el largo del recorrido.' : null;
  const valido = valorCarga !== null && valorLong !== null && !errorCarga && !errorLong && !(modo === 'potencia' && errorCos);
  const corriente = valido ? (modo === 'potencia' ? corrienteDesdePotencia(valorCarga, sistema, valorCos ?? 0.9) : valorCarga) : 0;
  const r = valido ? elegirConductor({ corriente, longitud: valorLong, sistema, tipo, temperatura, circuitos, cosPhi: valorCos ?? 0.9 }) : null;
  const fila = r?.seccion ? r.tabla.find((f) => f.seccion === r.seccion) : null;
  const estado = !r ? undefined : r.seccion === null ? 'mal' : r.caida && r.caida.porcentaje > r.caidaMaxima * 0.8 ? 'atencion' : 'bien';
  const MANDA = { corriente: 'la corriente', caida: 'la caída de tensión', minimo: 'la sección mínima del circuito' } as const;

  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Sección y caída de tensión" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <Opciones etiqueta="Tipo de circuito" opciones={TIPOS_CIRCUITO.map((t) => ({ valor: t, texto: CIRCUITO[t].texto }))} valor={tipo} onCambio={setTipo} />
      <Opciones etiqueta="Sistema" opciones={[{ valor: 'monofasico' as const, texto: 'Monofásico 220 V' }, { valor: 'trifasico' as const, texto: 'Trifásico 380 V' }]} valor={sistema} onCambio={setSistema} />
      <section className="tl-tarjeta" aria-label="Datos del circuito">
        <Opciones etiqueta="Conozco" opciones={[{ valor: 'potencia' as const, texto: 'La potencia' }, { valor: 'corriente' as const, texto: 'La corriente' }]} valor={modo} onCambio={setModo} />
        <div className="tl-grilla2">
          <CampoNumero etiqueta={modo === 'potencia' ? 'Potencia' : 'Corriente'} unidad={modo === 'potencia' ? 'W' : 'A'} valor={carga} onCambio={setCarga} error={errorCarga} />
          {modo === 'potencia' ? <CampoNumero etiqueta="Factor de potencia" unidad="cos φ" valor={cosPhi} onCambio={setCosPhi} error={errorCos} ayuda="0,9 si no lo sabés" /> : null}
          <CampoNumero etiqueta="Largo del recorrido" unidad="m" valor={longitud} onCambio={setLongitud} error={errorLong} ayuda="Del tablero a la última boca" />
        </div>
        <Opciones etiqueta="Temperatura del lugar" opciones={TEMPERATURAS.map((t): { valor: number; texto: string } => ({ valor: t, texto: `${t} °C` }))} valor={temperatura} onCambio={setTemperatura} />
        <Opciones etiqueta="Circuitos en el mismo caño" opciones={Array.from({ length: MAX_CIRCUITOS_AGRUPADOS }, (_, i) => ({ valor: i + 1, texto: i + 1 === MAX_CIRCUITOS_AGRUPADOS ? `${i + 1} o más` : String(i + 1) }))} valor={circuitos} onCambio={setCircuitos} />
      </section>

      <Resultado
        titulo="Sección del cable"
        valor={r?.seccion ?? null}
        unidad="mm²"
        lectura={r?.seccion && r.caida ? `Sección ${mostrar(r.seccion)} milímetros cuadrados, protección de ${r.calibre} amperes, caída de ${mostrar(r.caida.porcentaje, 2)} por ciento.` : 'Sin resultado todavía.'}
        {...(estado ? { estado } : {})}
        {...(r?.seccion && r.manda ? { textoEstado: `La decide ${MANDA[r.manda]}` } : r ? { textoEstado: 'Ninguna sección alcanza' } : {})}
      >
        {r ? (
          <dl className="tl-datos">
            <div><dt>Corriente de proyecto</dt><dd>{mostrar(corriente, 1)} A</dd></div>
            <div><dt>Protección</dt><dd>{r.calibre ? `${r.calibre} A` : '—'}</dd></div>
            <div><dt>El cable soporta</dt><dd>{r.admisible ? `${mostrar(r.admisible)} A` : '—'}</dd></div>
            <div><dt>Caída de tensión</dt><dd>{r.caida ? `${mostrar(r.caida.porcentaje, 2)} % (${mostrar(r.caida.voltios, 1)} V)` : '—'}</dd></div>
          </dl>
        ) : null}
        {r && fila ? (
          <PorQue
            items={[
              { texto: `La protección (${r.calibre} A) cubre la corriente (${mostrar(corriente, 1)} A) y no supera lo que soporta el cable (${mostrar(fila.admisible)} A).`, ok: fila.cumple.corriente },
              { texto: `Caída de ${mostrar(fila.caida, 2)} %, el máximo para este circuito es ${mostrar(r.caidaMaxima)} %.`, ok: fila.cumple.caida },
              { texto: `Sección mínima para este tipo de circuito: ${mostrar(CIRCUITO[tipo].seccionMinima)} mm².`, ok: fila.cumple.minimo },
            ]}
          />
        ) : null}
        {r?.avisos.length ? (
          <ul className="tl-avisos">
            {r.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}
      </Resultado>

      {r ? (
        <section className="tl-tarjeta" aria-labelledby="tl-tabla-t">
          <h2 id="tl-tabla-t" className="tl-tarjeta__titulo">Todas las secciones</h2>
          <div className="tl-tabla-caja" tabIndex={0} role="region" aria-labelledby="tl-tabla-t">
            <table className="tl-tabla">
              <thead>
                <tr><th scope="col">Sección</th><th scope="col">Soporta</th><th scope="col">Caída</th><th scope="col">Cumple</th></tr>
              </thead>
              <tbody>
                {r.tabla.map((f) => {
                  const ok = f.cumple.corriente && f.cumple.caida && f.cumple.minimo;
                  return (
                    <tr key={f.seccion} className={f.seccion === r.seccion ? 'tl-tabla--elegida' : undefined}>
                      <th scope="row">{mostrar(f.seccion)} mm²</th>
                      <td>{mostrar(f.admisible)} A</td>
                      <td>{mostrar(f.caida, 2)} %</td>
                      <td>{ok ? 'Sí' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <AvisoRevision texto={REVISION.aviso} fuente={REVISION.fuente} />
    </div>
  );
}
