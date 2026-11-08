// Burbuja de chat del lienzo: el avatar va pegado a la burbuja (solo en el último mensaje seguido), el nombre y la
// hora van adentro, las reacciones en el borde y "editado" escrito. Para el lector, cada burbuja dice quién y cuándo.
import { Avatar } from '../atomos/Avatar.tsx';
import type { MensajeChat } from '../logica.ts';

export function Burbuja({ m, primero = true, ultimo = true }: { m: MensajeChat; primero?: boolean; ultimo?: boolean }) {
  const mia = m.autor === 'yo';
  return (
    <div className={`ui-burbuja${mia ? ' ui-burbuja--mia' : ''}${ultimo ? ' ui-burbuja--ultima' : ''}`}>
      {!mia ? <span className="ui-burbuja__lado">{ultimo ? <Avatar nombre={m.nombre} tam="chico" /> : null}</span> : null}
      <div className="ui-burbuja__globo">
        {primero && !mia ? <strong className="ui-burbuja__nombre">{m.nombre}</strong> : null}
        {mia ? <span className="visualmente-oculto">Vos dijiste:</span> : null}
        {!mia && !primero ? <span className="visualmente-oculto">{m.nombre} dijo:</span> : null}
        <p className="ui-burbuja__texto">{m.texto}</p>
        <span className="ui-burbuja__pie">
          {m.editado ? <span>editado ·</span> : null}
          <time>{m.hora}</time>
        </span>
        {m.reacciones && m.reacciones.length > 0 ? (
          <span className="ui-burbuja__reacciones" role="img" aria-label={`Reacciones: ${m.reacciones.join(' ')}`}>
            {m.reacciones.join(' ')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
