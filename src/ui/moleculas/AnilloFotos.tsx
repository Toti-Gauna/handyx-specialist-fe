// Anillo de tomas del escaneo 3D (lote 2.4, T-Escanear): un punto por foto alrededor del objeto, amarillo si ya se sacó.
// Decorativo: el avance va escrito en el chip («18 de 30 fotos») y se anuncia en texto.
import '../herramientas.css';

export function AnilloFotos({ tomadas, total }: { tomadas: number; total: number }) {
  const r = 130;
  return (
    <svg className="ui-anillo-fotos" viewBox="-160 -160 320 320" aria-hidden="true" focusable="false">
      {Array.from({ length: total }, (_, i) => {
        const a = (2 * Math.PI * i) / total - Math.PI / 2;
        return <circle key={i} cx={Math.round(r * Math.cos(a) * 10) / 10} cy={Math.round(r * Math.sin(a) * 10) / 10} r={7} className={i < tomadas ? 'ui-anillo-fotos__hecha' : 'ui-anillo-fotos__falta'} />;
      })}
    </svg>
  );
}
