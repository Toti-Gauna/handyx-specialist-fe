'use client';
// Antes y después (H0-AntesDespues y H0-AntesLado con ?vista=lado, lote 2.3): las dos fotos para comparar, deslizando
// la manija (o con los botones) o lado a lado, y «qué cambiaste», escrito o dictado con el micrófono del teclado. Las
// fotos se achican y pierden la ubicación en el teléfono antes de subirse. Todo se suma solo al informe.
import { api, camaraPrueba } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { AntesDespues as Datos, ModoTrabajo } from '../../contracts/modo-trabajo.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { hora } from '../../lib/formato.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { hoyBA, tituloTrabajo } from '../../ui/logicaModo.ts';
import { fechaBA, nombreDia } from '../../ui/logicaNucleo.ts';
import { BotonFoto } from '../../ui/moleculas/BotonFoto.tsx';
import { Comparador, FotosLado } from '../../ui/moleculas/Comparador.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga } from './comunes.tsx';

const TITULO = 'Antes y después';
const simulada = camaraPrueba !== null;
type Vista = 'deslizar' | 'lado';

export function AntesDespues() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, ad, modo, informe] = await Promise.all([api.trabajo(id), api.antesDespues(id), api.modoTrabajo(id), api.informeTrabajo(id)]);
    return { detalle, ad, modo, enviado: informe.enviadoEn !== null };
  }, [id]);
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  return <Pantalla trabajoId={id} titulo={tituloTrabajo(c.datos.detalle.trabajo.acuerdo.alcance)} ad={c.datos.ad} modo={c.datos.modo} enviado={c.datos.enviado} recargar={c.recargar} />;
}

function Pantalla({ trabajoId, titulo, ad, modo, enviado, recargar }: { trabajoId: string; titulo: string; ad: Datos; modo: ModoTrabajo; enviado: boolean; recargar(): Promise<void> }) {
  const router = useRouter();
  const q = useSearchParams();
  const isla = useIsla();
  const [vista, setVista] = useState<Vista>(q.get('vista') === 'lado' ? 'lado' : 'deslizar');
  const [agregar, setAgregar] = useState(false);
  const foto = useAccion();
  const guardar = useAccion();
  const puedeFotos = modo.estado !== 'terminado';
  const editable = !enviado;

  function cambiarVista(v: Vista) {
    setVista(v);
    router.replace(conId('antesDespues', trabajoId, v === 'lado' ? '&vista=lado' : ''), { scroll: false });
  }

  async function sacar(momento: 'antes' | 'despues', archivo: File | null) {
    const r = await foto.ejecutar(async () => {
      // Se achica y se vuelve a codificar en el teléfono: así se borran la ubicación y los datos del celular.
      await api.subirFotoTrabajo(trabajoId, archivo ? await prepararFoto(archivo) : null, momento, foto.clave());
      await recargar();
    });
    if (r.ok) isla({ titulo: momento === 'antes' ? 'Guardaste la foto del antes' : 'Guardaste la foto del después', icono: 'camara' });
  }

  async function guardarCambios(cambios: Datos['cambios'], aviso: string) {
    const r = await guardar.ejecutar(async () => {
      await api.guardarAntesDespues(trabajoId, { antesFotoId: ad.antes?.id ?? null, despuesFotoId: ad.despues?.id ?? null, cambios, version: ad.version });
      await recargar();
    });
    if (r.ok) isla({ titulo: aviso, icono: 'check' });
    else if (r.fallo.tipo === 'conflicto') await recargar();
    return r.ok;
  }

  async function sumarAlInforme() {
    // Deja elegidas las dos fotos que se ven (la última de cada momento) y pasa al informe.
    const r = await guardar.ejecutar(() => api.guardarAntesDespues(trabajoId, { antesFotoId: ad.antes?.id ?? null, despuesFotoId: ad.despues?.id ?? null, cambios: ad.cambios, version: ad.version }));
    if (r.ok) router.push(conId('informeTrabajo', trabajoId));
  }

  const hoy = hoyBA(api.ahora());
  const pie = (en: string) => { const d = nombreDia(fechaBA(en), hoy); return `${d.charAt(0).toUpperCase()}${d.slice(1)} · ${hora(en)}`; };
  const rotulo = (m: 'Antes' | 'Después', en: string) => ({ rotulo: `${m} · ${hora(en)}`, alt: `Foto del ${m.toLowerCase()}, de las ${hora(en)}` });
  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={TITULO} subtitulo={titulo} hrefVolver={conId('modoTrabajo', trabajoId)} />}
      accion={
        <AccionFija>
          {editable ? (
            <Boton icono="escudo" ocupado={guardar.pendiente} textoOcupado="Guardando…" onClick={() => void sumarAlInforme()}>
              Sumar al informe
            </Boton>
          ) : (
            <Boton icono="escudo" onClick={() => router.push(conId('informeTrabajo', trabajoId))}>
              Ver el informe
            </Boton>
          )}
        </AccionFija>
      }
    >
      <Segmento<Vista>
        etiqueta="Cómo ver las fotos"
        valor={vista}
        onCambio={cambiarVista}
        opciones={[
          { valor: 'deslizar', texto: 'Deslizar' },
          { valor: 'lado', texto: 'Lado a lado' },
        ]}
      />
      {ad.antes && ad.despues ? (
        vista === 'deslizar' ? (
          <Comparador antes={{ url: ad.antes.url, ...rotulo('Antes', ad.antes.en) }} despues={{ url: ad.despues.url, ...rotulo('Después', ad.despues.en) }} />
        ) : (
          <FotosLado antes={{ url: ad.antes.url, ...rotulo('Antes', ad.antes.en), pie: pie(ad.antes.en) }} despues={{ url: ad.despues.url, ...rotulo('Después', ad.despues.en), pie: pie(ad.despues.en) }} />
        )
      ) : (
        <Tarjeta tono="gris">
          <p className="mt-falta">
            <Icono nombre="camara" />
            {!ad.antes && !ad.despues ? 'Todavía no hay fotos. Sacá la del antes al empezar y la del después al terminar.' : !ad.antes ? 'Falta la foto del antes.' : 'Falta la foto del después.'}
          </p>
        </Tarjeta>
      )}
      {puedeFotos && editable ? (
        <div className="mt-dos">
          <BotonFoto simulada={simulada} variante={ad.antes ? 'contorno' : 'primaria'} chico ocupado={foto.pendiente} onFoto={(f) => void sacar('antes', f)}>
            {ad.antes ? 'Otra foto del antes' : 'Foto del antes'}
          </BotonFoto>
          <BotonFoto simulada={simulada} variante={ad.despues || !ad.antes ? 'contorno' : 'primaria'} chico ocupado={foto.pendiente} onFoto={(f) => void sacar('despues', f)}>
            {ad.despues ? 'Otra foto del después' : 'Foto del después'}
          </BotonFoto>
        </div>
      ) : null}
      {foto.fallo ? <ErrorCaja fallo={foto.fallo} /> : null}
      <p className="mt-nota">Las fotos se achican y pierden la ubicación en tu teléfono antes de subirse.</p>

      <Tarjeta etiqueta="Qué cambiaste">
        <div className="mt-cabeza-lista">
          <Etiqueta como="h2">Qué cambiaste</Etiqueta>
          {editable && ad.cambios.length < 10 ? (
            <Boton variante="texto" chico bloque={false} icono="mas" onClick={() => setAgregar(true)}>
              Agregar
            </Boton>
          ) : null}
        </div>
        {ad.cambios.length === 0 ? <p className="mt-nota">Contá en pocas palabras qué cambiaste: lo lee el cliente en el informe.</p> : null}
        <ol className="mt-cambios">
          {ad.cambios.map((x, i) => (
            <li key={`${x.titulo}-${i}`}>
              <span className="mt-cambios__n" aria-hidden="true">
                {i + 1}
              </span>
              <span className="mt-cambios__texto">
                <strong>{x.titulo}</strong>
                {x.detalle ? <span>{x.detalle}</span> : null}
              </span>
              {editable ? (
                <Boton variante="texto" chico bloque={false} disabled={guardar.pendiente} onClick={() => void guardarCambios(ad.cambios.filter((_, j) => j !== i), 'Quitaste el cambio')}>
                  {`Quitar: ${x.titulo}`}
                </Boton>
              ) : null}
            </li>
          ))}
        </ol>
        {editable ? (
          <p className="mt-nota mt-dictar">
            <Icono nombre="micro" />
            Podés dictarlo con el micrófono del teclado: se escribe solo.
          </p>
        ) : null}
        {guardar.fallo && !agregar ? <ErrorCaja fallo={guardar.fallo} /> : null}
      </Tarjeta>

      <HojaCambio abierta={agregar} ocupado={guardar.pendiente} fallo={agregar ? guardar.fallo : null} onCerrar={() => setAgregar(false)} onGuardar={async (cambio) => (await guardarCambios([...ad.cambios, cambio], 'Sumaste el cambio')) && setAgregar(false)} />
    </PantallaSecundaria>
  );
}

function HojaCambio({ abierta, ocupado, fallo, onCerrar, onGuardar }: { abierta: boolean; ocupado: boolean; fallo: ReturnType<typeof useAccion>['fallo']; onCerrar(): void; onGuardar(c: Datos['cambios'][number]): Promise<unknown> }) {
  const [titulo, setTitulo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return setError('Escribí qué cambiaste, por ejemplo «Cartucho nuevo».');
    setError(null);
    await onGuardar({ titulo: titulo.trim(), detalle: detalle.trim() || null });
    setTitulo('');
    setDetalle('');
  }
  return (
    <Hoja
      abierta={abierta}
      titulo="¿Qué cambiaste?"
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form="mt-form-cambio" ocupado={ocupado} textoOcupado="Guardando…">
          Sumar el cambio
        </Boton>
      }
    >
      <form id="mt-form-cambio" className="mt-form" onSubmit={(e) => void enviar(e)} noValidate>
        <Campo etiqueta="Qué cambiaste" value={titulo} maxLength={80} autoComplete="off" onChange={(e) => setTitulo(e.target.value)} error={error} ayuda="Ej.: Cartucho nuevo" />
        <AreaTexto etiqueta="Detalle (si querés)" valor={detalle} onCambio={setDetalle} maximo={280} ayuda="Para dictar, tocá el micrófono del teclado." />
      </form>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
    </Hoja>
  );
}
