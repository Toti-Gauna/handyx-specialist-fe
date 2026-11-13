'use client';
// Catálogo del kit Handyx v2 (lote 4.1). Solo en el mock (/catalogo/): cada pieza en uso, con datos sintéticos.
// Las piezas que en la app son fijas a la pantalla (barra, pestañas, hoja, botón fijo) se muestran dentro de un marco
// de celular (data-hx-marco), que les sirve de pantalla.
import { useState, type ReactNode } from 'react';
import './catalogo.css';
import { BannerPrueba } from '../components/BannerPrueba.tsx';
import { Handy, type NombreHandy } from '../components/Handy.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { pesosDesdeCentavos } from '../lib/formato.ts';
import { useConfeti, useIsla } from './Efectos.tsx';
import { CalendarioMes, SelectorHora, TiraDias } from './Fechas.tsx';
import { HojaArrastrable } from './HojaArrastrable.tsx';
import { BarraSuperior, PestanasFlotantes, type ItemPestana } from './Navegacion.tsx';
import { Avatar, BotonFijo, ChipOpcion, EstadoVacio, Fila, LineaDeTiempo, MontoGrande, Mosaico, Tilde } from './Piezas.tsx';
import { PrecioStepper } from './Precio.tsx';
import { Mapa } from '../mapa/Mapa.tsx';
import { desplazar } from '../lib/geo.ts';

const HOY = '2026-11-17';
// Puntos de muestra para las capas del mapa (sintéticos: no son hogares ni bases reales).
const M_DESTINO = { lat: -38.0152, lng: -57.5481 };
const M_YO = desplazar(M_DESTINO, 1800, 300);
const M_BARRIOS = [
  { id: 'Centro', nombre: 'Centro', centro: { lat: -38.0005, lng: -57.547 } },
  { id: 'La Perla', nombre: 'La Perla', centro: { lat: -37.9905, lng: -57.553 } },
  { id: 'Güemes', nombre: 'Güemes', centro: { lat: -38.014, lng: -57.545 } },
];
const PESTANAS: ItemPestana[] = [
  { href: '/inicio/', texto: 'Inicio', icono: 'casa' },
  { href: '/agenda/', texto: 'Agenda', icono: 'calendario' },
  { href: '/mensajes/', texto: 'Mensajes', icono: 'chat', insignia: 2 },
  { href: '/cuenta/', texto: 'Cuenta', icono: 'usuario' },
];
const RUBROS: { id: string; texto: string; icono: NombreIcono; nota?: string }[] = [
  { id: 'electricidad', texto: 'Electricidad', icono: 'rayo' },
  { id: 'plomeria', texto: 'Plomería', icono: 'canilla' },
  { id: 'gas', texto: 'Gas', icono: 'llama', nota: 'Pide matrícula' },
  { id: 'cerrajeria', texto: 'Cerrajería', icono: 'llave' },
  { id: 'albanileria', texto: 'Albañilería', icono: 'ladrillos' },
  { id: 'aire', texto: 'Aire acondi\u00adcionado', icono: 'aire', nota: 'Pide matrícula' },
];
const FRANJAS = ['Hoy, de 16 a 18 h', 'Hoy, de 18 a 20 h', 'Mañana, de 9 a 11 h', 'Mañana, de 14 a 16 h'];
const HANDYS: NombreHandy[] = ['grupo', 'lamparita', 'llave', 'engranaje', 'cano', 'gota', 'lamparita-rota', 'llave-rota', 'engranaje-roto', 'cano-roto'];
const COLORES: [string, string][] = [
  ['Azul Handyx', '--hd-azul'],
  ['Azul hondo', '--hd-azul-hondo'],
  ['Noche', '--hd-noche'],
  ['Amarillo', '--hd-amarillo'],
  ['Mosaico', '--hd-mosaico'],
  ['Hueso', '--color-hueso'],
  ['Éxito', '--hd-exito-boton'],
  ['Error', '--hd-error'],
];

function Bloque({ id, titulo, children, nota }: { id: string; titulo: string; children: ReactNode; nota?: string }) {
  return (
    <section className="cat-bloque" aria-labelledby={`cat-${id}`} id={id}>
      <h2 id={`cat-${id}`} className="cat-bloque__titulo">
        {titulo}
      </h2>
      {nota ? <p className="texto-suave">{nota}</p> : null}
      {children}
    </section>
  );
}

function Marco({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="cat-marco" data-hx-marco role="group" aria-label={etiqueta}>
      <div className="cat-marco__pantalla">{children}</div>
    </div>
  );
}

export function Catalogo() {
  const isla = useIsla();
  const confeti = useConfeti();
  const [rubros, setRubros] = useState<string[]>(['plomeria', 'gas']);
  const [franja, setFranja] = useState(FRANJAS[0] ?? '');
  const [dia, setDia] = useState<string | null>(HOY);
  const [mes, setMes] = useState({ anio: 2026, mes: 11 });
  const [diaCal, setDiaCal] = useState<string | null>('2026-11-19');
  const [hora, setHora] = useState({ h: 10, m: 0 });
  const [precio, setPrecio] = useState(4_400_000);
  const [ganancia, setGanancia] = useState(3_194_800);

  return (
    <>
      <BannerPrueba />
      <main id="contenido" className="cat">
        <header className="cat-cabecera">
          <p className="sobre">Fase 4 · lote 4.1</p>
          <h1 className="hx-titulo cat-cabecera__titulo">
            Catálogo del kit <span className="hx-marca">Handyx</span>
          </h1>
          <p className="texto-suave">Las piezas de las pantallas rediseñadas, en uso. Solo existe en la vista previa con datos de prueba.</p>
          <nav aria-label="Piezas del kit" className="cat-indice">
            {[
              ['marca', 'Marca'],
              ['navegacion', 'Navegación'],
              ['hoja', 'Hoja'],
              ['isla', 'Isla'],
              ['mosaicos', 'Mosaicos y chips'],
              ['fechas', 'Fechas'],
              ['precio', 'Precio'],
              ['celebrar', 'Celebrar'],
              ['personas', 'Personas y listas'],
              ['estados', 'Estados'],
              ['handys', 'Handys'],
              ['mapa', 'Mapa'],
            ].map(([id, t]) => (
              <a key={id} href={`#${id}`} className="hx-chip">
                {t}
              </a>
            ))}
          </nav>
        </header>

        <Bloque id="marca" titulo="Marca y tokens" nota="Colores de la marca, títulos en Archivo 900 ensanchado con el marcador amarillo, y botones con base que se hunde.">
          <ul className="cat-colores">
            {COLORES.map(([n, v]) => (
              <li key={v}>
                <span className={`cat-muestra cat-muestra--${v.replace(/^--(hd|color)-/, '')}`} aria-hidden="true" />
                <strong>{n}</strong>
                <code className="codigo">{v}</code>
              </li>
            ))}
          </ul>
          <p className="hx-titulo cat-ejemplo-titulo">
            Arreglá la <span className="hx-marca">pérdida</span> de la cocina
          </p>
          <div className="botones botones--fila">
            <button type="button" className="boton">
              Enviar propuesta
            </button>
            <button type="button" className="boton boton--exito">
              <Icono nombre="check" /> Aceptar
            </button>
            <button type="button" className="boton boton--claro">
              Contraofertar
            </button>
            <button type="button" className="boton boton--peligro">
              <Icono nombre="cerrar" /> Rechazar
            </button>
          </div>
        </Bloque>

        <Bloque id="navegacion" titulo="Barra superior y pestañas flotantes" nota="La cabecera con logo queda solo en Inicio. Acá: título grande que se achica al bajar, y las pestañas flotantes de las pantallas raíz.">
          <div className="cat-marcos">
            <Marco etiqueta="Ejemplo: pantalla raíz con título grande">
              <BarraSuperior titulo="Mensajes" grande acciones={<button type="button" className="hx-circulo" aria-label="Buscar"><Icono nombre="lupa" /></button>}>
                <div className="hx-con-pestanas cat-relleno">
                  <ul className="hx-lista">
                    {['Cliente De Prueba 2', 'Cliente De Prueba 5', 'Cliente De Prueba 6', 'Cliente De Prueba 8', 'Cliente De Prueba 9', 'Cliente De Prueba 11'].map((n) => (
                      <li key={n}>
                        <button type="button" className="hx-fila">
                          <Avatar nombre={n} />
                          <span className="hx-fila__texto">
                            <strong>{n}</strong>
                            <small>Plomería · solicitud nueva</small>
                          </span>
                          <Icono nombre="derecha" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <PestanasFlotantes items={PESTANAS} actual="/mensajes/" />
              </BarraSuperior>
            </Marco>
            <Marco etiqueta="Ejemplo: detalle con barra compacta y botón fijo">
              <BarraSuperior titulo="Plomería · La Perla" atras="#navegacion" textoAtras="Volver a Pedidos">
                <div className="cat-relleno pila">
                  <p className="texto-suave">Pérdida debajo de la bacha de la cocina: sale agua al abrir la canilla.</p>
                  <div className="tarjeta">
                    <p className="sobre">Zona aproximada</p>
                    <p>La Perla · a 2,3 km</p>
                  </div>
                  <p className="texto-suave">Todavía no ves el nombre ni la dirección exacta: se muestran cuando el cliente te elige.</p>
                  <BotonFijo nota="Abrir el pedido nunca acepta nada.">
                    <button type="button" className="boton boton--bloque">
                      Ver y cotizar
                    </button>
                  </BotonFijo>
                </div>
              </BarraSuperior>
            </Marco>
          </div>
        </Bloque>

        <Bloque id="hoja" titulo="Hoja arrastrable" nota="No es modal: el mapa de atrás sigue usable. Arrastrá la manija, tocala o usá las flechas.">
          <Marco etiqueta="Ejemplo: hoja sobre el mapa">
            <div className="cat-mapa" aria-hidden="true" />
            <HojaArrastrable titulo="Pedidos para vos">
              <ul className="hx-lista">
                {['Plomería · La Perla', 'Gas · Los Troncos', 'Electricidad · Centro'].map((t) => (
                  <li key={t}>
                    <Fila icono="pin" titulo={t} detalle="Hoy · zona aproximada" href="#hoja" />
                  </li>
                ))}
              </ul>
            </HojaArrastrable>
          </Marco>
        </Bloque>

        <Bloque id="isla" titulo="Isla de avisos" nota="Baja desde arriba, se anuncia por lector de pantalla y se va sola, salvo que la toques. Lo que dice también queda en Avisos.">
          <div className="botones botones--fila">
            <button type="button" className="boton boton--exito" onClick={() => isla({ titulo: '¡El cliente te eligió!', texto: 'Plomería en La Perla. Ya podés ir para allá.', icono: 'checkCirculo', tono: 'exito' })}>
              Te eligieron
            </button>
            <button type="button" className="boton" onClick={() => isla({ titulo: 'Nuevo pedido de plomería', texto: 'La Perla, a 2,3 km. Abrilo para ver el detalle.', icono: 'canilla' })}>
              Pedido nuevo
            </button>
            <button type="button" className="boton boton--amarillo" onClick={() => isla({ titulo: 'Cobro registrado', texto: `${pesosDesdeCentavos(4_770_000)} directo a tu cuenta.`, icono: 'billetera', tono: 'amarillo' })}>
              Cobro registrado
            </button>
          </div>
        </Bloque>

        <Bloque id="mosaicos" titulo="Mosaicos y chips" nota="Lo elegido se ve azul y con tilde, además del color.">
          <div className="cat-angosto">
          <ul className="hx-mosaicos" aria-label="Rubros">
            {RUBROS.map((r) => (
              <li key={r.id}>
                <Mosaico icono={r.icono} texto={r.texto} nota={r.nota} elegido={rubros.includes(r.id)} onCambio={(v) => setRubros((x) => (v ? [...x, r.id] : x.filter((i) => i !== r.id)))} />
              </li>
            ))}
          </ul>
          </div>
          <ul className="hx-chips hx-chips--carril" aria-label="Franjas para ir">
            {FRANJAS.map((f) => (
              <li key={f}>
                <ChipOpcion texto={f} icono="reloj" elegido={franja === f} onClick={() => setFranja(f)} />
              </li>
            ))}
          </ul>
        </Bloque>

        <Bloque id="fechas" titulo="Fechas y horas" nota="Elegir una fecha es una solicitud: la otra parte la acepta, la rechaza o propone otra.">
          <TiraDias desde="2026-11-15" hoy={HOY} minimo={HOY} elegido={dia} onElegir={setDia} />
          <div className="cat-dos">
            <CalendarioMes anio={mes.anio} mes={mes.mes} onCambiarMes={(anio, m) => setMes({ anio, mes: m })} hoy={HOY} elegido={diaCal} onElegir={setDiaCal} marcas={{ '2026-11-18': 1, '2026-11-19': 2, '2026-11-24': 1 }} />
            <div className="pila">
              <SelectorHora hora={hora.h} minuto={hora.m} onCambio={(h, m) => setHora({ h, m })} />
              <p className="centrado" aria-live="polite">
                Elegiste las <strong>{`${String(hora.h).padStart(2, '0')}:${String(hora.m).padStart(2, '0')} h`}</strong>
              </p>
            </div>
          </div>
        </Bloque>

        <Bloque id="precio" titulo="Tu precio" nota="Handyx sugiere un precio por rubro y tipo; vos decidís. La tarifa de Handyx (0 % en la demo) se muestra aparte.">
          <div className="cat-angosto">
            <PrecioStepper valor={precio} onCambio={setPrecio} sugerido={4_400_000} tarifaBps={0} minimo={500_000} />
          </div>
        </Bloque>

        <Bloque id="celebrar" titulo="Celebrar" nota="Solo al ganar un trabajo, al terminarlo o al registrar un cobro. Nunca en decisiones pendientes ni en vencimientos.">
          <div className="cat-celebrar">
            <Tilde />
            <p className="hx-titulo cat-ejemplo-titulo">
              ¡Terminaste el <span className="hx-marca">trabajo</span>!
            </p>
            <p className="sobre">Ganaste</p>
            <MontoGrande centavos={ganancia} />
            <button
              type="button"
              className="boton"
              onClick={() => {
                setGanancia((g) => (g === 3_194_800 ? 4_770_000 : 3_194_800));
                confeti.lanzar();
              }}
            >
              Probar la celebración
            </button>
            {confeti.capa}
          </div>
        </Bloque>

        <Bloque id="personas" titulo="Personas y listas" nota="Avatares con iniciales: el tilde de verificado aparece solo cuando lo dice el servidor.">
          <div className="fila-flex">
            <Avatar nombre="Especialista De Prueba" tamano="grande" verificado />
            <Avatar nombre="Cliente De Prueba 2" />
            <Avatar nombre="Cliente La Perla" />
            <Avatar nombre="Cliente Los Troncos" tamano="chico" />
          </div>
          <ul className="hx-lista">
            <li>
              <Fila icono="usuario" titulo="Datos personales" detalle="Nombre, nacimiento y ciudad" href="#personas" />
            </li>
            <li>
              <Fila icono="maletin" titulo="Rubros y zonas" detalle="Plomería y Gas · 4 barrios" href="#personas" />
            </li>
            <li>
              <Fila icono="billetera" titulo="Cobros" detalle="Mercado Pago o efectivo, directo a vos" href="#personas" />
            </li>
          </ul>
          <LineaDeTiempo
            pasos={[
              { titulo: 'Enviaste tu alta', detalle: 'mar 17/11 · 10:00', estado: 'hecho' },
              { titulo: 'Operations revisa tus documentos', detalle: 'Suele tardar 1 o 2 días hábiles', estado: 'actual' },
              { titulo: 'Verificación presencial de antecedentes', estado: 'pendiente' },
              { titulo: 'Alta habilitada', estado: 'pendiente' },
            ]}
          />
        </Bloque>

        <Bloque id="estados" titulo="Estados vacíos" nota="Un Handy contento dice qué va a aparecer y cómo hacer que aparezca.">
          <EstadoVacio
            handy="engranaje"
            titulo="Todavía no hay pedidos para vos"
            accion={
              <button type="button" className="boton">
                Activar mi disponibilidad
              </button>
            }
          >
            Cuando estés disponible, los pedidos de tus zonas aparecen acá por orden de llegada.
          </EstadoVacio>
        </Bloque>

        <Bloque id="mapa" titulo="Mapa (lote 4.3)" nota="MapLibre con el estilo Handyx. Antes del acuerdo, solo una zona aproximada; con trabajo, el destino, tu posición y el trayecto. Si el mapa no carga, queda el texto.">
          <Mapa etiqueta="Zona aproximada de un pedido en Güemes" alto="chico" zona={{ centro: desplazar(M_DESTINO, 260, 40), radioM: 700 }} alternativa={<p>Zona aproximada: Güemes</p>} />
          <Mapa
            etiqueta="Trayecto de muestra hasta el destino"
            alto="grande"
            interactivo
            conCentrar
            destino={M_DESTINO}
            posicion={{ punto: M_YO, precisionM: 12 }}
            trayecto={[M_YO, M_DESTINO]}
            alternativa={<p>Destino a 1,8 km</p>}
          />
          <p className="texto-suave texto-chico">El trayecto de muestra va en línea recta: los de la app siguen las calles y los calcula el servidor.</p>
          <Mapa etiqueta="Tus barrios de cobertura" alto="medio" cobertura={M_BARRIOS} radar={M_BARRIOS[0]?.centro ?? null} alternativa={<p>Centro, La Perla y Güemes</p>} />
        </Bloque>

        <Bloque id="handys" titulo="Handys" nota="Siempre decorativos: el texto de al lado dice lo que pasa. Las poses nuevas llegan con docs/handys-prompt.md.">
          <ul className="cat-handys">
            {HANDYS.map((h) => (
              <li key={h}>
                <Handy nombre={h} alto={h === 'grupo' ? 80 : 90} />
                <code className="codigo">{h}</code>
              </li>
            ))}
          </ul>
        </Bloque>
      </main>
    </>
  );
}
