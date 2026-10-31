// Los Handys, personajes de marca (mismas imágenes que la landing: Handy-landing-page-fe/src/img).
// Siempre decorativos: el texto de al lado dice lo que pasa, así que la imagen no tiene nombre accesible.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const HANDYS = {
  grupo: { archivo: 'handys-grupo', ancho: 600, alto: 311 },
  lamparita: { archivo: 'handy-lamparita', ancho: 202, alto: 346 },
  llave: { archivo: 'handy-llave', ancho: 581, alto: 547 },
  engranaje: { archivo: 'handy-engranaje', ancho: 338, alto: 339 },
  cano: { archivo: 'handy-cano', ancho: 354, alto: 405 },
  gota: { archivo: 'handy-gota', ancho: 93, alto: 125 },
  'lamparita-rota': { archivo: 'handy-lamparita-rota', ancho: 202, alto: 346 },
  'engranaje-roto': { archivo: 'handy-engranaje-roto', ancho: 338, alto: 339 },
  'llave-rota': { archivo: 'handy-llave-rota', ancho: 581, alto: 547 },
  'cano-roto': { archivo: 'handy-cano-roto', ancho: 354, alto: 405 },
} as const;

export type NombreHandy = keyof typeof HANDYS;

/** `diferida`: para imágenes que no están en la primera vista (por ejemplo, la de la 404, cuyo árbol viaja en todas las
 * páginas exportadas): así no se precargan en cada pantalla. */
export function Handy({ nombre, alto = 96, className = '', diferida = false }: { nombre: NombreHandy; alto?: number; className?: string; diferida?: boolean }) {
  const h = HANDYS[nombre];
  return (
    <img
      className={`handy ${className}`.trim()}
      src={`${base}/handys/${h.archivo}.webp`}
      alt=""
      aria-hidden="true"
      width={Math.round((h.ancho * alto) / h.alto)}
      height={alto}
      decoding="async"
      loading={diferida ? 'lazy' : undefined}
    />
  );
}
