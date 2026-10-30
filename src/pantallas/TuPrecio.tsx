'use client';
// Tu precio (lote 4.5): cuándo podés ir, "Handyx sugiere · Vos decidís", qué incluye y cuánto recibís. Sirve para la
// primera propuesta y para contraofertar (`?base=`). Desde un chat (`?chat=`) vuelve al chat. Enviar no compromete a
// nadie: el cliente decide.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { AreaTexto, ChipTipo } from '../components/ui.tsx';
import { monto } from '../contracts/dinero.ts';
import { avisoFee } from '../contracts/fee.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { diaLocal, deInputLocal, fechaHora, pesosDesdeCentavos } from '../lib/formato.ts';
import { FRASES_ALCANCE, opcionesCuando, sumarFrase } from '../lib/propuesta.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { SelectorHora, TiraDias } from '../kit/Fechas.tsx';
import { BarraSuperior } from '../kit/Navegacion.tsx';
import { BotonFijo, ChipOpcion } from '../kit/Piezas.tsx';
import { PrecioStepper } from '../kit/Precio.tsx';

export function TuPrecio() {
  const id = useIdDeUrl();
  const params = useSearchParams();
  const baseId = params.get('base');
  const chatId = params.get('chat');
  const c = useCarga(async () => {
    if (!id) return null;
    const [pedido, fee] = await Promise.all([api.pedido(id), api.feeVigente()]);
    return { pedido, fee };
  }, [id]);

  if (!id) return <Vacio icono="lupa" titulo="No indicaste qué pedido cotizar"><Link href={RUTAS.pedidos.ruta}>Ver pedidos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Formulario key={`${id}-${baseId ?? ''}`} datos={c.datos} baseId={baseId} chatId={chatId} />;
}

function Formulario({ datos, baseId, chatId }: { datos: { pedido: Awaited<ReturnType<typeof api.pedido>>; fee: Awaited<ReturnType<typeof api.feeVigente>> }; baseId: string | null; chatId: string | null }) {
  const router = useRouter();
  const isla = useIsla();
  const { pedido, fee } = datos;
  const ahora = api.ahora();
  const base = baseId ? (pedido.propuestas.find((p) => p.id === baseId) ?? null) : null;
  const volver = chatId ? `${RUTAS.hilo.ruta}?id=${chatId}` : `${RUTAS.pedido.ruta}?id=${pedido.id}`;
  const opciones = opcionesCuando(pedido.tipo, pedido.fechaSolicitada, ahora, base?.horario.inicio ?? null);
  const sugerido = pedido.precioSugerido?.monto.centavos ?? null;
  const tarifaBps = fee.politica && avisoFee(ahora, fee.politica).fase !== 'terminada' ? fee.politica.bpsEspecialista : null;

  const [cuando, setCuando] = useState<string | null>(opciones[0]?.inicio ?? null);
  const [otro, setOtro] = useState(opciones.length === 0);
  const hoy = diaLocal(ahora.toISOString());
  const [dia, setDia] = useState<string>(hoy);
  const [hm, setHm] = useState({ h: 10, m: 0 });
  const [precio, setPrecio] = useState(base?.monto.centavos ?? sugerido ?? 0);
  const [alcance, setAlcance] = useState(base?.alcance ?? '');
  const [errores, setErrores] = useState<{ cuando?: string; precio?: string; alcance?: string }>({});
  const { pendiente, fallo, ejecutar, clave } = useAccion();

  const inicioElegido = otro ? deInputLocal(`${dia}T${String(hm.h).padStart(2, '0')}:${String(hm.m).padStart(2, '0')}`) : cuando;

  async function enviar() {
    const err: typeof errores = {};
    if (!inicioElegido) err.cuando = 'Elegí cuándo podés ir.';
    else if (Date.parse(inicioElegido) <= api.ahora().getTime()) err.cuando = 'Elegí un horario a futuro.';
    if (precio <= 0) err.precio = 'Poné tu precio.';
    if (!alcance.trim()) err.alcance = 'Contá qué incluye tu propuesta.';
    setErrores(err);
    if (Object.keys(err).length > 0 || !inicioElegido) {
      const primero = document.querySelector<HTMLElement>(err.cuando ? '#tp-cuando' : err.precio ? '#tp-precio' : '#tp-alcance textarea');
      primero?.focus();
      return;
    }
    const r = await ejecutar(() => api.enviarPropuesta({ pedidoId: pedido.id, monto: monto(precio), alcance: alcance.trim(), horario: { inicio: inicioElegido, fin: null }, reemplazaA: base?.id ?? null }, clave()));
    if (r.ok) {
      isla({ titulo: base ? 'Enviaste tu contraoferta' : 'Enviaste tu propuesta', texto: 'Te avisamos cuando el cliente responda.', icono: 'enviar', tono: 'exito' });
      router.replace(volver);
    }
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo={base ? 'Contraofertar' : 'Tu precio'} atras={volver} textoAtras={chatId ? 'Volver al chat' : 'Volver al pedido'} acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo={pedido.tipo} />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[pedido.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="pin" /> {pedido.zonaAproximada}
          {pedido.fechaSolicitada ? ` · pidió ${fechaHora(pedido.fechaSolicitada)}` : ''}
        </p>
        {base ? <p className="texto-suave texto-chico">Respondés a la propuesta del cliente de {pesosDesdeCentavos(base.monto.centavos)}. La suya queda reemplazada.</p> : null}
      </div>

      <section className="fl-bloque" aria-labelledby="tp-cuando">
        <h2 id="tp-cuando" className="fl-bloque__titulo" tabIndex={-1}>
          ¿Cuándo podés ir?
        </h2>
        <ul className="hx-chips" aria-label="Opciones de horario">
          {opciones.map((o) => (
            <li key={o.id}>
              <ChipOpcion
                texto={o.texto}
                icono="reloj"
                elegido={!otro && cuando === o.inicio}
                onClick={() => {
                  setOtro(false);
                  setCuando(o.inicio);
                }}
              />
            </li>
          ))}
          <li>
            <ChipOpcion texto="Otro día y horario" icono="calendario" elegido={otro} onClick={() => setOtro(true)} />
          </li>
        </ul>
        {otro ? (
          <div className="tp-otro">
            <TiraDias desde={hoy} hoy={hoy} cuantos={14} elegido={dia} onElegir={setDia} etiqueta="Elegí el día" />
            <SelectorHora hora={hm.h} minuto={hm.m} onCambio={(h, m) => setHm({ h, m })} />
            {inicioElegido ? <p className="texto-suave texto-chico">Proponés el {fechaHora(inicioElegido)}.</p> : null}
          </div>
        ) : null}
        {errores.cuando ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {errores.cuando}
          </p>
        ) : null}
      </section>

      <section className="fl-bloque" aria-labelledby="tp-precio">
        <h2 id="tp-precio" className="fl-bloque__titulo" tabIndex={-1}>
          Tu precio
        </h2>
        <PrecioStepper valor={precio} onCambio={setPrecio} sugerido={sugerido} tarifaBps={tarifaBps} />
        {pedido.precioSugerido ? <p className="texto-suave texto-chico">La sugerencia sale de: {pedido.precioSugerido.fuente}. Es una referencia: el precio lo ponés vos.</p> : null}
        {errores.precio ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {errores.precio}
          </p>
        ) : null}
      </section>

      <section id="tp-alcance" className="fl-bloque" aria-labelledby="tp-alcance-t">
        <h2 id="tp-alcance-t" className="fl-bloque__titulo">
          Qué incluye
        </h2>
        <ul className="hx-chips" aria-label="Agregar al texto">
          {FRASES_ALCANCE.map((f) => (
            <li key={f}>
              <ChipOpcion texto={f} icono="mas" elegido={alcance.toLowerCase().includes(f.toLowerCase())} onClick={() => setAlcance((t) => sumarFrase(t, f))} />
            </li>
          ))}
        </ul>
        <AreaTexto etiqueta="Detalle del trabajo y las condiciones" value={alcance} onChange={(e) => setAlcance(e.target.value)} error={errores.alcance} maxLength={2000} />
      </section>

      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}
      <BotonFijo nota={pedido.tipo === 'urgente' ? 'En urgentes, tu propuesta vale 5 minutos. No tenés obligación de mandarla.' : 'El cliente la ve y decide. No tenés obligación de mandarla.'}>
        <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void enviar()}>
          {pendiente ? 'Enviando…' : `${base ? 'Enviar contraoferta' : 'Enviar propuesta'} de ${pesosDesdeCentavos(precio)}`}
        </button>
      </BotonFijo>
    </div>
  );
}
