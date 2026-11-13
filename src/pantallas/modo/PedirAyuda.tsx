'use client';
// Pedir ayuda (H0-ModoAyuda, lote 2.3): sin salir del trabajo, llamás o le escribís a un contacto profesional, lo sumás
// a este trabajo (una invitación: el reparto se acuerda aparte) o buscás un profesional nuevo. La llamada sale por un
// número puente: nadie ve el teléfono del otro. De cada contacto se ve su estado solo si lo comparte; nunca dónde está.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { LlamadaPuente } from '../../contracts/dto.ts';
import type { ContactoProfesional } from '../../contracts/equipo.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { hora } from '../../lib/formato.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { estadoContacto, tituloTrabajo } from '../../ui/logicaModo.ts';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { FilaContacto } from '../../ui/moleculas/FilaContacto.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga } from './comunes.tsx';

const TITULO = 'Pedir ayuda';
/** Buscar un profesional nuevo es de la ola 3 (F-ObraBuscar); mientras tanto, lleva a tus obras. */
const BUSCAR_PROFESIONAL = RUTAS.trabajos.ruta;

export function PedirAyuda() {
  const id = useIdDeUrl();
  const c = useCarga(
    async () =>
      id
        ? {
            detalle: await api.trabajo(id),
            contactos: await api.contactosProfesionales(),
          }
        : null,
    [id],
  );
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  return (
    <Ayuda trabajoId={id} titulo={tituloTrabajo(c.datos.detalle.trabajo.acuerdo.alcance)} activo={['en_sitio', 'en_curso'].includes(c.datos.detalle.trabajo.estado)} contactos={c.datos.contactos} />
  );
}

function Ayuda({ trabajoId, titulo, activo, contactos }: { trabajoId: string; titulo: string; activo: boolean; contactos: ContactoProfesional[] }) {
  const router = useRouter();
  const isla = useIsla();
  const chat = useAccion();
  const llamada = useAccion();
  const sumar = useAccion();
  const [llamando, setLlamando] = useState<{
    c: ContactoProfesional;
    puente: LlamadaPuente | null;
  } | null>(null);
  const [sumando, setSumando] = useState<ContactoProfesional | null>(null);

  async function escribir(c: ContactoProfesional) {
    const r = await chat.ejecutar(() => api.abrirChatContacto(c.id));
    if (!r.ok) return;
    if (r.valor.conversacionId) router.push(`${RUTAS.hilo.ruta}?id=${r.valor.conversacionId}`);
    else {
      isla({
        titulo: `Chat con ${c.profesional.nombre}`,
        texto: 'Lo encontrás en Mensajes',
        icono: 'chat',
      });
      router.push(RUTAS.mensajes.ruta);
    }
  }
  async function llamar(c: ContactoProfesional) {
    setLlamando({ c, puente: null });
    const r = await llamada.ejecutar(() => api.llamadaContacto(c.id));
    if (r.ok) setLlamando({ c, puente: r.valor });
  }
  async function confirmarSumar(c: ContactoProfesional) {
    const rubro = c.profesional.rubros[0];
    if (!rubro) return;
    const r = await sumar.ejecutar(() => api.sumarAyuda(trabajoId, { contactoId: c.id, rubro }));
    if (r.ok) {
      setSumando(null);
      isla({
        titulo: `Invitaste a ${c.profesional.nombre}`,
        texto: 'Se suma cuando acepta. El reparto lo acuerdan aparte.',
        icono: 'check',
      });
    }
  }

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo={TITULO} subtitulo={titulo} hrefVolver={conId('modoTrabajo', trabajoId)} />}>
      <Encabezado nivel={2} tam="medio" etiqueta="Sin salir del trabajo" antes="¿A quién " marcado="llamás" despues="?" />
      <Tarjeta etiqueta="Tus contactos">
        <h2 className="mt-subtitulo">Tus contactos</h2>
        {contactos.length === 0 ? (
          <p className="mt-nota">Todavía no tenés contactos profesionales. Se suman cuando trabajan juntos en una obra o desde un chat.</p>
        ) : (
          <ul className="mt-lista">
            {contactos.map((c) => {
              const oficio = c.profesional.rubros.map((r) => NOMBRE_RUBRO[r]).join(' y ') || 'Profesional';
              return (
                <FilaContacto
                  key={c.id}
                  nombre={c.profesional.nombre}
                  oficio={oficio}
                  estado={estadoContacto(c)}
                  ocupado={chat.pendiente}
                  onEscribir={() => void escribir(c)}
                  onLlamar={() => void llamar(c)}
                  extra={
                    activo ? (
                      <Boton variante="contorno" chico icono="usuario2" onClick={() => setSumando(c)}>
                        {`Sumar a ${c.profesional.nombre.split(' ')[0]} a este trabajo`}
                      </Boton>
                    ) : null
                  }
                />
              );
            })}
          </ul>
        )}
        {chat.fallo ? <ErrorCaja fallo={chat.fallo} /> : null}
      </Tarjeta>
      <Tarjeta>
        <FilaIcono icono="lupa" titulo="Buscar un profesional nuevo" detalle="Lo ven solo verificados de la zona" href={BUSCAR_PROFESIONAL} />
        <FilaIcono icono="herramienta" titulo="Consultar al Taller" detalle="Calculadoras y referencias del oficio" href={RUTAS.taller.ruta} />
      </Tarjeta>

      <Hoja abierta={llamando !== null} titulo={llamando ? `Llamar a ${llamando.c.profesional.nombre}` : 'Llamar'} onCerrar={() => setLlamando(null)}>
        <p>La llamada sale por un número de Handyx: ninguno de los dos ve el teléfono del otro.</p>
        {llamada.fallo && llamando ? <ErrorCaja fallo={llamada.fallo} onReintentar={() => void llamar(llamando.c)} /> : null}
        {llamando?.puente ? (
          <>
            <p className="mt-nota">{`El número sirve hasta las ${hora(llamando.puente.venceEn)}.`}</p>
            <a className="ui-boton ui-boton--primaria ui-boton--bloque" href={`tel:${llamando.puente.telefono}`}>
              <span className="ui-boton__texto">{`Llamar a ${llamando.c.profesional.nombre}`}</span>
            </a>
            <Boton variante="texto" onClick={() => llamando && void escribir(llamando.c)}>
              Mejor le escribo
            </Boton>
          </>
        ) : !llamada.fallo ? (
          <p role="status">Preparando la llamada…</p>
        ) : null}
      </Hoja>

      <Hoja
        abierta={sumando !== null}
        titulo="¿Lo sumás a este trabajo?"
        onCerrar={() => {
          setSumando(null);
          sumar.limpiar();
        }}
        pie={
          sumando ? (
            <div className="mt-pie">
              <Boton ocupado={sumar.pendiente} textoOcupado="Invitando…" onClick={() => void confirmarSumar(sumando)}>
                {`Invitar a ${sumando.profesional.nombre}`}
              </Boton>
              <Boton variante="texto" onClick={() => setSumando(null)}>
                Todavía no
              </Boton>
            </div>
          ) : null
        }
      >
        {sumando ? (
          <p>{`Le llega una invitación para este trabajo como ${sumando.profesional.rubros.map((r) => NOMBRE_RUBRO[r]).join(' y ')}. Se suma cuando acepta; el reparto del pago lo acuerdan aparte (Handyx no toca la plata).`}</p>
        ) : null}
        {sumar.fallo ? <ErrorCaja fallo={sumar.fallo} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}
