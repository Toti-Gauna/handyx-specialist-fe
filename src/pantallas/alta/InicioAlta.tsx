'use client';
// Inicio del alta (lote 4.4): "Completá tu alta" con anillo de progreso y la lista de pasos, al estilo de las apps de
// reparto. En corrección, lo marcado por Operations va primero y con acceso directo.
import Link from 'next/link';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { Aviso } from '../../components/ui.tsx';
import type { PerfilEspecialista } from '../../contracts/dto.ts';
import { progresoAlta, type ItemAlta } from '../../lib/alta.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { AnilloProgreso, BotonFijo } from '../../kit/Piezas.tsx';
import { ChipItem, useIrA } from './comunes.tsx';

export function InicioAlta({ perfil, items }: { perfil: PerfilEspecialista; items: ItemAlta[] }) {
  const ir = useIrA();
  const { hechos, total } = progresoAlta(items);
  const corregir = items.filter((i) => i.estado === 'corregir');
  const enCorreccion = perfil.estadoAlta === 'requiere_correccion';

  return (
    <div className="al-inicio">
      <BarraSuperior
        titulo="Tu alta"
        acciones={
          <>
            <Link className="hx-circulo" href={RUTAS.soporte.ruta} aria-label="Ayuda">
              <Icono nombre="pregunta" />
            </Link>
            <Link className="hx-circulo" href={RUTAS.cuenta.ruta} aria-label="Tu cuenta">
              <Icono nombre="usuario" />
            </Link>
          </>
        }
      />
      <section className="al-progreso" aria-labelledby="al-progreso-t">
        <AnilloProgreso hechos={hechos} total={total} />
        <div>
          <h2 id="al-progreso-t" className="hx-titulo al-progreso__titulo">
            {enCorreccion ? (
              <>
                Hay que <span className="hx-marca">corregir</span> algo
              </>
            ) : (
              <>
                Completá tu <span className="hx-marca">alta</span>
              </>
            )}
          </h2>
          <p className="al-progreso__texto">Se guarda en cada paso: podés dejarlo y seguir después. Operations la revisa cuando la envíes.</p>
        </div>
      </section>

      {enCorreccion ? (
        <Aviso tono="aviso" icono="alerta" titulo="Operations te pidió una corrección" role="status">
          {perfil.motivoRevision ?? 'Revisá lo marcado.'}
          {corregir.length > 0 ? (
            <ul className="al-corregir">
              {corregir.map((i) => (
                <li key={i.paso}>
                  <button type="button" className="enlace" onClick={() => ir(i.paso)}>
                    Corregir: {i.titulo}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Ya corregiste lo marcado: revisá y volvé a enviar el alta.</p>
          )}
        </Aviso>
      ) : null}

      <ol className="al-lista">
        {items.map((i) => (
          <li key={i.paso}>
            <button type="button" className={`al-item al-item--${i.estado}`} onClick={() => ir(i.paso)}>
              <span className="al-item__ico" aria-hidden="true">
                <Icono nombre={i.icono} />
              </span>
              <span className="al-item__texto">
                <strong>{i.titulo}</strong>
                <span>{i.detalle}</span>
              </span>
              <ChipItem estado={i.estado} />
            </button>
          </li>
        ))}
      </ol>

      <BotonFijo nota={perfil.faltantesEnvio.length > 0 ? 'Podés revisar lo que cargaste aunque falten pasos.' : undefined}>
        <button type="button" className="boton boton--bloque" onClick={() => ir('resumen')}>
          {enCorreccion ? 'Revisar y volver a enviar' : 'Revisar y enviar'}
        </button>
      </BotonFijo>
    </div>
  );
}
