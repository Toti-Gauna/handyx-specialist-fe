// Lector de texto del teléfono para la foto de la lista del corralón (H0-PreciosFoto, lote 2.2). Usa el detector de
// texto del propio navegador (Shape Detection API, `TextDetector`): la foto se procesa en el teléfono y NUNCA se manda a
// ningún servidor ni a una IA. Si el teléfono no tiene detector, no se manda nada: la pantalla ofrece cargar a mano.
// En la vista previa (mock) el lector es simulado (`lectorListaPrueba` de `@handyx/origen-datos`).
import { agruparRenglones, type BloqueTexto } from './lectura.ts';

export interface LectorLista {
  /** Renglones de texto de la foto, en orden. Falla si no se pudo leer. */
  leer(foto: Blob): Promise<string[]>;
  /** Simulado (vista previa): lo dice la pantalla. */
  simulado: boolean;
}

interface DetectorTexto {
  detect(imagen: ImageBitmapSource): Promise<Array<{ rawValue: string; boundingBox: DOMRectReadOnly }>>;
}
type ConstructorDetector = new () => DetectorTexto;

function constructorDetector(): ConstructorDetector | null {
  const g = globalThis as { TextDetector?: ConstructorDetector };
  return typeof g.TextDetector === 'function' ? g.TextDetector : null;
}

/** El lector del teléfono, o null si este teléfono no puede leer texto de una foto. */
export function lectorDelTelefono(): LectorLista | null {
  const Detector = constructorDetector();
  if (!Detector || typeof createImageBitmap !== 'function') return null;
  return {
    simulado: false,
    async leer(foto) {
      const imagen = await createImageBitmap(foto);
      try {
        const encontrados = await new Detector().detect(imagen);
        const bloques: BloqueTexto[] = encontrados.map((t) => ({ texto: t.rawValue, x: t.boundingBox.x, y: t.boundingBox.y, alto: t.boundingBox.height }));
        return agruparRenglones(bloques);
      } finally {
        imagen.close();
      }
    },
  };
}
