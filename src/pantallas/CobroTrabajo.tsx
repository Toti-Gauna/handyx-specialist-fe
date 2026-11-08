'use client';
// ¿Cómo te pagó? (TR-Cobro, lote 1.3): informás cómo te pagó el cliente (efectivo, Mercado Pago o transferencia) y si
// cobraste todo o una parte. El pago va directo a vos: Handyx no recibe ese dinero ni te cobra comisión. Lo que informás
// queda «informado por vos» hasta que el cliente lo confirma o se verifica el pago (informado ≠ verificado).
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import { monto } from '../contracts/dinero.ts';
import type { Cobro, MetodoCobro } from '../contracts/ingresos.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { centavosDesdeTexto } from '../lib/formato.ts';
import { Boton, BotonEnlace } from '../ui/atomos/Boton.tsx';
import { Campo } from '../ui/atomos/Controles.tsx';
import { Chip, Cifra, Etiqueta, Titulo } from '../ui/atomos/Texto.tsx';
import { textoCifra } from '../ui/logica.ts';
import { Segmento } from '../ui/moleculas/Controles.tsx';
import { Tarjeta } from '../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import './nucleo/nucleo.css';

const METODOS: { valor: MetodoCobro; texto: string }[] = [
  { valor: 'efectivo', texto: 'Efectivo' },
  { valor: 'mercado_pago', texto: 'Mercado Pago' },
  { valor: 'transferencia', texto: 'Transferencia' },
];
const ESTADO: Record<Cobro['estado'], string> = {
  pendiente: 'Sin informar',
  reportado: 'Informado por vos · sin verificar',
  verificado: 'Verificado',
  fallido: 'El pago falló',
  en_discrepancia: 'En revisión: no coincide',
};

export function CobroTrabajo() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const detalle = await api.trabajo(id);
    const cobro = detalle.pagoId ? await api.cobro(detalle.pagoId) : null;
    return { detalle, cobro };
  }, [id]);
  const volver = id ? `${RUTAS.trabajo.ruta}?id=${id}` : RUTAS.inicio.ruta;
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-vacio" aria-busy="true" />;
  const { detalle, cobro } = c.datos;
  if (!cobro) {
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="¿Cómo te pagó?" hrefVolver={volver} />}>
        <p>{detalle.trabajo.tipo === 'obra' ? 'En una obra, cada etapa se cobra desde el plan de obra.' : 'Este trabajo todavía no tiene un cobro para informar.'}</p>
        <BotonEnlace href={volver}>Volver al trabajo</BotonEnlace>
      </PantallaSecundaria>
    );
  }
  return <Formulario key={`${cobro.id}-${cobro.version}`} cobro={cobro} titulo={detalle.contraparte} volver={volver} recargar={c.recargar} />;
}

function Formulario({ cobro, titulo, volver, recargar }: { cobro: Cobro; titulo: string; volver: string; recargar(): Promise<void> }) {
  const informe = useAccion();
  const [metodo, setMetodo] = useState<MetodoCobro>(cobro.metodo ?? 'efectivo');
  const [todo, setTodo] = useState<'todo' | 'parte'>('todo');
  const [parte, setParte] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<Cobro | null>(cobro.estado === 'pendiente' ? null : cobro);
  const nombre = titulo.split(' ')[0] ?? titulo;

  async function informar() {
    const centavos = todo === 'todo' ? cobro.monto.centavos : centavosDesdeTexto(parte);
    if (!centavos || centavos <= 0) return setError('Escribí cuánto te pagó, por ejemplo 20.000.');
    if (centavos > cobro.monto.centavos) return setError(`No puede ser más que lo acordado (${textoCifra(cobro.monto.centavos)}).`);
    setError(null);
    const r = await informe.ejecutar(() => api.informarCobro(cobro.id, { metodo, monto: monto(centavos), version: cobro.version }, informe.clave()));
    if (r.ok) setListo(r.valor);
    else if (r.fallo.tipo === 'conflicto') {
      informe.nueva();
      await recargar();
    }
  }

  if (listo) {
    return (
      <PantallaSecundaria
        barra={<BarraCompacta titulo="Cobro informado" subtitulo={titulo} hrefVolver={volver} />}
        accion={
          <AccionFija>
            <BotonEnlace href={RUTAS.inicio.ruta}>Volver al inicio</BotonEnlace>
          </AccionFija>
        }
      >
        <Chip tono={listo.estado === 'verificado' ? 'exito' : 'azul'} icono={listo.estado === 'verificado' ? 'check' : 'reloj'}>
          {ESTADO[listo.estado]}
        </Chip>
        <Titulo antes="Informaste " marcado={textoCifra(listo.informado?.centavos ?? listo.monto.centavos)} tam="medio" />
        <p>{`Queda «informado por vos» hasta que ${nombre} lo confirma o se verifica el pago. Recién ahí suma a tu camino.`}</p>
        <p className="nu-nota">El informe del trabajo (fotos, garantía y conformidad del cliente) llega con el Modo trabajo.</p>
        <BotonEnlace variante="contorno" href={volver}>
          Ver el trabajo
        </BotonEnlace>
      </PantallaSecundaria>
    );
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="¿Cómo te pagó?" subtitulo={titulo} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <Boton ocupado={informe.pendiente} textoOcupado="Informando…" onClick={() => void informar()}>
            Informar el cobro
          </Boton>
        </AccionFija>
      }
    >
      <Tarjeta tono="azul">
        <Etiqueta claro>Acordado</Etiqueta>
        <Cifra centavos={cobro.monto.centavos} tam="grande" />
        <span className="nu-cobro__sub">Recibís el 100 %: directo a vos</span>
      </Tarjeta>
      <Segmento<MetodoCobro> etiqueta="¿Cómo te pagó?" valor={metodo} onCambio={setMetodo} opciones={METODOS} />
      <div className="nu-campo-seg">
        <p className="nu-campo-seg__rotulo" aria-hidden="true">
          ¿Cobraste todo?
        </p>
        <Segmento<'todo' | 'parte'>
          etiqueta="¿Cobraste todo?"
          valor={todo}
          onCambio={setTodo}
          opciones={[
            { valor: 'todo', texto: `Sí, ${textoCifra(cobro.monto.centavos)}` },
            { valor: 'parte', texto: 'Una parte' },
          ]}
        />
      </div>
      {todo === 'parte' ? <Campo etiqueta="¿Cuánto te pagó?" prefijo="$" inputMode="numeric" autoComplete="off" value={parte} onChange={(e) => setParte(e.target.value)} error={error} ayuda="Lo que falta lo podés informar después." /> : null}
      {error && todo === 'todo' ? <p className="nu-nota nu-nota--error">{error}</p> : null}
      <p className="nu-nota">{`Queda «informado por vos» hasta que ${nombre} lo confirma o se verifica el pago. Recién ahí suma a tu camino.`}</p>
      {informe.fallo ? <ErrorCaja fallo={informe.fallo} onReintentar={() => void informar()} /> : null}
    </PantallaSecundaria>
  );
}
