// Rubros de Handyx. Los id coinciden con el enum `rubro` de Handy-landing-page-be y con rubros.json de la landing.
export const RUBROS = ['electricidad', 'plomeria', 'gas', 'cerrajeria', 'albanileria', 'aire_acondicionado'] as const;
export type Rubro = (typeof RUBROS)[number];

export const NOMBRE_RUBRO: Record<Rubro, string> = {
  electricidad: 'Electricidad',
  plomeria: 'Plomería',
  gas: 'Gas',
  cerrajeria: 'Cerrajería',
  albanileria: 'Albañilería',
  aire_acondicionado: 'Aire acondicionado',
};

// Rubros que exigen matrícula o certificación revisada por Operations antes de habilitarse.
// Una foto cargada no habilita el rubro: hace falta que la revisión quede en `verificado`.
export const RUBROS_CON_MATRICULA: readonly Rubro[] = ['gas', 'aire_acondicionado'];

export const requiereMatricula = (rubro: Rubro): boolean => RUBROS_CON_MATRICULA.includes(rubro);
