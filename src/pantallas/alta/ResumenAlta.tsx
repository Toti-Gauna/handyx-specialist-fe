'use client';
// Resumen del alta (lote 4.4): cada paso con su estado y "Corregir" o "Completar", que lleva directo al paso. Enviar queda
// deshabilitado mientras falte algo, y dice qué.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Aviso, Dato } from '../../components/ui.tsx';
import type { DatosAlta, PerfilEspecialista } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import type { ItemAlta } from '../../lib/alta.ts';
import { FALTANTE } from '../../lib/etiquetas.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { BotonFijo } from '../../kit/Piezas.tsx';
import { ChipItem, useIrA } from './comunes.tsx';

const ACCION = { listo: 'Ver', revision: 'Ver', falta: 'Completar', corregir: 'Corregir', opcional: 'Completar' } as const;

export function ResumenAlta({ perfil, datos, items, recargar }: { perfil: PerfilEspecialista; datos: DatosAlta; items: ItemAlta[]; recargar(): Promise<void> }) {
  const ir = useIrA();
  const isla = useIsla();
  const { pendiente, fallo, ejecutar } = useAccion();
  const faltan = perfil.faltantesEnvio;

  async function enviar() {
    const r = await ejecutar(async () => {
      await api.enviarAlta();
      await recargar();
    });
    if (r.ok) {
      isla({ titulo: 'Enviaste tu alta', texto: 'Operations la va a revisar. Te avisamos cuando haya novedades.', icono: 'enviar', tono: 'exito' });
      ir(null);
    }
  }

  return (
    <div className="al-paso">
      <BarraSuperior titulo="Revisá tu alta" atras={RUTAS.alta.ruta} textoAtras="Volver a la lista del alta" acciones={null} />
      <ul className="al-resumen">
        {items.map((i) => (
          <li key={i.paso} className={`al-resumen__fila al-item--${i.estado}`}>
            <span className="al-resumen__texto">
              <strong>{i.titulo}</strong>
              <span>{i.detalle}</span>
            </span>
            <ChipItem estado={i.estado} />
            <button type="button" className="boton boton--claro boton--chico" onClick={() => ir(i.paso)} aria-label={`${ACCION[i.estado]}: ${i.titulo}`}>
              {ACCION[i.estado]}
            </button>
          </li>
        ))}
      </ul>

      <section className="tarjeta" aria-label="Tus datos">
        <dl>
          <Dato etiqueta="Nombre" valor={datos.nombre && datos.apellido ? `${datos.nombre} ${datos.apellido}` : 'Falta'} />
          <Dato etiqueta="Ciudad" valor={datos.ciudad ?? 'Falta'} />
          <Dato etiqueta="DNI" valor={datos.dniUltimos ?? 'Falta'} />
          <Dato etiqueta="CUIT o CUIL" valor={datos.cuitCuilUltimos ?? 'Falta'} />
          <Dato etiqueta="Rubros" valor={perfil.rubros.length ? perfil.rubros.map((r) => NOMBRE_RUBRO[r.rubro]).join(', ') : 'Falta'} />
        </dl>
      </section>

      {faltan.length > 0 ? (
        <Aviso tono="aviso" icono="alerta" titulo="Para enviarla todavía falta" role="status">
          {faltan.map((f) => FALTANTE[f]).join(', ')}.
        </Aviso>
      ) : (
        <Aviso tono="exito" icono="checkCirculo">
          Está todo para enviar. Mientras Operations la revisa no vas a poder editarla. La zona, los horarios y el turno se pueden completar después.
        </Aviso>
      )}
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}

      <BotonFijo>
        <button type="button" className="boton boton--bloque" disabled={pendiente || faltan.length > 0} onClick={() => void enviar()}>
          {pendiente ? 'Enviando…' : perfil.estadoAlta === 'requiere_correccion' ? 'Volver a enviar mi alta' : 'Enviar mi alta a revisión'}
        </button>
      </BotonFijo>
    </div>
  );
}
