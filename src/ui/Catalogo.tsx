'use client';
// Catálogo del kit v3 (lote 0.2). Solo en el mock (/catalogo/): cada pieza en uso, con datos sintéticos. Lo que en la
// app es fijo a la pantalla (pestañas, acción fija) se muestra dentro de un marco de celular que le sirve de pantalla.
// El kit v2 sigue en /catalogo/v2/.
import { useState, type ReactNode } from 'react';
import { BannerPrueba } from '../components/BannerPrueba.tsx';
import { RUBROS, NOMBRE_RUBRO, type Rubro } from '../contracts/rubros.ts';
import { Avatar, AvatarGrupo } from './atomos/Avatar.tsx';
import { Boton, BotonIcono } from './atomos/Boton.tsx';
import { Campo, Casilla, Interruptor, Radio } from './atomos/Controles.tsx';
import { Icono, NOMBRES_ICONO } from './atomos/Icono.tsx';
import { Anillo, BarraProgreso } from './atomos/Progreso.tsx';
import { Chip, Cifra, Etiqueta, Marcador, Separador, Titulo } from './atomos/Texto.tsx';
import { ArregloRubro, Cano, Casa } from './ilustraciones/Arreglos.tsx';
import { Ciudad } from './ilustraciones/Ciudad.tsx';
import { CajaRegalo, Desenchufado, EnObra, EscudoVerificado, Manual, Remera } from './ilustraciones/Estados.tsx';
import { opcionesHora, textoPaso, type MensajeChat } from './logica.ts';
import { Burbuja } from './moleculas/Burbuja.tsx';
import { CampoCodigo } from './moleculas/CampoCodigo.tsx';
import { Buscador, Segmento, Stepper } from './moleculas/Controles.tsx';
import { RuedaHora, TiraDias } from './moleculas/Fechas.tsx';
import { LineaTiempo } from './moleculas/LineaTiempo.tsx';
import { MarcadorPedido } from './moleculas/MarcadorPedido.tsx';
import { Mosaico, MosaicoHerramienta } from './moleculas/Mosaico.tsx';
import { ResumenOpciones, TecladoPrecio } from './moleculas/Precio.tsx';
import { DatoMini, FilaIcono, Tarjeta } from './moleculas/Tarjeta.tsx';
import { AccionesFijas, AccionFija } from './organismos/Acciones.tsx';
import { BarraPestanas } from './organismos/BarraPestanas.tsx';
import { BarraCompacta, CabeceraAzul } from './organismos/Cabeceras.tsx';
import { Calendario } from './organismos/Calendario.tsx';
import { EntradaChat, ListaChat } from './organismos/Chat.tsx';
import { EstadoError, EstadoVacio } from './organismos/EstadosPantalla.tsx';
import { Hoja, ModalFlotante } from './organismos/Hoja.tsx';
import { MapaArreglos, type PedidoMapa } from './organismos/MapaArreglos.tsx';
import { Qr } from './organismos/PantallaEscritorio.tsx';
import './catalogo.css';

const HOY = '2026-11-17';

// Pedidos de muestra: zonas aproximadas (centros de barrio), nunca direcciones.
const PEDIDOS: PedidoMapa[] = [
  { id: 'p1', rubro: 'plomeria', zona: 'La Perla', punto: { lat: -37.992, lng: -57.556 }, radioM: 600, sugeridoCentavos: 4_500_000, urgente: true },
  { id: 'p2', rubro: 'electricidad', zona: 'Centro', punto: { lat: -38.003, lng: -57.551 }, radioM: 500, sugeridoCentavos: 6_200_000 },
  { id: 'p3', rubro: 'gas', zona: 'Los Troncos', punto: { lat: -38.024, lng: -57.557 }, radioM: 600, sugeridoCentavos: 8_000_000 },
  { id: 'p4', rubro: 'cerrajeria', zona: 'Camino a Batán', punto: { lat: -38.0, lng: -57.64 }, radioM: 900, sugeridoCentavos: 3_800_000 },
  { id: 'p5', rubro: 'albanileria', zona: 'Batán', punto: { lat: -38.006, lng: -57.709 }, radioM: 900, sugeridoCentavos: 12_000_000 },
  { id: 'p6', rubro: 'aire_acondicionado', zona: 'Punta Mogotes', punto: { lat: -38.072, lng: -57.548 }, radioM: 700, sugeridoCentavos: 9_500_000 },
];

const MENSAJES: MensajeChat[] = [
  { id: 'm1', autor: 'otro', nombre: 'Lucía Ferreyra', texto: 'Hola, ¿podés venir el jueves a la tarde?', hora: '10:02' },
  { id: 'm2', autor: 'otro', nombre: 'Lucía Ferreyra', texto: 'La canilla de la cocina gotea mucho.', hora: '10:02' },
  { id: 'm3', autor: 'yo', nombre: 'Vos', texto: 'Sí, puedo de 16 a 18. Llevo el repuesto.', hora: '10:05', reacciones: ['👍'] },
  { id: 'm4', autor: 'otro', nombre: 'Lucía Ferreyra', texto: 'Perfecto, gracias.', hora: '10:06', editado: true },
];

function Bloque({ id, titulo, nota, children }: { id: string; titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="cat3-bloque" id={id} aria-labelledby={`cat3-${id}`}>
      <h2 id={`cat3-${id}`} className="cat3-bloque__titulo">
        {titulo}
      </h2>
      {nota ? <p className="cat3-nota">{nota}</p> : null}
      {children}
    </section>
  );
}

function Marco({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="cat3-marco" role="group" aria-label={etiqueta}>
      {children}
    </div>
  );
}

const INDICE = [
  ['atomos', 'Átomos'],
  ['ilustraciones', 'Ilustraciones'],
  ['moleculas', 'Moléculas'],
  ['fechas', 'Fechas y precio'],
  ['chat', 'Chat'],
  ['organismos', 'Organismos'],
  ['mapa', 'Mapa de arreglos'],
  ['estados', 'Estados'],
] as const;

export function CatalogoV3() {
  const [disponible, setDisponible] = useState(true);
  const [aviso, setAviso] = useState(true);
  const [radio, setRadio] = useState('mp');
  const [vuelta, setVuelta] = useState(0);
  const [segmento, setSegmento] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [cantidad, setCantidad] = useState(2);
  const [busqueda, setBusqueda] = useState('');
  const [dia, setDia] = useState<string | null>('2026-11-19');
  const [hora, setHora] = useState(16 * 60);
  const [precio, setPrecio] = useState(4_500_000);
  const [opcion, setOpcion] = useState<'simple' | 'completo' | null>('simple');
  const [codigo, setCodigo] = useState('');
  const [mes, setMes] = useState({ anio: 2026, mes: 11 });
  const [mensajes, setMensajes] = useState(MENSAJES);
  const [hoja, setHoja] = useState(false);
  const [modal, setModal] = useState(false);
  const [elegido, setElegido] = useState<string | null>(null);
  const [rubroArmado, setRubroArmado] = useState<Rubro>('plomeria');
  const pedido = PEDIDOS.find((p) => p.id === elegido) ?? null;

  return (
    <>
      <BannerPrueba />
      <main id="contenido" className="cat3">
        <header className="cat3-cabecera">
          <Etiqueta>Ola 0 · lote 0.2</Etiqueta>
          <h1 className="ui-titulo ui-titulo--grande">
            Catálogo del kit <Marcador>v3</Marcador>
          </h1>
          <p>Piezas atómicas para que la app la pueda usar una persona de 90 años: texto de 17 px, botones de 56 px, toques de 48 px, todo con texto y nunca solo color. Solo existe en la vista previa con datos de prueba.</p>
          <nav aria-label="Secciones del catálogo" className="cat3-indice">
            {INDICE.map(([id, texto]) => (
              <a key={id} href={`#${id}`}>
                {texto}
              </a>
            ))}
            <a href="./v2/">Kit v2</a>
          </nav>
        </header>

        <Bloque id="atomos" titulo="Átomos">
          <div className="cat3-pila">
            <Boton icono="enviar">Mandar precio</Boton>
            <Boton variante="contorno">Ver el detalle</Boton>
            <Boton variante="peligro">Rechazar el pedido</Boton>
            <Boton variante="amarilla" icono="regalo">
              Abrir el regalo
            </Boton>
            <Boton variante="exito" icono="check">
              Aceptar
            </Boton>
            <Boton ocupado textoOcupado="Mandando…">
              Mandar precio
            </Boton>
            <Boton variante="texto">Ahora no</Boton>
          </div>
          <div className="cat3-fila">
            <BotonIcono icono="campana" etiqueta="Avisos: 2 sin leer" punto />
            <BotonIcono icono="pin" etiqueta="Mis zonas" tono="azul" />
            <BotonIcono icono="cerrar" etiqueta="Cerrar" />
          </div>
          <div className="cat3-fila">
            <Chip icono="reloj">Hoy 16 a 18</Chip>
            <Chip tono="amarillo" icono="estrella">
              Nuevo
            </Chip>
            <Chip tono="noche" icono="agenda">
              Programado
            </Chip>
            <Chip tono="exito" icono="check">
              Verificado
            </Chip>
            <Chip tono="error" icono="wifi">
              Sin conexión
            </Chip>
            <Chip tono="gris">Plomería</Chip>
          </div>
          <Titulo antes="Tu precio, " marcado="tu decisión" />
          <div className="cat3-fila">
            <Cifra centavos={4_500_000} tam="grande" />
            <Cifra texto="12 km" />
            <Cifra centavos={120_000_000} tam="chico" />
          </div>
          <Separador texto="o" />
          <div className="cat3-fila">
            <Avatar nombre="Julián Ortiz" />
            <Avatar nombre="Lucía Ferreyra" tam="grande" />
            <AvatarGrupo nombres={['Martín Sosa', 'Carla Ibáñez']} />
            <AvatarGrupo nombres={['Sofía Ruiz', 'Diego Herrera', 'Pablo Vega']} />
            <AvatarGrupo nombres={['Sofía Ruiz', 'Diego Herrera', 'Pablo Vega', 'Julián Ortiz', 'Carla Ibáñez']} tam="grande" />
          </div>
          <div className="cat3-pila">
            <Interruptor encendido={aviso} onCambio={setAviso} etiqueta="Avisos de pedidos urgentes" textoEncendido="Te avisamos" textoApagado="No te avisamos" />
            <Casilla defaultChecked ayuda="Lo podés cambiar cuando quieras.">
              Acepto recibir pedidos programados
            </Casilla>
            <fieldset className="cat3-fieldset">
              <legend>Cómo te paga el cliente</legend>
              <Radio name="cat3-pago" checked={radio === 'mp'} onChange={() => setRadio('mp')}>
                Mercado Pago
              </Radio>
              <Radio name="cat3-pago" checked={radio === 'efectivo'} onChange={() => setRadio('efectivo')} ayuda="El pago va directo a vos.">
                Efectivo
              </Radio>
            </fieldset>
            <Campo etiqueta="Tu email" type="email" autoComplete="email" placeholder="nombre@example.test" ayuda="Te mandamos ahí el código." />
            <Campo etiqueta="Precio de la visita" inputMode="numeric" prefijo="$" defaultValue="300" error="Ese valor es muy bajo para una visita." />
          </div>
          <div className="cat3-pila">
            <p className="cat3-nota">{textoPaso(2, 5)}</p>
            <BarraProgreso hechas={8} total={10} extra={1} etiqueta="Tu camino" fondo="gris" />
            <div className="cat3-fila">
              <Anillo hechas={3} total={5} />
              <Anillo hechas={5} total={6} unidad="pasos" tam="grande" />
            </div>
          </div>
          <details className="cat3-iconos">
            <summary>Íconos ({NOMBRES_ICONO.length})</summary>
            <ul>
              {NOMBRES_ICONO.map((n) => (
                <li key={n}>
                  <Icono nombre={n} />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </details>
        </Bloque>

        <Bloque id="ilustraciones" titulo="Ilustraciones isométricas" nota="Siempre decorativas (aria-hidden): el texto de al lado dice lo importante. Con «reducir movimiento» se ven armadas.">
          <Ciudad tam="lleno" />
          <div className="cat3-fila" role="group" aria-label="Rubro del arreglo">
            {RUBROS.map((r) => (
              <Boton key={r} variante={r === rubroArmado ? 'primaria' : 'contorno'} chico bloque={false} aria-pressed={r === rubroArmado} onClick={() => setRubroArmado(r)}>
                {NOMBRE_RUBRO[r]}
              </Boton>
            ))}
          </div>
          <div className="cat3-arreglo">
            <ArregloRubro rubro={rubroArmado} armar vuelta={vuelta} tam="grande" />
            <p>
              <strong>{NOMBRE_RUBRO[rubroArmado]}:</strong> la ilustración «construye el arreglo» cuando llega o se cotiza un pedido.
            </p>
            <Boton variante="contorno" icono="reintentar" bloque={false} onClick={() => setVuelta((v) => v + 1)}>
              Volver a armar
            </Boton>
          </div>
          <ul className="cat3-grilla" aria-label="Objetos y estados">
            {RUBROS.map((r) => (
              <li key={r}>
                <ArregloRubro rubro={r} tam="chico" />
                {NOMBRE_RUBRO[r]}
              </li>
            ))}
            <li>
              <Cano tam="chico" />
              Caño
            </li>
            <li>
              <Casa tam="chico" />
              Casa
            </li>
            <li>
              <EscudoVerificado tam="chico" />
              Escudo verificado
            </li>
            <li>
              <Remera tam="chico" />
              Remera
            </li>
            <li>
              <Manual tam="chico" />
              Manual
            </li>
            <li>
              <CajaRegalo tam="chico" />
              Caja de regalo
            </li>
            <li>
              <Desenchufado tam="chico" />
              Desenchufado
            </li>
            <li>
              <EnObra tam="chico" />
              En obra
            </li>
          </ul>
        </Bloque>

        <Bloque id="moleculas" titulo="Moléculas">
          <Tarjeta franja={{ texto: 'Ver más información', href: '#moleculas' }}>
            <div className="cat3-fila">
              <Mosaico icono="gota" />
              <span>
                <strong>Cambiar el flexible del inodoro</strong>
                <br />
                <span className="cat3-nota">La Perla · zona aproximada</span>
              </span>
            </div>
            <div className="cat3-datos">
              <DatoMini rotulo="Sugerido" centavos={4_500_000} />
              <DatoMini rotulo="Distancia" texto="1,8 km" />
              <DatoMini rotulo="Cuándo" texto="Hoy" detalle="16 a 18" />
            </div>
          </Tarjeta>
          <Tarjeta etiqueta="Filas">
            <FilaIcono icono="billete" titulo="Cómo te paga el cliente" detalle="Mercado Pago y efectivo" href="#moleculas" />
            <FilaIcono icono="reloj" titulo="Último dato guardado" detalle="Hoy 17:40 · tus ingresos de noviembre" />
            <FilaIcono icono="escudo" titulo="Documentos" detalle="Cargados: falta que Operations los verifique" derecha={<Chip tono="gris">En revisión</Chip>} />
          </Tarjeta>
          <div className="cat3-mosaicos">
            <MosaicoHerramienta icono="nivel" titulo="Nivel y pendiente" detalle="Con el giroscopio" href="#moleculas" />
            <MosaicoHerramienta icono="rayo" titulo="Armador de tablero" detalle="En 3D" href="#moleculas" insignia={<Chip tono="amarillo">Nuevo</Chip>} />
          </div>
          <Segmento<'hoy' | 'semana' | 'mes'>
            etiqueta="Período"
            valor={segmento}
            onCambio={setSegmento}
            opciones={[
              { valor: 'hoy', texto: 'Hoy' },
              { valor: 'semana', texto: 'Semana' },
              { valor: 'mes', texto: 'Mes' },
            ]}
          />
          <Stepper valor={cantidad} onCambio={setCantidad} min={1} max={20} etiqueta="Cantidad de canillas" unidad="canillas" />
          <Buscador valor={busqueda} onCambio={setBusqueda} etiqueta="Buscar un material" ejemplo="Por ejemplo, flexible" />
          <LineaTiempo
            etiqueta="Etapas de la obra"
            pasos={[
              { titulo: 'Demolición', estado: 'hecho', detalle: 'Lunes 16' },
              { titulo: 'Instalación de caños', estado: 'actual', detalle: 'Hoy, de 9 a 13' },
              { titulo: 'Revoque y terminación', estado: 'pendiente', derecha: <Cifra centavos={18_000_000} tam="chico" /> },
            ]}
          />
          <CampoCodigo valor={codigo} onCambio={setCodigo} />
          <div className="cat3-fila cat3-fila--mapa">
            <MarcadorPedido rubro="plomeria" zona="La Perla" sugeridoCentavos={4_500_000} distanciaM={1800} urgente onTocar={() => setElegido('p1')} />
            <MarcadorPedido rubro="electricidad" zona="Centro" sugeridoCentavos={6_200_000} distanciaM={900} elegido onTocar={() => setElegido('p2')} />
          </div>
        </Bloque>

        <Bloque id="fechas" titulo="Fechas y precio">
          <TiraDias desde={HOY} hoy={HOY} valor={dia} onCambio={setDia} ocupados={['2026-11-18']} />
          <RuedaHora opciones={opcionesHora()} valor={hora} onCambio={setHora} etiqueta="Hora de llegada" />
          <Calendario anio={mes.anio} mes={mes.mes} hoy={HOY} valor={dia} onElegir={setDia} onMes={(anio, m) => setMes({ anio, mes: m })} conTrabajo={['2026-11-18', '2026-11-24']} />
          <TecladoPrecio centavos={precio} onCambio={setPrecio} />
          <ResumenOpciones<'simple' | 'completo'>
            etiqueta="Qué incluye tu precio"
            valor={opcion}
            onCambio={setOpcion}
            opciones={[
              { valor: 'simple', titulo: 'Solo mano de obra', resumen: 'El cliente compra los materiales', cifra: '$ 45.000' },
              { valor: 'completo', titulo: 'Con materiales', resumen: 'Vos llevás todo lo que hace falta', cifra: '$ 61.000' },
            ]}
          />
        </Bloque>

        <Bloque id="chat" titulo="Chat">
          <div className="cat3-chat">
            <ListaChat mensajes={mensajes} etiqueta="Conversación con Lucía Ferreyra" />
            <EntradaChat onMandar={(t) => setMensajes((l) => [...l, { id: `m${l.length + 1}`, autor: 'yo', nombre: 'Vos', texto: t, hora: '10:10' }])} onAdjuntar={() => undefined} />
          </div>
          <Burbuja m={{ id: 'x', autor: 'otro', nombre: 'Martín Sosa', texto: 'Mensaje suelto, con avatar y nombre.', hora: '09:12' }} />
        </Bloque>

        <Bloque id="organismos" titulo="Organismos" nota="Cabecera azul solo en Inicio; barra compacta en el resto; pestañas solo en las pantallas raíz.">
          <Marco etiqueta="Inicio con la cabecera azul y las pestañas">
            <CabeceraAzul hrefAvisos="#organismos" hrefZonas="#organismos" avisosNuevos={2} disponible={disponible} onDisponible={setDisponible} />
            <div className="cat3-marco__cuerpo">
              <p>{disponible ? 'Estás disponible: te llegan pedidos de tus zonas.' : 'No te llegan pedidos nuevos.'}</p>
            </div>
            <BarraPestanas insignias={{ mensajes: 2 }} />
          </Marco>
          <Marco etiqueta="Pantalla secundaria con la barra compacta y dos acciones">
            <BarraCompacta titulo="Pedido" subtitulo="Plomería · La Perla" hrefVolver="#organismos" />
            <div className="cat3-marco__cuerpo">
              <p>El contenido nunca queda tapado por la acción fija.</p>
            </div>
            <AccionesFijas textos={['Rechazar', 'Aceptar']}>
              <Boton variante="exito">Aceptar</Boton>
              <Boton variante="peligro">Rechazar</Boton>
            </AccionesFijas>
          </Marco>
          <Marco etiqueta="Acción fija con textos largos en columna">
            <BarraCompacta titulo="Error del servidor" hrefVolver="#organismos" />
            <div className="cat3-marco__cuerpo" />
            <AccionesFijas textos={['Reintentar', 'Hablar con soporte']}>
              <Boton>Reintentar</Boton>
              <Boton variante="contorno">Hablar con soporte</Boton>
            </AccionesFijas>
          </Marco>
          <Marco etiqueta="Una sola acción fija">
            <div className="cat3-marco__cuerpo" />
            <AccionFija nota="Handyx no te cobra comisión: el cliente te paga a vos.">
              <Boton>Mandar precio</Boton>
            </AccionFija>
          </Marco>
          <div className="cat3-pila">
            <Boton variante="contorno" onClick={() => setHoja(true)}>
              Abrir la hoja
            </Boton>
            <Boton variante="contorno" onClick={() => setModal(true)}>
              Abrir el modal
            </Boton>
          </div>
          <Hoja
            abierta={hoja}
            titulo="Cambiar el flexible del inodoro"
            onCerrar={() => setHoja(false)}
            pie={
              <Boton icono="enviar" onClick={() => setHoja(false)}>
                Mandar precio
              </Boton>
            }
          >
            <p>Plomería · La Perla (zona aproximada). La dirección exacta la ves cuando el cliente acepta.</p>
            <ArregloRubro rubro="plomeria" armar tam="medio" />
          </Hoja>
          <ModalFlotante
            abierta={modal}
            titulo="¿Cancelar el trabajo?"
            onCerrar={() => setModal(false)}
            pie={
              <>
                <Boton variante="peligro" onClick={() => setModal(false)}>
                  Sí, cancelar
                </Boton>
                <Boton variante="texto" onClick={() => setModal(false)}>
                  No, volver
                </Boton>
              </>
            }
          >
            <p>Le avisamos al cliente. Lo podés deshacer en los próximos 5 minutos.</p>
          </ModalFlotante>
          <div className="cat3-qr">
            <Qr texto="https://handyc.com/" etiqueta="Código QR de muestra" />
            <p>La pantalla de escritorio (X-Escritorio) se ve en pantallas de 900 px o más con mouse, con este QR local para abrir la app en el celular.</p>
          </div>
        </Bloque>

        <Bloque id="mapa" titulo="Mapa de arreglos" nota="Como Uber, pero de arreglos: tocá un pedido para ver el detalle (no se acepta desde el mapa). Probá «Me voy hasta…» con Batán.">
          <MapaArreglos pedidos={PEDIDOS} yo={{ lat: -38.0005, lng: -57.5516 }} elegido={elegido} onElegir={setElegido} entrante={PEDIDOS[0]} onVerEntrante={() => setElegido('p1')} />
          <Hoja abierta={pedido !== null} titulo={pedido ? `${NOMBRE_RUBRO[pedido.rubro]} · ${pedido.zona}` : ''} onCerrar={() => setElegido(null)} pie={<Boton onClick={() => setElegido(null)}>Ver el pedido</Boton>}>
            {pedido ? (
              <>
                <ArregloRubro rubro={pedido.rubro} armar tam="medio" />
                <p>Zona aproximada. {pedido.sugeridoCentavos !== null ? 'Handyx sugiere un precio; vos decidís el tuyo.' : ''}</p>
                {pedido.sugeridoCentavos !== null ? <Cifra centavos={pedido.sugeridoCentavos} tam="grande" /> : null}
              </>
            ) : null}
          </Hoja>
        </Bloque>

        <Bloque id="estados" titulo="Estados" nota="D6-Error y D6-Fallo: aparecen solos cuando no hay conexión o falla el servidor.">
          <EstadoError tipo="sin_conexion" nivel={2} onReintentar={() => undefined} extra={<FilaIcono icono="reloj" titulo="Último dato guardado" detalle="Hoy 17:40 · Tus ingresos de noviembre" />} />
          <EstadoError tipo="servidor" nivel={2} codigo="HX-503" onReintentar={() => undefined} hrefSoporte="#estados" />
          <EstadoVacio ilustracion={<Casa tam="medio" />} titulo="Todavía no hay pedidos" accion={<Boton variante="contorno">Ver mis zonas</Boton>}>
            <p>Cuando un vecino de tus zonas pida un arreglo, te aparece acá.</p>
          </EstadoVacio>
        </Bloque>
      </main>
    </>
  );
}
