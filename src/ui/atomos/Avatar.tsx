// Avatar con iniciales (nunca fotos de personas reales en el kit) y avatar de grupo: un mosaico de iniciales como las
// conversaciones con varias personas del lienzo. Decorativos: el nombre siempre está escrito al lado.
import { iniciales, tonoAvatar } from '../logica.ts';

export function Avatar({ nombre, tam = 'medio' }: { nombre: string; tam?: 'chico' | 'medio' | 'grande' }) {
  return (
    <span className={`ui-avatar ui-avatar--${tam} ui-avatar--tono${tonoAvatar(nombre)}`} aria-hidden="true">
      {iniciales(nombre)}
    </span>
  );
}

/** Hasta cuatro iniciales en un mosaico de 2 × 2; si hay más, la última casilla dice "+N". */
export function AvatarGrupo({ nombres, tam = 'medio' }: { nombres: readonly string[]; tam?: 'medio' | 'grande' }) {
  const visibles = nombres.length > 4 ? nombres.slice(0, 3) : nombres.slice(0, 4);
  const resto = nombres.length - visibles.length;
  return (
    <span className={`ui-avatar-grupo ui-avatar-grupo--${tam} ui-avatar-grupo--n${Math.min(4, visibles.length + (resto > 0 ? 1 : 0))}`} aria-hidden="true">
      {visibles.map((n, i) => (
        <span key={`${n}-${i}`} className={`ui-avatar-grupo__celda ui-avatar--tono${tonoAvatar(n)}`}>
          {iniciales(n)}
        </span>
      ))}
      {resto > 0 ? <span className="ui-avatar-grupo__celda ui-avatar-grupo__resto">+{resto}</span> : null}
    </span>
  );
}
