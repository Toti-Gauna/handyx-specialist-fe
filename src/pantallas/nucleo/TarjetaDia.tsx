'use client';
// Tu día en el Inicio (F-InicioDia): las paradas de hoy en una tira y la próxima con el cliente, el tramo (orientativo,
// nunca una promesa), escribirle, avisar una demora y salir para allá. Avisar una demora lo manda el especialista con un
// toque; nada se manda solo.
import { api } from '@handyx/origen-datos';
import { useState, type ReactNode } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { Dia } from '../../contracts/agenda.ts';
import { DEMORAS_MINUTOS } from '../../contracts/modo-trabajo.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { Avatar } from '../../ui/atomos/Avatar.tsx';
import { Boton, BotonEnlace, BotonIcono, BotonIconoEnlace } from '../../ui/atomos/Boton.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { textoCifra } from '../../ui/logica.ts';
import { textoMinutos } from '../../ui/logicaNucleo.ts';
import { TiraParadas } from '../../ui/moleculas/Paradas.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { ErrorCaja } from '../../components/Estados.tsx';
import { aParadaUi } from './vista.ts';

export function TarjetaDia({ dia, ahora, conversacionId, ocupado, onSalir, falloSalir }: { dia: Dia; ahora: Date; conversacionId: string | null; ocupado: boolean; onSalir(trabajoId: string): void; falloSalir: ReactNode }) {
  const isla = useIsla();
  const demora = useAccion();
  const [avisar, setAvisar] = useState(false);
  const proxima = dia.paradas.find((p) => p.estado === 'proxima') ?? null;
  const t = proxima?.turno ?? null;
  const cantidad = dia.paradas.length;

  async function mandarDemora(minutos: (typeof DEMORAS_MINUTOS)[number]) {
    if (!t?.trabajoId) return;
    const id = t.trabajoId;
    const r = await demora.ejecutar(() => api.avisarDemora(id, { minutos }, demora.clave()));
    if (r.ok) {
      setAvisar(false);
      isla({ titulo: 'Avisaste la demora', texto: `${t.cliente?.nombre ?? 'El cliente'} ve en el chat que llegás ${minutos} minutos tarde.`, icono: 'reloj' });
    }
  }

  return (
    <section className="nu-dia" aria-labelledby="nu-dia-titulo">
      <div className="nu-dia__arriba">
        <Etiqueta como="h2">
          <span id="nu-dia-titulo">{`Tu día · ${cantidad} ${cantidad === 1 ? 'parada' : 'paradas'}`}</span>
        </Etiqueta>
        <BotonEnlace variante="texto" bloque={false} chico href={RUTAS.recorrido.ruta}>
          Ver recorrido
        </BotonEnlace>
      </div>
      <TiraParadas paradas={dia.paradas.map((p) => aParadaUi(p, ahora, true))} />
      {proxima && t ? (
        <div className="nu-dia__proxima">
          <div className="nu-dia__quien">
            {t.cliente ? <Avatar nombre={t.cliente.nombre} /> : <span className="nu-dia__ico" aria-hidden="true"><Icono nombre="tienda" /></span>}
            <span className="nu-dia__texto">
              <strong>{t.titulo}</strong>
              <span>{[t.cliente?.nombre, t.barrio, t.monto ? textoCifra(t.monto.centavos) : null].filter(Boolean).join(' · ')}</span>
            </span>
            {proxima.tramo ? (
              <span className="nu-dia__tramo">
                <strong>{textoMinutos(proxima.tramo.duracionS)}</strong>
                <span>en auto</span>
              </span>
            ) : null}
          </div>
          {falloSalir}
          <div className="nu-dia__acciones">
            {conversacionId ? <BotonIconoEnlace icono="chat" href={`${RUTAS.hilo.ruta}?id=${conversacionId}`} etiqueta={`Escribirle a ${t.cliente?.nombre ?? 'el cliente'}`} /> : null}
            {t.trabajoId ? <BotonIcono icono="reloj" etiqueta="Avisar una demora" onClick={() => setAvisar(true)} /> : null}
            {t.trabajoId ? (
              <Boton icono="camion" ocupado={ocupado} textoOcupado="Saliendo…" onClick={() => t.trabajoId && onSalir(t.trabajoId)}>
                Salir ahora
              </Boton>
            ) : (
              <BotonEnlace href={RUTAS.recorrido.ruta}>Ver la parada</BotonEnlace>
            )}
          </div>
        </div>
      ) : (
        <p className="nu-dia__listo">Terminaste las paradas de hoy.</p>
      )}
      <Hoja abierta={avisar} titulo="Avisar una demora" onCerrar={() => setAvisar(false)}>
        <p>Le mandamos a {t?.cliente?.nombre ?? 'tu cliente'} un aviso en el chat del trabajo. No cambia el horario acordado.</p>
        {demora.fallo ? <ErrorCaja fallo={demora.fallo} /> : null}
        <div className="nu-dos">
          {DEMORAS_MINUTOS.map((m) => (
            <Boton key={m} variante="contorno" ocupado={demora.pendiente} onClick={() => void mandarDemora(m)}>
              {`Llego ${m} min tarde`}
            </Boton>
          ))}
        </div>
      </Hoja>
    </section>
  );
}
