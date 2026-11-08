'use client';
// Detalle de un pedido (F-Pedido): lo que necesita el cliente, la zona aproximada, la franja que pidió, sus fotos y lo
// que sugiere Handyx. Desde acá se cotiza, se propone otra fecha o se deja pasar («Ahora no» no tiene ninguna
// consecuencia). Lo usan la hoja del Inicio y la pantalla /pedidos/detalle/ (desde un aviso). Nunca acepta nada y la
// dirección exacta llega recién cuando el cliente acepta.
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { RUTAS } from '../../app/rutas.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip, Cifra, Titulo } from '../../ui/atomos/Texto.tsx';
import { ArregloRubro } from '../../ui/ilustraciones/Arreglos.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { textoHorario } from '../../ui/logicaNucleo.ts';
import { textoDistancia } from '../../ui/logica.ts';
import { textoUrgencia, type VistaPedido } from './vista.ts';

export function ContenidoPedido({ v, ahora, hoy, armar = true }: { v: VistaPedido; ahora: Date; hoy: string; armar?: boolean }) {
  const urgencia = textoUrgencia(v, ahora);
  return (
    <div className="nu-pedido">
      <div className="nu-pedido__chips">
        {urgencia ? (
          <Chip tono="amarillo" icono="reloj">
            {urgencia}
          </Chip>
        ) : null}
        {v.sumaAlCamino ? (
          <Chip icono="estrella">+1 al camino si se verifica</Chip>
        ) : null}
      </div>
      <div className="nu-pedido__cabeza">
        <span className="nu-pedido__ilu">
          <ArregloRubro rubro={v.rubro} armar={armar} tam="chico" />
        </span>
        <div className="nu-pedido__nombre">
          <Titulo nivel={2} tam="medio" marcado={NOMBRE_RUBRO[v.rubro]} />
          <p>{v.titulo}</p>
        </div>
      </div>
      <div className="nu-pedido__filas">
        <FilaIcono icono="pin" titulo={`${v.zona} · zona aproximada`} detalle={`${v.distanciaM !== null ? `A ${textoDistancia(v.distanciaM)}. ` : ''}La dirección exacta llega cuando el cliente acepta.`} />
        <FilaIcono
          icono="reloj"
          titulo={v.horario ? textoHorario(v.horario, hoy) : v.tipo === 'urgente' ? 'Lo antes que puedas' : 'Sin horario pedido'}
          detalle={v.horario ? 'Lo pidió el cliente. Podés proponer otro horario.' : 'Proponé vos cuándo podés ir.'}
        />
        <FilaIcono icono="lista" titulo="Lo que cuenta el cliente" detalle={`«${v.descripcion}»`} borde={false} />
      </div>
      {v.fotos.length > 0 ? (
        <ul className="nu-pedido__fotos" aria-label="Fotos del cliente">
          {v.fotos.map((f, i) => (
            <li key={f.id}>
              <img src={f.url} alt={`Foto ${i + 1} que mandó el cliente`} loading="lazy" width={96} height={96} />
            </li>
          ))}
        </ul>
      ) : null}
      {v.sugeridoCentavos !== null ? (
        <p className="nu-pedido__sugiere">
          <span>Handyx sugiere</span>
          <Cifra centavos={v.sugeridoCentavos} tam="grande" />
        </p>
      ) : null}
    </div>
  );
}

/** Acciones del detalle: cotizar (la principal), proponer otra fecha o dejarlo pasar. */
export function AccionesPedido({ v, onAhoraNo, ocupado = false }: { v: VistaPedido; onAhoraNo?: () => void; ocupado?: boolean }) {
  if (!v.abierto) return null;
  const q = `?id=${v.id}`;
  return (
    <div className="nu-acciones-pedido">
      <div className="nu-acciones-pedido__fila">
        <BotonEnlace variante="contorno" icono="agenda" href={`${RUTAS.tuPrecio.ruta}${q}&paso=fecha`}>
          Otra fecha
        </BotonEnlace>
        <BotonEnlace href={`${RUTAS.tuPrecio.ruta}${q}`}>Cotizar</BotonEnlace>
      </div>
      {onAhoraNo ? (
        <Boton variante="texto" ocupado={ocupado} textoOcupado="Sacándolo de tu mapa…" onClick={onAhoraNo}>
          Ahora no · no tiene ninguna consecuencia
        </Boton>
      ) : null}
    </div>
  );
}
