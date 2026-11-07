// Antes de mandar algo a la IA del Taller (fase H1.3): sin datos personales. Lógica pura con pruebas.
// - Texto: se quitan emails, teléfonos, direcciones con altura y documentos. Se muestra al profesional qué se quitó.
// - Fotos: se achican (lado mayor ≤ 1280 px) y se vuelven a codificar en el teléfono, lo que borra los metadatos
//   (ubicación GPS, modelo del celular, fecha). La parte de canvas está en `prepararFoto` (solo navegador).

export const LADO_MAXIMO_FOTO = 1280;

const PATRONES: { nombre: string; re: RegExp; reemplazo: string }[] = [
  { nombre: 'email', re: /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, reemplazo: '[email]' },
  // Documentos: DNI con o sin puntos y CUIT/CUIL con o sin guiones.
  { nombre: 'documento', re: /\b(\d{2}-?\d{8}-?\d|\d{1,2}\.\d{3}\.\d{3})\b/g, reemplazo: '[documento]' },
  // Teléfonos argentinos: +54, 0223, 15, con espacios o guiones; al menos 8 dígitos en total.
  { nombre: 'teléfono', re: /(\+?54[\s-]?)?(\(?0?\d{2,4}\)?[\s-]?)?(15[\s-]?)?\d{3,4}[\s-]?\d{4}\b/g, reemplazo: '[teléfono]' },
  // Direcciones con altura: «calle Falsa 123», «Av. Colón 1234», «Independencia 2050».
  { nombre: 'dirección', re: /\b(calle|av\.?|avenida|pasaje|diagonal|ruta)\s+[\wáéíóúñ.]+(\s+[\wáéíóúñ.]+){0,3}\s+\d{2,5}\b/gi, reemplazo: '[dirección]' },
];

export interface TextoLimpio {
  texto: string;
  /** Qué tipos de dato se quitaron (para avisarle al profesional). */
  quitados: string[];
}

export function limpiarTexto(entrada: string): TextoLimpio {
  let texto = entrada;
  const quitados: string[] = [];
  for (const p of PATRONES) {
    const nuevo = texto.replace(p.re, p.reemplazo);
    if (nuevo !== texto && !quitados.includes(p.nombre)) quitados.push(p.nombre);
    texto = nuevo;
  }
  return { texto: texto.replace(/\s{2,}/g, ' ').trim(), quitados };
}

/** Medidas finales de una foto para que el lado mayor no pase de `maximo` (nunca agranda). */
export function medidasReducidas(ancho: number, alto: number, maximo = LADO_MAXIMO_FOTO): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo || mayor <= 0) return { ancho, alto };
  const f = maximo / mayor;
  return { ancho: Math.round(ancho * f), alto: Math.round(alto * f) };
}

/** Solo navegador: achica la foto y la vuelve a codificar como JPEG (sin metadatos). */
export async function prepararFoto(archivo: Blob): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const { ancho, alto } = medidasReducidas(imagen.width, imagen.height);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const g = lienzo.getContext('2d');
  if (!g) throw new Error('sin canvas');
  g.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();
  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/jpeg', 0.85));
}
