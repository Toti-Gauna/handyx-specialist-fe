// Lo que el visor le da a una animación de las primitivas (ContextoVisor cumple con esto). Separado para que las
// primitivas no dependan del motor (y se puedan probar en Node).
export interface Animador {
  /** Animación cuadro a cuadro: `paso` recibe los ms desde el cuadro anterior y devuelve si sigue. */
  animar(paso: (dtMs: number) => boolean): () => void;
  pedirCuadro(): void;
  /** «Reducir movimiento»: se muestra el estado final, sin animar. */
  sinMovimiento: boolean;
}
