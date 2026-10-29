// Motor del mapa (lote 4.3): todo lo que toca MapLibre vive acá y se carga diferido desde Mapa.tsx, así el resto de la
// app no paga su peso. Capas propias: cobertura, zona aproximada, trayecto, precisión y marcadores HTML (destino,
// posición, radar y barrios). Con "reducir movimiento" no hay animaciones de cámara.
import { AttributionControl, getVersion, LngLatBounds, Map as MapaGl, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Barrio, Punto, ZonaMapa } from '../contracts/dto.ts';
import { circulo } from '../lib/geo.ts';
import { sinMovimiento } from '../kit/movimiento.ts';
import { COLORES_MAPA, estiloHandyx, type MetaTeselas } from './estilo.ts';

export interface CapasMapa {
  zona?: ZonaMapa | null;
  destino?: Punto | null;
  posicion?: { punto: Punto; precisionM: number } | null;
  trayecto?: readonly Punto[] | null;
  cobertura?: readonly Barrio[] | null;
  radar?: Punto | null;
}

export interface OpcionesMotor {
  contenedor: HTMLElement;
  /** Ruta base de la app (NEXT_PUBLIC_BASE_PATH). */
  base: string;
  interactivo: boolean;
  /** Nombre accesible del lienzo. */
  etiqueta: string;
  alFallar(motivo: 'webgl' | 'motor'): void;
  alCambiarBase(estado: 'sin_datos' | 'ok' | 'sin_conexion'): void;
}

export interface Motor {
  actualizar(capas: CapasMapa, encuadrar: boolean): void;
  /** Lo que tapa una hoja abajo, para que el encuadre no quede debajo. */
  margenAbajo(px: number): void;
  centrar(capas: CapasMapa): void;
  destruir(): void;
}

/** Mar del Plata y Batán con margen: la cámara no se va adonde no hay teselas. */
const LIMITES: [[number, number], [number, number]] = [
  [-58.0, -38.35],
  [-57.3, -37.7],
];
const CENTRO_MDP: [number, number] = [-57.5575, -38.0055];

const TEXTOS = {
  'Map.Title': 'Mapa',
  'NavigationControl.ZoomIn': 'Acercar',
  'NavigationControl.ZoomOut': 'Alejar',
  'NavigationControl.ResetBearing': 'Volver al norte',
  'AttributionControl.ToggleAttribution': 'Ver de dónde salen los datos del mapa',
  'AttributionControl.MapFeedback': 'Reportar un error del mapa',
  'ScrollZoomBlocker.CtrlMessage': 'Usá Ctrl y la rueda para acercar o alejar',
  'ScrollZoomBlocker.CmdMessage': 'Usá ⌘ y la rueda para acercar o alejar',
  'TouchPanBlocker.Message': 'Usá dos dedos para mover el mapa',
};

const geo = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features });
const anillo = (pts: readonly Punto[]): number[][] => pts.map((p) => [p.lng, p.lat]);
const poligono = (pts: readonly Punto[]): GeoJSON.Feature => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [anillo(pts)] } });

function elemento(clase: string, html = ''): HTMLElement {
  const e = document.createElement('div');
  e.className = clase;
  e.setAttribute('aria-hidden', 'true');
  e.innerHTML = html;
  return e;
}

const PIN = '<svg viewBox="0 0 40 48" width="40" height="48"><path d="M20 47s16-15.6 16-27A16 16 0 0 0 4 20c0 11.4 16 27 16 27z" fill="currentColor" stroke="#fff" stroke-width="3"/><path d="M13 22l7-6 7 6v7h-5v-4h-4v4h-5z" fill="#fff"/></svg>';

let metaCompartida: Promise<MetaTeselas | null> | null = null;
/** Una sola consulta por carga de la app, aunque haya varios mapas en la pantalla. */
const leerMeta = (base: string): Promise<MetaTeselas | null> => (metaCompartida ??= pedirMeta(base));

async function pedirMeta(base: string): Promise<MetaTeselas | null> {
  try {
    const r = await fetch(`${base}/mapa/meta.json`, { cache: 'no-cache', credentials: 'omit' });
    if (!r.ok) return null;
    const m = (await r.json()) as MetaTeselas;
    return m.version === 1 && Array.isArray(m.limites) ? m : null;
  } catch {
    return null;
  }
}

export async function crearMotor(o: OpcionesMotor): Promise<Motor | null> {
  const raiz = new URL(`${o.base}/`, location.href);
  setWorkerUrl(new URL(`mapa/motor/maplibre-gl-worker-${getVersion()}.js`, raiz).href);
  const meta = await leerMeta(o.base);
  const urlTeselas = meta ? new URL('mapa/teselas/{z}/{x}/{y}.pbf', raiz).href.replace('%7Bz%7D', '{z}').replace('%7Bx%7D', '{x}').replace('%7By%7D', '{y}') : null;
  o.alCambiarBase(meta ? 'ok' : 'sin_datos');

  let mapa: MapaGl;
  try {
    mapa = new MapaGl({
      container: o.contenedor,
      style: estiloHandyx(urlTeselas, meta),
      center: CENTRO_MDP,
      zoom: 13,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: LIMITES,
      interactive: o.interactivo,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      cooperativeGestures: false,
      attributionControl: false,
      fadeDuration: sinMovimiento() ? 0 : 200,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      locale: TEXTOS,
    });
  } catch {
    o.alFallar('webgl');
    return null;
  }
  mapa.getCanvas().setAttribute('aria-label', o.etiqueta);
  if (meta) mapa.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  if (o.interactivo) {
    mapa.touchZoomRotate.disableRotation();
    mapa.keyboard.disableRotation();
    mapa.addControl(new NavigationControl({ showCompass: false }), 'top-right');
  } else {
    // Sin interacción el lienzo no es un control: no entra en el orden de tabulación.
    mapa.getCanvas().removeAttribute('tabindex');
  }

  let errores = 0;
  mapa.on('error', (e) => {
    const msg = String((e as { error?: { message?: string } }).error?.message ?? '');
    if (/webgl/i.test(msg)) return o.alFallar('webgl');
    // Teselas que no llegan: casi siempre es la conexión.
    errores += 1;
    if (errores >= 2) o.alCambiarBase('sin_conexion');
  });
  mapa.on('data', (e) => {
    if ((e as { dataType?: string }).dataType === 'source' && meta && errores > 0 && navigator.onLine) {
      errores = 0;
      o.alCambiarBase('ok');
    }
  });

  await new Promise<void>((ok) => (mapa.loaded() ? ok() : mapa.once('load', () => ok())));

  mapa.addSource('cobertura', { type: 'geojson', data: geo([]) });
  mapa.addSource('zona', { type: 'geojson', data: geo([]) });
  mapa.addSource('precision', { type: 'geojson', data: geo([]) });
  mapa.addSource('trayecto', { type: 'geojson', data: geo([]), lineMetrics: false });
  mapa.addLayer({ id: 'cobertura', type: 'fill', source: 'cobertura', paint: { 'fill-color': COLORES_MAPA.zona, 'fill-opacity': 0.1 } });
  mapa.addLayer({ id: 'zona', type: 'fill', source: 'zona', paint: { 'fill-color': COLORES_MAPA.zona, 'fill-opacity': 0.14 } });
  mapa.addLayer({ id: 'zona-borde', type: 'line', source: 'zona', paint: { 'line-color': COLORES_MAPA.zona, 'line-width': 2.5, 'line-dasharray': [2, 1.5] } });
  mapa.addLayer({ id: 'trayecto-borde', type: 'line', source: 'trayecto', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': COLORES_MAPA.rutaBorde, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 13] } });
  mapa.addLayer({ id: 'trayecto', type: 'line', source: 'trayecto', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': COLORES_MAPA.ruta, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3.5, 17, 8] } });
  mapa.addLayer({ id: 'precision', type: 'fill', source: 'precision', paint: { 'fill-color': COLORES_MAPA.ruta, 'fill-opacity': 0.12 } });

  const fuente = (id: string) => mapa.getSource(id) as GeoJSONSource;
  const marcadores = new Map<string, Marker>();
  const marcador = (clave: string, p: Punto | null | undefined, crear: () => HTMLElement, ancla: 'center' | 'bottom' = 'center') => {
    const m = marcadores.get(clave);
    if (!p) {
      m?.remove();
      marcadores.delete(clave);
      return;
    }
    if (m) m.setLngLat([p.lng, p.lat]);
    else marcadores.set(clave, new Marker({ element: crear(), anchor: ancla }).setLngLat([p.lng, p.lat]).addTo(mapa));
  };
  let barriosDibujados = '';
  let tapadoAbajo = 0;

  const encuadre = (c: CapasMapa): LngLatBounds | null => {
    const pts: Punto[] = [];
    if (c.trayecto) pts.push(...c.trayecto);
    if (c.destino) pts.push(c.destino);
    if (c.posicion) pts.push(c.posicion.punto);
    if (c.zona) pts.push(...circulo(c.zona.centro, c.zona.radioM, 8));
    if (c.cobertura) for (const b of c.cobertura) pts.push(b.centro);
    if (c.radar) pts.push(c.radar);
    if (pts.length === 0) return null;
    const b = new LngLatBounds();
    for (const p of pts) b.extend([p.lng, p.lat]);
    return b;
  };

  let ultimas: CapasMapa = {};
  // Si la persona movió el mapa, no se lo volvemos a mover solo (hasta que toque "Centrar").
  let movidoAMano = false;
  mapa.on('movestart', (e) => {
    if ((e as { originalEvent?: Event }).originalEvent) movidoAMano = true;
  });

  const centrar = (c: CapasMapa) => {
    ultimas = c;
    movidoAMano = false;
    const b = encuadre(c);
    if (!b) return;
    const ancho = o.contenedor.clientWidth;
    const pad = Math.max(24, Math.min(64, ancho * 0.12));
    const abajo = Math.min(pad + tapadoAbajo, o.contenedor.clientHeight * 0.7);
    const duration = sinMovimiento() ? 0 : 600;
    const so = b.getSouthWest();
    const ne = b.getNorthEast();
    if (so.lng === ne.lng && so.lat === ne.lat) {
      // Un solo punto: zoom de cuadra, y corrido hacia arriba si una hoja tapa abajo.
      mapa.easeTo({ center: so, zoom: 15, offset: [0, -(abajo - pad) / 2], duration });
      return;
    }
    mapa.fitBounds(b, { padding: { top: pad, left: pad, right: pad, bottom: abajo }, maxZoom: 16, duration });
  };

  const observador = new ResizeObserver(() => {
    mapa.resize();
    if (!movidoAMano) centrar(ultimas);
  });
  observador.observe(o.contenedor);

  return {
    actualizar(c, encuadrar) {
      fuente('zona').setData(geo(c.zona ? [poligono(circulo(c.zona.centro, c.zona.radioM))] : []));
      fuente('trayecto').setData(geo(c.trayecto && c.trayecto.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: anillo(c.trayecto) } }] : []));
      fuente('precision').setData(geo(c.posicion && c.posicion.precisionM > 20 ? [poligono(circulo(c.posicion.punto, Math.min(c.posicion.precisionM, 2000)))] : []));
      fuente('cobertura').setData(geo((c.cobertura ?? []).map((b) => poligono(circulo(b.centro, 900)))));
      marcador('destino', c.destino, () => elemento('hx-mapa-pin', PIN), 'bottom');
      marcador('posicion', c.posicion?.punto, () => elemento('hx-mapa-yo', '<span></span>'));
      marcador('radar', c.radar, () => elemento('hx-mapa-radar', '<span></span><span></span><span></span>'));
      const clave = (c.cobertura ?? []).map((b) => b.id).join('|');
      if (clave !== barriosDibujados) {
        for (const [k, m] of marcadores) {
          if (k.startsWith('barrio:')) {
            m.remove();
            marcadores.delete(k);
          }
        }
        for (const b of c.cobertura ?? []) {
          marcador(`barrio:${b.id}`, b.centro, () => {
            const e = elemento('hx-mapa-barrio');
            e.textContent = b.nombre;
            return e;
          });
        }
        barriosDibujados = clave;
      }
      if (encuadrar) centrar(c);
      else ultimas = c;
    },
    centrar,
    margenAbajo(px) {
      tapadoAbajo = px;
    },
    destruir() {
      observador.disconnect();
      for (const m of marcadores.values()) m.remove();
      mapa.remove();
    },
  };
}
