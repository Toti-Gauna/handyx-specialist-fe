// Forma de una ruta de la PWA (exportación estática: cada ruta es una carpeta con index.html).
// `lote`: dónde se construye la pantalla (docs/plan.md, docs/plan-olas.md). Mapa completo de pantallas: docs/screens.md.
export interface Ruta {
  ruta: string;
  titulo: string;
  lote: string;
  descripcion: string;
}
