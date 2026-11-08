'use client';
// Tu recorrido (F-InicioRuta, lote 1.3): las paradas de hoy en orden con la hora, el tramo entre una y otra (orientativo:
// nunca una promesa al cliente) y botones para subir o bajar una parada. Reordenar cambia solo tu recorrido: no le cambia
// el horario a ningún cliente. Abajo, salir para la próxima parada.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { BotonIconoEnlace, Boton, BotonEnlace } from '../ui/atomos/Boton.tsx';
import { Chip, Titulo } from '../ui/atomos/Texto.tsx';
import { textoDistancia } from '../ui/logica.ts';
import { moverEnLista } from '../ui/logicaNucleo.ts';
import { ListaParadas, RutaDecorativa, type ParadaUi } from '../ui/moleculas/Paradas.tsx';
import { PantallaFallo } from './nucleo/Fallo.tsx';
import { aParadaUi, horaBA } from './nucleo/vista.ts';
import './nucleo/nucleo.css';

export function Recorrido() {
  const router = useRouter();
  const ahora = useAhora(30_000);
  const c = useCarga(() => api.dia(), []);
  const orden = useAccion();
  const salir = useAccion();
  const proxima = c.datos?.paradas.find((p) => p.estado === 'proxima') ?? null;
  const trabajo = useCarga(() => (proxima?.turno.trabajoId ? api.trabajo(proxima.turno.trabajoId) : Promise.resolve(null)), [proxima?.turno.trabajoId]);

  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <div className="nu-ruta" aria-busy="true" />;
  const dia = c.datos;

  const paradas: ParadaUi[] = dia.paradas.map((p) => {
    const ui = aParadaUi(p, ahora);
    const nota =
      p.estado === 'hecha' ? (
        <Chip tono="exito" icono="check">
          Hecho
        </Chip>
      ) : p.opcional ? (
        <Chip tono="gris">Opcional</Chip>
      ) : ui.nota ? (
        <Chip tono="amarillo" icono="reloj">
          {ui.nota}
        </Chip>
      ) : undefined;
    return { ...ui, nota };
  });

  async function mover(i: number, sentido: -1 | 1) {
    const nuevo = moverEnLista(dia.paradas, i, sentido, (p) => p.estado === 'hecha');
    await orden.ejecutar(async () => {
      await api.ordenarDia({ turnos: nuevo.map((p) => p.turno.id), version: dia.version });
      await c.recargar();
    });
  }

  const t = trabajo.datos?.trabajo ?? null;
  const numero = proxima ? proxima.orden : null;
  async function salirAhora() {
    if (!t) return;
    const r = await salir.ejecutar(() => api.avanzarTrabajo(t.id, 'en_camino', t.version, salir.clave()));
    if (r.ok) router.push(`${RUTAS.enCamino.ruta}?id=${t.id}`);
    else if (r.fallo.tipo === 'conflicto') {
      salir.nueva();
      await trabajo.recargar();
    }
  }

  return (
    <div className="nu-ruta">
      <div className="nu-ruta__fondo" aria-hidden="true">
        <div className="ui-mapa-estilizado">
          <div className="ui-mapa-estilizado__manzanas" />
          <div className="ui-mapa-estilizado__costa" />
        </div>
        <RutaDecorativa paradas={paradas} />
      </div>
      <div className="nu-ruta__arriba">
        <BotonIconoEnlace icono="atras" etiqueta="Volver al inicio" href={RUTAS.inicio.ruta} />
        {dia.terminaA ? (
          <Chip tono="blanco">{`Terminás ${horaBA(dia.terminaA)} · ${textoDistancia(dia.distanciaDiaM)}`}</Chip>
        ) : null}
      </div>
      <section className="nu-ruta__hoja" aria-labelledby="nu-ruta-titulo">
        <div className="nu-ruta__cabeza">
          <span id="nu-ruta-titulo">
            <Titulo antes="Tu " marcado="recorrido" tam="medio" />
          </span>
          <span className="nu-ruta__mes">{`${textoDistancia(dia.distanciaMesM)} en el mes`}</span>
        </div>
        {dia.paradas.length === 0 ? (
          <p>Hoy no tenés paradas. Cuando el cliente acepte una propuesta para hoy, aparece acá.</p>
        ) : (
          <ListaParadas paradas={paradas} onMover={(i, s) => void mover(i, s)} ocupado={orden.pendiente} />
        )}
        <p className="nu-nota">Mover una parada cambia solo tu recorrido: no le cambia el horario a ningún cliente. Los tiempos son aproximados.</p>
        {orden.fallo ? <ErrorCaja fallo={orden.fallo} onReintentar={() => void c.recargar()} /> : null}
        {salir.fallo ? <ErrorCaja fallo={salir.fallo} /> : null}
        {t && t.estado === 'agendado' ? (
          <Boton icono="camion" ocupado={salir.pendiente} textoOcupado="Saliendo…" onClick={() => void salirAhora()}>
            {`Salir para la parada ${numero ?? ''}`.trim()}
          </Boton>
        ) : t && t.estado === 'en_camino' ? (
          <BotonEnlace icono="camion" href={`${RUTAS.enCamino.ruta}?id=${t.id}`}>
            Abrir el viaje
          </BotonEnlace>
        ) : null}
      </section>
    </div>
  );
}
