// Barras de cómo varió un precio (H0-PrecioItem, lote 2.2): una barra por punto con su valor arriba y el mes abajo; la
// última, resaltada. Las barras son dibujo (`aria-hidden`); el lector recorre la misma información como lista. La
// altura de cada barra se fija desde código en la variable CSS --ui-alto (sin estilos inline).
import './historial.css';

export interface PuntoHistorial {
  rotulo: string;
  /** Valor para la altura (cualquier unidad, se escala al máximo). */
  valor: number;
  /** Lo que se ve arriba de la barra ("9,8"). */
  texto: string;
  /** Lo que escucha el lector ("Noviembre: $ 9.800"). */
  textoLector: string;
}

export function BarrasHistorial({ puntos, etiqueta }: { puntos: readonly PuntoHistorial[]; etiqueta: string }) {
  const max = Math.max(1, ...puntos.map((p) => p.valor));
  return (
    <div className="ui-historial">
      <div className="ui-historial__barras" aria-hidden="true">
        {puntos.map((p, i) => (
          <div key={`${p.rotulo}-${i}`} className={`ui-historial__col${i === puntos.length - 1 ? ' ui-historial__col--ultima' : ''}`}>
            <span className="ui-historial__valor">{p.texto}</span>
            <span className="ui-historial__barra" ref={(el) => el?.style.setProperty('--ui-alto', `${Math.max(8, Math.round((p.valor / max) * 100))}%`)} />
            <span className="ui-historial__rotulo">{p.rotulo}</span>
          </div>
        ))}
      </div>
      <ul className="visualmente-oculto" aria-label={etiqueta}>
        {puntos.map((p, i) => (
          <li key={`${p.rotulo}-${i}`}>{p.textoLector}</li>
        ))}
      </ul>
    </div>
  );
}
