'use client';
// H0-EquipoDetalle y H0-EquipoBaja (lote 2.4): una herramienta con dónde está, su mantenimiento y su historial
// (préstamos y trabajos donde se usó). Se presta (queda anotado a quién y hasta cuándo), se mueve o se avisa que ya no
// la tenés (se rompió, la vendiste, la perdiste…): sale del equipamiento pero queda en el historial, y se puede reponer.
// Cada acción se confirma en una hoja y vuelve con la versión nueva del servidor (409 si otra pantalla la cambió).
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { MOTIVOS_BAJA_EQUIPO, REPOSICIONES, UBICACIONES_EQUIPO, type EventoEquipo, type ItemEquipoDetalle, type MotivoBajaEquipo, type UbicacionEquipo } from '../../contracts/equipamiento.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { fechaCorta } from '../../lib/formato.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo, Radio } from '../../ui/atomos/Controles.tsx';
import type { NombreIconoUi } from '../../ui/atomos/Icono.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Stepper } from '../../ui/moleculas/Controles.tsx';
import { PortadaObjeto } from '../../ui/moleculas/Equipo.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { CATEGORIA, chipLugar, ddmm, dejarAviso, diasHasta, enUnaSemana, mesAnio, MOTIVOS, preguntaBaja, REPONER, textoCada, textoDias, UBICACION } from './vista.ts';
import './equipamiento.css';

const ICONO_EVENTO: Record<EventoEquipo['tipo'], NombreIconoUi> = {
  alta: 'mas',
  movimiento: 'camion',
  prestamo: 'usuario2',
  devolucion: 'usuario2',
  uso: 'obra',
  mantenimiento: 'herramienta',
  baja: 'tacho',
};

type Hojas = 'prestar' | 'mover' | 'baja' | 'cantidad' | null;

export function DetalleEquipo() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const c = useCarga(() => api.equipamientoItem(id), [id]);
  const [hoja, setHoja] = useState<Hojas>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const accion = useAccion();

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const it = c.datos;
  const cat = CATEGORIA[it.categoria];
  const ahora = api.ahora();
  const volver = `${RUTAS.equipamientoCategoria.ruta}?c=${it.categoria}`;
  const lugar = chipLugar(it);

  /** Hace la acción y recarga antes de soltar el control (así la próxima usa la versión nueva). */
  async function hacer(fn: () => Promise<unknown>, texto: string) {
    const r = await accion.ejecutar(async () => {
      await fn();
      await c.recargar();
    });
    if (r.ok) {
      setHoja(null);
      setAviso(texto);
    }
  }

  const compra = it.compradaEn ? `${mesAnio(it.compradaEn)}${it.garantiaHasta ? ` · con garantía hasta ${it.garantiaHasta.slice(5, 7)}/${it.garantiaHasta.slice(0, 4)}` : ''}` : null;

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={it.nombre} subtitulo={cat.nombre} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <div className="eq-acciones">
            {it.prestamo ? (
              <Boton variante="contorno" icono="usuario2" ocupado={accion.pendiente} textoOcupado="Guardando…" onClick={() => void hacer(() => api.devolverEquipamiento(it.id, it.version), `Anotamos que ${it.prestamo?.aNombre ?? 'te la devolvieron'} te la devolvió.`)}>
                Me la devolvió
              </Boton>
            ) : (
              <Boton variante="contorno" icono="usuario2" onClick={() => setHoja('prestar')}>
                Prestar
              </Boton>
            )}
            <Boton variante="contorno" icono="camion" disabled={it.prestamo !== null} onClick={() => setHoja('mover')}>
              Mover
            </Boton>
          </div>
          <Boton variante="peligro" disabled={it.prestamo !== null} onClick={() => setHoja('baja')}>
            Ya no la tengo
          </Boton>
          {it.prestamo ? <p className="ui-accion-fija__nota">Está prestada: cuando te la devuelvan, la podés mover o sacar.</p> : null}
        </AccionFija>
      }
    >
      <PortadaObjeto
        icono={cat.icono}
        foto={it.foto?.url ?? null}
        alt={`Foto de ${it.nombre}`}
        chips={
          <>
            <Chip tono="blanco" icono={lugar.icono}>
              {lugar.texto}
            </Chip>
            {it.estado === 'con_falla' ? (
              <Chip tono="error" icono="alerta">
                Con falla
              </Chip>
            ) : (
              <Chip tono="exito" icono="check">
                Funciona bien
              </Chip>
            )}
          </>
        }
      />
      {aviso ? <AvisoCaja tono="exito">{aviso}</AvisoCaja> : null}
      {accion.fallo && !hoja ? <ErrorCaja fallo={accion.fallo} onReintentar={() => void c.recargar()} /> : null}
      <Tarjeta como="div">
        {it.marcaModelo ? <FilaIcono icono="documento" titulo="Marca y modelo" detalle={it.marcaModelo} /> : null}
        {compra ? <FilaIcono icono="agenda" titulo="Comprada" detalle={compra} /> : null}
        {it.prestamo ? <FilaIcono icono="usuario2" titulo={`Prestada a ${it.prestamo.aNombre}`} detalle={`Desde el ${ddmm(it.prestamo.desde)}${it.prestamo.vuelveEl ? ` · vuelve el ${ddmm(it.prestamo.vuelveEl)}` : ''}`} /> : null}
        {it.cantidad !== null ? (
          <FilaIcono
            icono="caja"
            titulo={`Hay ${it.cantidad}`}
            detalle={it.minimo !== null ? `Te avisamos si quedan menos de ${it.minimo}` : undefined}
            derecha={
              <Boton variante="contorno" chico bloque={false} onClick={() => setHoja('cantidad')}>
                Cambiar
              </Boton>
            }
          />
        ) : null}
        {it.venceEn ? <FilaIcono icono="alerta" titulo={`Vence el ${ddmm(it.venceEn)}/${it.venceEn.slice(0, 4)}`} detalle={textoDias(diasHasta(it.venceEn, ahora))} /> : null}
        <FilaIcono icono={UBICACION[it.ubicacion].icono} titulo="Dónde está" detalle={it.prestamo ? `Prestada (su lugar: ${UBICACION[it.ubicacion].texto.toLocaleLowerCase('es')})` : UBICACION[it.ubicacion].texto} />
      </Tarjeta>
      {it.mantenimientos.length ? (
        <Tarjeta como="section" etiqueta="Mantenimiento">
          <Etiqueta como="h2">Mantenimiento</Etiqueta>
          {it.mantenimientos.map((m) => {
            const dias = diasHasta(m.proximoEl, ahora);
            return (
              <FilaIcono
                key={m.id}
                icono="herramienta"
                titulo={m.descripcion}
                detalle={`${textoCada(m.cadaDias)} · próxima ${ddmm(m.proximoEl)}`}
                derecha={
                  <span className="eq-mant">
                    <Chip tono={dias <= 30 ? 'amarillo' : 'gris'} icono="reloj">
                      {textoDias(dias)}
                    </Chip>
                    <Boton variante="contorno" chico bloque={false} ocupado={accion.pendiente} textoOcupado="Guardando…" onClick={() => void hacer(() => api.mantenimientoHecho(it.id, m.id, it.version), `Anotamos «${m.descripcion}» como hecho.`)}>
                      Ya lo hice
                    </Boton>
                  </span>
                }
              />
            );
          })}
        </Tarjeta>
      ) : null}
      <Tarjeta como="section" etiqueta="Historial">
        <Etiqueta como="h2">Historial</Etiqueta>
        {it.historial.map((e) => (
          <FilaIcono key={e.id} icono={ICONO_EVENTO[e.tipo]} titulo={e.texto} detalle={fechaCorta(e.en)} />
        ))}
      </Tarjeta>

      <HojaPrestar abierta={hoja === 'prestar'} item={it} pendiente={accion.pendiente} fallo={accion.fallo} onCerrar={() => setHoja(null)} onPrestar={(aNombre, vuelveEl) => void hacer(() => api.prestarEquipamiento(it.id, { profesionalId: null, aNombre, vuelveEl, version: it.version }), `Anotamos que se la prestaste a ${aNombre}.`)} hoy={ahora} />
      <HojaMover abierta={hoja === 'mover'} item={it} pendiente={accion.pendiente} fallo={accion.fallo} onCerrar={() => setHoja(null)} onMover={(u) => void hacer(() => api.moverEquipamiento(it.id, { ubicacion: u, version: it.version }), `La moviste ${UBICACION[u].en}.`)} />
      <HojaCantidad abierta={hoja === 'cantidad'} item={it} pendiente={accion.pendiente} fallo={accion.fallo} onCerrar={() => setHoja(null)} onGuardar={(n) => void hacer(() => api.corregirEquipamiento(it.id, { cantidad: n, version: it.version }), `Ahora hay ${n}.`)} />
      <HojaBaja
        abierta={hoja === 'baja'}
        item={it}
        pendiente={accion.pendiente}
        fallo={accion.fallo}
        onCerrar={() => setHoja(null)}
        onConfirmar={async (motivo, detalle, reponer) => {
          const r = await accion.ejecutar(() => api.bajaEquipamiento(it.id, { motivo, detalle, reponer, version: it.version }));
          if (!r.ok) return;
          const extra = reponer === 'lista_compras' ? ' La sumamos a tu lista de compras.' : reponer === 'ferreteria' ? ' Quedó en tu pedido de ferretería para comparar precios.' : '';
          dejarAviso(`Sacaste «${it.nombre}» de tu equipamiento. Queda en el historial de tus trabajos.${extra}`);
          router.push(volver);
        }}
      />
    </PantallaSecundaria>
  );
}

interface PropsHoja {
  abierta: boolean;
  item: ItemEquipoDetalle;
  pendiente: boolean;
  fallo: ReturnType<typeof useAccion>['fallo'];
  onCerrar(): void;
}

function HojaPrestar({ abierta, item, pendiente, fallo, onCerrar, onPrestar, hoy }: PropsHoja & { onPrestar(aNombre: string, vuelveEl: string | null): void; hoy: Date }) {
  const [quien, setQuien] = useState('');
  const [vuelve, setVuelve] = useState(() => enUnaSemana(hoy));
  const [error, setError] = useState<string | null>(null);
  return (
    <Hoja
      abierta={abierta}
      titulo={`Prestar: ${item.nombre}`}
      onCerrar={onCerrar}
      pie={
        <Boton
          ocupado={pendiente}
          textoOcupado="Guardando…"
          onClick={() => {
            if (!quien.trim()) return setError('Escribí a quién se la prestás.');
            setError(null);
            onPrestar(quien.trim(), vuelve || null);
          }}
        >
          Prestar
        </Boton>
      }
    >
      <div className="eq-hoja">
        <Campo etiqueta="¿A quién se la prestás?" placeholder="Ej.: Diego Herrera" value={quien} onChange={(e) => setQuien(e.target.value)} error={error} maxLength={80} autoComplete="off" />
        <Campo etiqueta="¿Cuándo te la devuelve?" type="date" value={vuelve} onChange={(e) => setVuelve(e.target.value)} ayuda="Si no sabés, dejalo vacío." />
        <p className="ui-nota">Queda anotado a quién y hasta cuándo. No se le avisa nada a nadie.</p>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
      </div>
    </Hoja>
  );
}

function HojaMover({ abierta, item, pendiente, fallo, onCerrar, onMover }: PropsHoja & { onMover(u: UbicacionEquipo): void }) {
  const opciones = UBICACIONES_EQUIPO.filter((u) => u !== item.ubicacion);
  const [destino, setDestino] = useState<UbicacionEquipo>(opciones[0] ?? 'taller');
  return (
    <Hoja
      abierta={abierta}
      titulo={`Mover: ${item.nombre}`}
      onCerrar={onCerrar}
      pie={
        <Boton ocupado={pendiente} textoOcupado="Moviendo…" onClick={() => onMover(destino)}>
          Mover {UBICACION[destino].en}
        </Boton>
      }
    >
      <div className="eq-hoja">
        <p className="ui-nota">Ahora está {UBICACION[item.ubicacion].texto.toLocaleLowerCase('es')}.</p>
        <PastillasOpcion leyenda="¿Adónde la llevás?" opciones={opciones.map((u) => ({ valor: u, texto: UBICACION[u].texto }))} valores={[destino]} onCambio={(v) => setDestino(v[0] ?? destino)} />
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
      </div>
    </Hoja>
  );
}

function HojaCantidad({ abierta, item, pendiente, fallo, onCerrar, onGuardar }: PropsHoja & { onGuardar(n: number): void }) {
  const [n, setN] = useState(item.cantidad ?? 0);
  return (
    <Hoja
      abierta={abierta}
      titulo={`Cuántos hay: ${item.nombre}`}
      onCerrar={onCerrar}
      pie={
        <Boton ocupado={pendiente} textoOcupado="Guardando…" onClick={() => onGuardar(n)}>
          Guardar la cantidad
        </Boton>
      }
    >
      <div className="eq-hoja">
        <Stepper etiqueta="Cantidad" valor={n} onCambio={setN} min={0} max={9999} />
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
      </div>
    </Hoja>
  );
}

function HojaBaja({ abierta, item, pendiente, fallo, onCerrar, onConfirmar }: PropsHoja & { onConfirmar(m: MotivoBajaEquipo, detalle: string | null, reponer: (typeof REPOSICIONES)[number]): Promise<void> }) {
  const [motivo, setMotivo] = useState<MotivoBajaEquipo>('se_rompio');
  const [detalle, setDetalle] = useState('');
  const [reponer, setReponer] = useState<(typeof REPOSICIONES)[number]>('ferreteria');
  return (
    <Hoja
      abierta={abierta}
      titulo={preguntaBaja(item.nombre)}
      onCerrar={onCerrar}
      pie={
        <Boton ocupado={pendiente} textoOcupado="Sacándola…" onClick={() => void onConfirmar(motivo, detalle.trim() || null, reponer)}>
          Sacarla de mi equipamiento
        </Boton>
      }
    >
      <div className="eq-hoja">
        <div className="eq-motivos">
          <PastillasOpcion leyenda="Qué pasó" opciones={MOTIVOS_BAJA_EQUIPO.map((m) => ({ valor: m, texto: MOTIVOS[m] }))} valores={[motivo]} onCambio={(v) => setMotivo(v[0] ?? motivo)} />
        </div>
        {motivo === 'otro' ? <AreaTexto etiqueta="Contanos qué pasó (si querés)" valor={detalle} onCambio={setDetalle} maximo={200} /> : null}
        <fieldset className="eq-reponer">
          <legend>¿Querés reponerla?</legend>
          {REPOSICIONES.map((r) => (
            <Radio key={r} name="reponer" value={r} checked={reponer === r} onChange={() => setReponer(r)} ayuda={REPONER[r].ayuda}>
              {REPONER[r].texto}
            </Radio>
          ))}
        </fieldset>
        <p className="ui-nota">Sale de tu equipamiento, pero queda en el historial de los trabajos donde la usaste.</p>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
      </div>
    </Hoja>
  );
}
