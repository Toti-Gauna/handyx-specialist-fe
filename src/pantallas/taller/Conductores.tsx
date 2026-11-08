'use client';
// T-Cables (fase H1, pasado al kit v3 en el lote 2.4): sección del cable, protección y caída de tensión en un solo
// cálculo, con el «por qué» a la vista. Inspirado en Ugly's, Electrical Calc Elite y la calculadora de Southwire.
// Funciona sin conexión y no guarda nada. Los valores están en revisión técnica y se dice al lado del resultado.
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { leerNumero, mostrarNumero } from '../../herramientas/conversor.ts';
import { CIRCUITO, corrienteDesdePotencia, elegirConductor, MAX_CIRCUITOS_AGRUPADOS, REVISION, TEMPERATURAS, TIPOS_CIRCUITO, type Sistema, type TipoCircuito } from '../../taller/electricidad.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { AvisoRevisionTecnica, ResultadoDestacado } from '../../ui/moleculas/Herramientas.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './electricidad.css';

type Modo = 'corriente' | 'potencia';
const MANDA = { corriente: 'la corriente', caida: 'la caída de tensión', minimo: 'la sección mínima del circuito' } as const;
const mm2 = (n: number) => mostrarNumero(n, 1);

export function Conductores() {
  const [tipo, setTipo] = useState<TipoCircuito>('tomas');
  const [sistema, setSistema] = useState<Sistema>('monofasico');
  const [modo, setModo] = useState<Modo>('potencia');
  const [carga, setCarga] = useState('2200');
  const [cosPhi, setCosPhi] = useState('0,9');
  const [longitud, setLongitud] = useState('25');
  const [temperatura, setTemperatura] = useState<string>('30');
  const [circuitos, setCircuitos] = useState<string>('1');
  const isla = useIsla();

  const valorCarga = leerNumero(carga);
  const valorCos = leerNumero(cosPhi);
  const valorLong = leerNumero(longitud);
  const errorCarga = valorCarga === null || valorCarga <= 0 ? `Escribí ${modo === 'potencia' ? 'la potencia' : 'la corriente'} mayor que cero.` : null;
  const errorCos = valorCos === null || valorCos <= 0 || valorCos > 1 ? 'Entre 0,1 y 1.' : null;
  const errorLong = valorLong === null || valorLong <= 0 ? 'Escribí el largo del recorrido.' : null;
  const valido = valorCarga !== null && valorLong !== null && !errorCarga && !errorLong && !(modo === 'potencia' && errorCos);
  const corriente = valido ? (modo === 'potencia' ? corrienteDesdePotencia(valorCarga, sistema, valorCos ?? 0.9) : valorCarga) : 0;
  const r = valido ? elegirConductor({ corriente, longitud: valorLong, sistema, tipo, temperatura: Number(temperatura), circuitos: Number(circuitos), cosPhi: valorCos ?? 0.9 }) : null;
  const fila = r?.seccion ? r.tabla.find((f) => f.seccion === r.seccion) : null;
  const decide = !r ? null : r.seccion && r.manda ? `La decide ${MANDA[r.manda]}` : 'Ninguna sección alcanza';
  const porQue = r && fila
    ? [
        { texto: `La protección (${r.calibre} A) cubre la corriente (${mostrarNumero(corriente, 1)} A) y no supera lo que soporta el cable (${mm2(fila.admisible)} A).`, ok: fila.cumple.corriente },
        { texto: `Caída de ${mostrarNumero(fila.caida, 2)} %, el máximo para este circuito es ${mm2(r.caidaMaxima)} %.`, ok: fila.cumple.caida },
        { texto: `Sección mínima para este tipo de circuito: ${mm2(CIRCUITO[tipo].seccionMinima)} mm².`, ok: fila.cumple.minimo },
      ]
    : [];

  async function compartir() {
    if (!r?.seccion || !r.caida) return;
    const t = `Cable de ${mm2(r.seccion)} mm² · protección ${r.calibre} A · caída ${mostrarNumero(r.caida.porcentaje, 2)} % en ${mm2(valorLong ?? 0)} m (${CIRCUITO[tipo].texto}).\nValores de referencia en revisión técnica: confirmá con la reglamentación AEA 90364 vigente.`;
    try {
      if (navigator.share) await navigator.share({ text: t, title: 'Cálculo de cables' });
      else {
        await navigator.clipboard.writeText(t);
        isla({ titulo: 'Copiamos el cálculo', texto: 'Pegalo en el chat o en tu presupuesto.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Cables" subtitulo="Sección y caída de tensión" hrefVolver={RUTAS.tallerElectricidad.ruta} />}
      accion={
        <AccionFija>
          <Boton icono="enviar" disabled={!r?.seccion} onClick={() => void compartir()}>
            Compartir el cálculo
          </Boton>
        </AccionFija>
      }
    >
      <PastillasOpcion leyenda="Tipo de circuito" opciones={TIPOS_CIRCUITO.map((t) => ({ valor: t, texto: CIRCUITO[t].texto }))} valores={[tipo]} onCambio={(v) => setTipo(v[0] ?? tipo)} />
      <Segmento<Sistema> etiqueta="Sistema" opciones={[{ valor: 'monofasico' as const, texto: 'Monofásico 220 V' }, { valor: 'trifasico' as const, texto: 'Trifásico 380 V' }]} valor={sistema} onCambio={setSistema} />
      <Segmento<Modo> etiqueta="Conozco" opciones={[{ valor: 'potencia' as const, texto: 'La potencia' }, { valor: 'corriente' as const, texto: 'La corriente' }]} valor={modo} onCambio={setModo} />
      <div className="el-grilla">
        <Campo etiqueta={modo === 'potencia' ? 'Potencia' : 'Corriente'} inputMode="decimal" autoComplete="off" value={carga} onChange={(e) => setCarga(e.target.value)} error={errorCarga} ayuda={modo === 'potencia' ? 'En watts (W)' : 'En amperes (A)'} />
        {modo === 'potencia' ? <Campo etiqueta="Factor de potencia" inputMode="decimal" autoComplete="off" value={cosPhi} onChange={(e) => setCosPhi(e.target.value)} error={errorCos} ayuda="cos φ · 0,9 si no lo sabés" /> : null}
        <Campo etiqueta="Largo del recorrido" inputMode="decimal" autoComplete="off" value={longitud} onChange={(e) => setLongitud(e.target.value)} error={errorLong} ayuda="En metros, del tablero a la última boca" />
      </div>
      <PastillasOpcion leyenda="Temperatura del lugar" opciones={TEMPERATURAS.map((t) => ({ valor: String(t), texto: `${t} °C` }))} valores={[temperatura]} onCambio={(v) => setTemperatura(v[0] ?? temperatura)} />
      <PastillasOpcion leyenda="Circuitos en el mismo caño" opciones={Array.from({ length: MAX_CIRCUITOS_AGRUPADOS }, (_, i) => ({ valor: String(i + 1), texto: i + 1 === MAX_CIRCUITOS_AGRUPADOS ? `${i + 1} o más` : String(i + 1) }))} valores={[circuitos]} onCambio={(v) => setCircuitos(v[0] ?? circuitos)} />

      <ResultadoDestacado
        etiqueta="Sección sugerida"
        valor={r?.seccion ? mm2(r.seccion) : '—'}
        unidad="mm²"
        lectura={r?.seccion && r.caida ? `Sección ${mm2(r.seccion)} milímetros cuadrados, protección de ${r.calibre} amperes, caída de ${mostrarNumero(r.caida.porcentaje, 2)} por ciento.` : 'Sin resultado todavía.'}
        chip={
          r?.caida ? (
            <Chip tono="blanco" icono={fila?.cumple.caida ? 'check' : 'alerta'}>
              Caída {mostrarNumero(r.caida.porcentaje, 1)} %
            </Chip>
          ) : null
        }
        detalle={r ? `Corriente ${mostrarNumero(corriente, 1)} A · protección sugerida ${r.calibre ? `${r.calibre} A` : '—'}` : 'Completá los datos del circuito.'}
      >
        {decide ? (
          <p className="el-decide">
            <Icono nombre={r?.seccion ? 'check' : 'alerta'} tam="chico" /> {decide}
          </p>
        ) : null}
      </ResultadoDestacado>
      {porQue.length ? (
        <Tarjeta como="section" etiqueta="Por qué">
          <Etiqueta como="h2">Por qué</Etiqueta>
          <ul className="el-porque">
            {porQue.map((i) => (
              <li key={i.texto} className={i.ok ? 'el-porque--ok' : 'el-porque--no'}>
                <Icono nombre={i.ok ? 'check' : 'cerrar'} />
                <span>
                  <span className="visualmente-oculto">{i.ok ? 'Cumple: ' : 'No cumple: '}</span>
                  {i.texto}
                </span>
              </li>
            ))}
          </ul>
          {r?.avisos.length ? (
            <ul className="el-avisos">
              {r.avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : null}
        </Tarjeta>
      ) : null}
      <AvisoRevisionTecnica fuente={REVISION.fuente}>{REVISION.aviso}</AvisoRevisionTecnica>
      {r ? (
        <Tarjeta como="section" etiqueta="Todas las secciones">
          <Etiqueta como="h2">Todas las secciones</Etiqueta>
          <div className="el-tabla-caja" tabIndex={0} role="region" aria-label="Tabla de todas las secciones">
            <table className="el-tabla">
              <thead>
                <tr>
                  <th scope="col">Sección</th>
                  <th scope="col">Soporta</th>
                  <th scope="col">Caída</th>
                  <th scope="col">Cumple</th>
                </tr>
              </thead>
              <tbody>
                {r.tabla.map((f) => {
                  const ok = f.cumple.corriente && f.cumple.caida && f.cumple.minimo;
                  return (
                    <tr key={f.seccion} className={f.seccion === r.seccion ? 'el-tabla--elegida' : undefined}>
                      <th scope="row">{mm2(f.seccion)} mm²</th>
                      <td>{mm2(f.admisible)} A</td>
                      <td>{mostrarNumero(f.caida, 2)} %</td>
                      <td>{ok ? 'Sí' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      ) : null}
    </PantallaSecundaria>
  );
}
