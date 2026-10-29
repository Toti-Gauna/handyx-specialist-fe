// Guarda del build de producción (Hostinger): exige la API real y nunca publica fixtures.
const origen = process.env.NEXT_PUBLIC_DATA_SOURCE;
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const errores = [];
if (origen !== 'http') errores.push('NEXT_PUBLIC_DATA_SOURCE tiene que ser "http" en producción (nunca mock).');
if (!base.startsWith('https://')) errores.push('NEXT_PUBLIC_API_BASE_URL tiene que ser una URL https.');
if (errores.length) {
  console.error(`Build de producción rechazado:\n- ${errores.join('\n- ')}`);
  process.exit(1);
}
