'use client';
// Agregar repuestos o mano de obra (lotes 4.6 y 4.7): "Opción personalizada" primero y lo habitual del rubro; el
// especialista pone el precio. Va al cliente, que lo acepta o lo rechaza: mientras tanto rige el precio vigente. En una
// obra se suma a la etapa en curso (`?etapa=`) y se cobra con ella.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, Campo, ChipTipo } from '../../components/ui.tsx';
import { monto } from '../../contracts/dinero.ts';
import { avisoFee } from '../../contracts/fee.ts';
import type { TipoAdicional, TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { pesosDesdeCentavos } from '../../lib/formato.ts';
import { etapaEnCurso, totalEtapa } from '../../lib/obra.ts';
import { opcionesAdicional, TIPO_ADICIONAL, type OpcionAdicional } from '../../lib/trabajo.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { BotonFijo, ChipOpcion } from '../../kit/Piezas.tsx';
import { PrecioStepper } from '../../kit/Precio.tsx';

export function AgregarAdicional() {
  const id = useIdDeUrl();
  const etapaPedida = useSearchParams().get('etapa');
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, fee] = await Promise.all([api.trabajo(id), api.feeVigente()]);
    return { detalle, fee };
  }, [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste a qué trabajo agregar"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const ahora = api.ahora();
  const politica = c.datos.fee.politica;
  const tarifaBps = politica && avisoFee(ahora, politica).fase !== 'terminada' ? politica.bpsEspecialista : null;
  return <Formulario detalle={c.datos.detalle} tarifaBps={tarifaBps} etapaPedida={etapaPedida} />;
}

function Formulario({ detalle: d, tarifaBps, etapaPedida }: { detalle: TrabajoDetalle; tarifaBps: number | null; etapaPedida: string | null }) {
  const router = useRouter();
  const isla = useIsla();
  const t = d.trabajo;
  const obra = t.tipo === 'obra';
  // En una obra, la etapa en curso (la pedida tiene que ser esa). Desde el plan se vuelve al plan.
  const etapa = obra ? (d.etapas.find((e) => e.id === etapaPedida && e.estado === 'en_curso') ?? etapaEnCurso(d.etapas)) : null;
  const volver = etapaPedida ? `${RUTAS.obraPlan.ruta}?id=${t.id}` : `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const textoVolver = etapaPedida ? 'Volver al plan de obra' : 'Volver al trabajo';
  const rige = etapa ? totalEtapa(etapa, d.adicionales) : d.totalVigente.centavos;
  const opciones = opcionesAdicional(t.rubro);
  const [opcion, setOpcion] = useState<OpcionAdicional | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoAdicional>('repuesto');
  const [precio, setPrecio] = useState(0);
  const [errores, setErrores] = useState<{ opcion?: string; descripcion?: string; precio?: string }>({});
  const { pendiente, fallo, ejecutar, clave } = useAccion();

  if (t.estado !== 'en_curso' || (obra && !etapa)) {
    return (
      <div className="fl-pantalla">
        <BarraSuperior titulo="Agregar al trabajo" atras={volver} textoAtras={textoVolver} acciones={null} />
        <Vacio icono="maletin" titulo={obra ? 'Los adicionales se agregan a una etapa en curso' : 'Los adicionales se agregan con el trabajo en curso'}>
          <Link href={volver}>Volver al trabajo</Link>
        </Vacio>
      </div>
    );
  }

  function elegir(o: OpcionAdicional) {
    setOpcion(o);
    setDescripcion(o.tipo ? o.texto : '');
    if (o.tipo) setTipo(o.tipo);
    setErrores({});
  }

  async function enviar() {
    const err: typeof errores = {};
    if (!opcion) err.opcion = 'Elegí qué querés agregar.';
    if (opcion && !descripcion.trim()) err.descripcion = 'Contá qué es.';
    if (opcion && precio <= 0) err.precio = 'Poné el precio.';
    setErrores(err);
    if (Object.keys(err).length > 0) {
      document.querySelector<HTMLElement>(err.opcion ? '#ad-que' : err.descripcion ? '#ad-descripcion input' : '#ad-precio')?.focus();
      return;
    }
    const r = await ejecutar(() => api.crearAdicional(t.id, { etapaId: etapa?.id ?? null, tipo, descripcion: descripcion.trim(), monto: monto(precio) }, clave()));
    if (r.ok) {
      isla({ titulo: 'Se lo mandamos al cliente', texto: 'Te avisamos cuando responda. Mientras tanto rige el precio vigente.', icono: 'enviar', tono: 'exito' });
      router.replace(volver);
    }
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Agregar al trabajo" atras={volver} textoAtras={textoVolver} acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo={t.tipo} />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="usuario" /> {d.contraparte}
          {etapa ? ` · etapa ${etapa.orden}: ${etapa.nombre}` : ''} · hoy rige {pesosDesdeCentavos(rige)}
        </p>
      </div>

      <section className="fl-bloque" aria-labelledby="ad-que">
        <h2 id="ad-que" className="fl-bloque__titulo" tabIndex={-1}>
          ¿Qué querés agregar?
        </h2>
        <ul className="tr-opciones" aria-label="Opciones">
          {opciones.map((o) => (
            <li key={o.id}>
              <button type="button" className="tr-opcion" aria-pressed={opcion?.id === o.id} onClick={() => elegir(o)}>
                <Icono nombre={o.tipo === null ? 'editar' : o.tipo === 'repuesto' ? 'llave' : 'reloj'} />
                <span>
                  <strong>{o.texto}</strong>
                  <small>{o.tipo ? TIPO_ADICIONAL[o.tipo] : 'Escribís vos qué es'}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {errores.opcion ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {errores.opcion}
          </p>
        ) : null}
      </section>

      {opcion ? (
        <>
          <section className="fl-bloque" aria-labelledby="ad-detalle">
            <h2 id="ad-detalle" className="fl-bloque__titulo">
              Detalle
            </h2>
            <ul className="hx-chips" aria-label="Tipo">
              {(['repuesto', 'mano_de_obra'] as const).map((x) => (
                <li key={x}>
                  <ChipOpcion texto={TIPO_ADICIONAL[x]} icono={x === 'repuesto' ? 'llave' : 'reloj'} elegido={tipo === x} onClick={() => setTipo(x)} />
                </li>
              ))}
            </ul>
            <div id="ad-descripcion">
              <Campo etiqueta="Qué es" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} error={errores.descripcion} maxLength={200} autoComplete="off" />
            </div>
          </section>

          <section className="fl-bloque" aria-labelledby="ad-precio">
            <h2 id="ad-precio" className="fl-bloque__titulo" tabIndex={-1}>
              Precio
            </h2>
            <PrecioStepper valor={precio} onCambio={setPrecio} sugerido={null} tarifaBps={tarifaBps} />
            {errores.precio ? (
              <p className="campo__error" role="alert">
                <Icono nombre="alerta" /> {errores.precio}
              </p>
            ) : null}
            <dl className="tr-desglose">
              <div>
                <dt>{etapa ? 'Hoy la etapa vale' : 'Hoy rige'}</dt>
                <dd>{pesosDesdeCentavos(rige)}</dd>
              </div>
              <div className="tr-desglose__total">
                <dt>Si lo acepta</dt>
                <dd>{pesosDesdeCentavos(rige + precio)}</dd>
              </div>
            </dl>
          </section>
          <Aviso tono="neutro" icono="info">
            Hacelo después de que el cliente lo acepte. Si no responde, al terminar {etapa ? 'la etapa' : 'el trabajo'} se retira y no se cobra.
          </Aviso>
        </>
      ) : null}

      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}
      <BotonFijo nota="El cliente lo ve en su app y decide. Nada cambia hasta que lo acepte.">
        <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void enviar()}>
          {pendiente ? 'Enviando…' : opcion && precio > 0 ? `Mandárselo al cliente · ${pesosDesdeCentavos(precio)}` : 'Mandárselo al cliente'}
        </button>
      </BotonFijo>
    </div>
  );
}
