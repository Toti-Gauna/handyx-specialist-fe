// GPS simulado de la vista previa (lote 4.3). Avanza por el trayecto del viaje que se está compartiendo (o en línea recta
// hacia el destino si no hay trayecto) y da la señal que se elija en el Panel de prueba. No lee el GPS del teléfono.
import { desplazar, distanciaM, proyectar, puntoEn, rumbo } from '../../lib/geo.ts';
import type { FuenteUbicacion } from '../../lib/ubicacion.ts';
import type { EstadoMock } from './estado.ts';

const TICK_MS = 1000;
/** 30 km/h; con "rápido", 180 km/h (para recorrer el viaje en segundos en las pruebas). */
const METROS_POR_TICK = 30_000 / 3600;
const FACTOR_RAPIDO = 6;
const DESVIO_M = 150;
const LLEGADA_M = 15;

export function crearGpsSimulado(s: EstadoMock): FuenteUbicacion {
  return {
    async permiso() {
      return s.gps.senal === 'sin_permiso' ? 'denegado' : 'preguntar';
    },
    observar(alLeer, alFallar) {
      let ultimoTrayecto = -1;
      const paso = () => {
        const g = s.gps;
        if (g.senal === 'sin_permiso') return alFallar('permiso');
        if (g.senal === 'sin_senal') return alFallar('tiempo');
        const activo = s.trabajos.find((t) => t.trabajo.estado === 'en_camino' && t.trabajo.destino && s.viajes.get(t.trabajo.id)?.estado === 'compartiendo');
        const destino = activo?.trabajo.destino ?? null;
        const viaje = activo ? s.viajes.get(activo.trabajo.id) : undefined;
        const metros = METROS_POR_TICK * (g.rapido ? FACTOR_RAPIDO : 1);
        if (g.desviar) {
          // Se va de costado del trayecto; se queda ahí hasta que el servidor recalcula (2 posiciones fuera).
          const hacia = viaje?.trayecto ? rumbo(g.posicion, puntoEn(viaje.trayecto.linea, proyectar(viaje.trayecto.linea, g.posicion).recorridoM + 50)) : 0;
          g.posicion = desplazar(g.posicion, DESVIO_M, hacia + 90);
          g.desviar = false;
          ultimoTrayecto = viaje?.trayecto?.version ?? -1;
        } else if (destino && distanciaM(g.posicion, destino) > LLEGADA_M) {
          const t = viaje?.trayecto;
          if (t && (t.version !== ultimoTrayecto || proyectar(t.linea, g.posicion).distanciaM < 30)) {
            ultimoTrayecto = t.version;
            g.posicion = puntoEn(t.linea, proyectar(t.linea, g.posicion).recorridoM + metros);
          } else if (!t) {
            const falta = distanciaM(g.posicion, destino);
            g.posicion = falta <= metros ? destino : desplazar(g.posicion, metros, rumbo(g.posicion, destino));
          }
        }
        const imprecisa = g.senal === 'imprecisa';
        // Con señal imprecisa la lectura salta alrededor de la posición real, como un GPS bajo techo.
        const punto = imprecisa ? desplazar(g.posicion, 120 + Math.random() * 120, Math.random() * 360) : g.posicion;
        alLeer({ punto, precisionM: imprecisa ? 250 : 8 + Math.random() * 6, enMs: Date.now() });
      };
      // Como el GPS real, la primera lectura llega después de pedirla (nunca en el mismo instante).
      const primera = setTimeout(paso, 0);
      const id = setInterval(paso, TICK_MS);
      return () => {
        clearTimeout(primera);
        clearInterval(id);
      };
    },
  };
}
